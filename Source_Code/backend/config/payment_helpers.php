<?php
require_once __DIR__ . "/inventory_helpers.php";

function getPaymentConfig() {
    static $config = null;

    if ($config === null) {
        $config = require __DIR__ . "/payment.php";
    }

    return $config;
}

function buildTransactionCode($transactionId, $dateTime = null) {
    $datePart = $dateTime ? date("Ymd", strtotime($dateTime)) : date("Ymd");
    return "LOC-" . $datePart . "-" . str_pad((string) $transactionId, 5, "0", STR_PAD_LEFT);
}

function ensureTransactionOperationalColumns(PDO $connection): void {
    static $initialized = false;

    if ($initialized) {
        return;
    }

    $connection->exec(
        "ALTER TABLE transactions
          ADD COLUMN IF NOT EXISTS customer_name varchar(120) DEFAULT NULL AFTER payment_note,
          ADD COLUMN IF NOT EXISTS void_reason varchar(255) DEFAULT NULL AFTER customer_name,
          ADD COLUMN IF NOT EXISTS voided_by int(11) DEFAULT NULL AFTER void_reason,
          ADD COLUMN IF NOT EXISTS voided_at datetime DEFAULT NULL AFTER voided_by"
    );

    $initialized = true;
}

function normalizeLocalPaymentStatus($status) {
    switch (strtolower(trim((string) $status))) {
        case "paid":
            return "Paid";
        case "pending":
            return "Pending";
        case "voided":
            return "Voided";
        case "expired":
            return "Expired";
        case "denied":
            return "Denied";
        case "cancelled":
            return "Cancelled";
        case "failed":
            return "Failed";
        case "refunded":
            return "Refunded";
        case "challenge":
            return "Challenge";
        default:
            $value = trim((string) $status);
            return $value !== "" ? ucfirst($value) : "Pending";
    }
}

function shouldApplyInventoryOnPaymentStatusChange($previousStatus, $nextStatus) {
    return normalizeLocalPaymentStatus($previousStatus) !== "Paid"
        && normalizeLocalPaymentStatus($nextStatus) === "Paid";
}

function shouldRestoreInventoryOnVoid($previousStatus, $nextStatus) {
    return normalizeLocalPaymentStatus($previousStatus) === "Paid"
        && normalizeLocalPaymentStatus($nextStatus) === "Voided";
}

function getTransactionById(PDO $connection, $transactionId, $forUpdate = false) {
    $query = "SELECT * FROM transactions WHERE id = :id LIMIT 1";
    if ($forUpdate) {
        $query .= " FOR UPDATE";
    }

    $statement = $connection->prepare($query);
    $statement->execute([":id" => $transactionId]);
    return $statement->fetch(PDO::FETCH_ASSOC);
}

function getTransactionByCode(PDO $connection, $transactionCode, $forUpdate = false) {
    $query = "SELECT * FROM transactions WHERE transaction_code = :transaction_code LIMIT 1";
    if ($forUpdate) {
        $query .= " FOR UPDATE";
    }

    $statement = $connection->prepare($query);
    $statement->execute([":transaction_code" => $transactionCode]);
    return $statement->fetch(PDO::FETCH_ASSOC);
}

function getTransactionIngredientUsage(PDO $connection, $transactionId) {
    $statement = $connection->prepare(
        "SELECT
            pi.ingredient_id,
            SUM(pi.quantity_needed * ti.quantity) AS total_usage
         FROM transaction_items ti
         INNER JOIN product_ingredients pi ON pi.product_id = ti.product_id
         WHERE ti.transaction_id = :transaction_id
         GROUP BY pi.ingredient_id"
    );
    $statement->execute([":transaction_id" => $transactionId]);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}

function validateInventoryAvailabilityForCart(PDO $connection, array $items, int $branchId): void {
    if ($branchId <= 0) {
        throw new InvalidArgumentException("Cabang aktif belum valid.");
    }

    $recipeStatement = $connection->prepare(
        "SELECT
            p.name AS product_name,
            i.id AS ingredient_id,
            i.name AS ingredient_name,
            i.unit AS ingredient_unit,
            i.branch_id,
            i.stock_quantity,
            pi.quantity_needed
         FROM product_ingredients pi
         INNER JOIN products p ON p.id = pi.product_id
         INNER JOIN ingredients i ON i.id = pi.ingredient_id
         WHERE pi.product_id = :product_id
         FOR UPDATE"
    );

    $usageByIngredient = [];

    foreach ($items as $item) {
        $productId = (int) ($item["id"] ?? 0);
        $quantity = (int) ($item["qty"] ?? 0);

        if ($productId <= 0 || $quantity <= 0) {
            throw new InvalidArgumentException("Ada item transaksi yang tidak valid.");
        }

        $recipeStatement->execute([":product_id" => $productId]);
        $recipeRows = $recipeStatement->fetchAll(PDO::FETCH_ASSOC);

        if (!$recipeRows) {
            continue;
        }

        foreach ($recipeRows as $recipe) {
            $ingredientId = (int) ($recipe["ingredient_id"] ?? 0);
            $requiredPerItem = (float) ($recipe["quantity_needed"] ?? 0);

            if ($ingredientId <= 0 || $requiredPerItem <= 0) {
                throw new InvalidArgumentException("Resep produk tidak valid.");
            }

            $ingredientBranchId = isset($recipe["branch_id"]) && is_numeric($recipe["branch_id"])
                ? (int) $recipe["branch_id"]
                : 0;

            if ($ingredientBranchId > 0 && $ingredientBranchId !== $branchId) {
                throw new InvalidArgumentException("Resep produk memakai bahan dari cabang berbeda.");
            }

            if (!isset($usageByIngredient[$ingredientId])) {
                $usageByIngredient[$ingredientId] = [
                    "name" => (string) ($recipe["ingredient_name"] ?? "Bahan"),
                    "unit" => (string) ($recipe["ingredient_unit"] ?? ""),
                    "available" => (float) ($recipe["stock_quantity"] ?? 0),
                    "required" => 0,
                ];
            }

            $usageByIngredient[$ingredientId]["required"] += $requiredPerItem * $quantity;
        }
    }

    foreach ($usageByIngredient as $usage) {
        $available = round((float) $usage["available"], 2);
        $required = round((float) $usage["required"], 2);

        if ($required > $available) {
            $ingredientName = (string) ($usage["name"] ?? "Bahan");
            $unit = trim((string) ($usage["unit"] ?? ""));
            throw new InvalidArgumentException(
                "Stok {$ingredientName} tidak cukup. Tersedia {$available} {$unit}, butuh {$required} {$unit}."
            );
        }
    }
}

function applyInventoryUsageForTransaction(PDO $connection, array $transaction, $mode = "deduct") {
    $transactionId = (int) ($transaction["id"] ?? 0);
    if ($transactionId <= 0) {
        return;
    }

    $ingredientUsage = getTransactionIngredientUsage($connection, $transactionId);
    if (!$ingredientUsage) {
        return;
    }

    $direction = $mode === "restore" ? 1 : -1;
    $selectIngredientStatement = $connection->prepare(
        "SELECT id, branch_id, stock_quantity
         FROM ingredients
         WHERE id = :ingredient_id
         LIMIT 1"
    );
    $updateStatement = $connection->prepare(
        "UPDATE ingredients
         SET stock_quantity = COALESCE(stock_quantity, 0) + :delta
         WHERE id = :ingredient_id"
    );

    foreach ($ingredientUsage as $usage) {
        $totalUsage = (float) ($usage["total_usage"] ?? 0);
        if ($totalUsage <= 0) {
            continue;
        }

        $ingredientId = (int) ($usage["ingredient_id"] ?? 0);
        if ($ingredientId <= 0) {
            continue;
        }

        $selectIngredientStatement->execute([
            ":ingredient_id" => $ingredientId,
        ]);
        $ingredient = $selectIngredientStatement->fetch(PDO::FETCH_ASSOC);

        if (!$ingredient) {
            continue;
        }

        $stockBefore = (float) ($ingredient["stock_quantity"] ?? 0);
        $delta = round($direction * $totalUsage, 2);
        $stockAfter = round($stockBefore + $delta, 2);

        $updateStatement->execute([
            ":delta" => $delta,
            ":ingredient_id" => $ingredientId,
        ]);

        recordStockMovement($connection, [
            "ingredient_id" => $ingredientId,
            "branch_id" => isset($ingredient["branch_id"]) && is_numeric($ingredient["branch_id"])
                ? (int) $ingredient["branch_id"]
                : (int) ($transaction["branch_id"] ?? 0),
            "user_id" => isset($transaction["user_id"]) && is_numeric($transaction["user_id"])
                ? (int) $transaction["user_id"]
                : null,
            "movement_type" => $mode === "restore" ? "void_restore" : "sale",
            "direction" => $mode === "restore" ? "in" : "out",
            "quantity" => $totalUsage,
            "stock_before" => $stockBefore,
            "stock_after" => $stockAfter,
            "reference_type" => "transaction",
            "reference_id" => $transactionId,
            "notes" => $mode === "restore"
                ? "Stok dikembalikan dari void transaksi."
                : "Stok terpakai dari transaksi penjualan.",
        ]);
    }
}
?>
