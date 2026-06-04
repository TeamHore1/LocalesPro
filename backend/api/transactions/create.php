<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/payment_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();
$data = json_decode(file_get_contents("php://input"));
ensureTransactionOperationalColumns($conn);

if (empty($data->items) || !is_array($data->items)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Item transaksi tidak boleh kosong.",
    ]);
    exit;
}

try {
    $branchId = resolveAuthorizedBranchId($authUser, $data->branch_id ?? null, false);
    $paymentMethod = trim((string) ($data->payment_method ?? "Cash"));
    $amountPaid = round((float) ($data->amount_paid ?? 0), 2);
    $customerName = trim((string) ($data->customer_name ?? ""));
    $paymentNote = trim((string) ($data->payment_note ?? ""));

    $conn->beginTransaction();

    $productStatement = $conn->prepare(
        "SELECT id, name, price, status, branch_id
         FROM products
         WHERE id = :id
         LIMIT 1"
    );

    $normalizedItems = [];
    $totalPrice = 0;

    foreach ($data->items as $item) {
        $productId = (int) ($item->id ?? 0);
        $quantity = (int) ($item->qty ?? 0);

        if ($productId <= 0 || $quantity <= 0) {
            throw new InvalidArgumentException("Ada item transaksi yang tidak valid.");
        }

        $productStatement->execute([":id" => $productId]);
        $product = $productStatement->fetch(PDO::FETCH_ASSOC);

        if (!$product || ($product["status"] ?? "active") !== "active") {
            throw new InvalidArgumentException("Produk dengan ID {$productId} tidak tersedia.");
        }

        $productBranchId = isset($product["branch_id"]) && is_numeric($product["branch_id"])
            ? (int) $product["branch_id"]
            : null;

        if ($productBranchId !== null && $productBranchId > 0 && $productBranchId !== $branchId) {
            throw new InvalidArgumentException("Produk tidak tersedia untuk cabang aktif.");
        }

        $price = (float) $product["price"];
        $subtotal = round($price * $quantity, 2);
        $totalPrice += $subtotal;

        $normalizedItems[] = [
            "id" => $productId,
            "name" => (string) $product["name"],
            "qty" => $quantity,
            "subtotal" => $subtotal,
        ];
    }

    if ($totalPrice <= 0) {
        throw new InvalidArgumentException("Total transaksi tidak valid.");
    }

    if ($amountPaid <= 0) {
        $amountPaid = $totalPrice;
    }

    if (strtolower($paymentMethod) === "cash" && $amountPaid < $totalPrice) {
        throw new InvalidArgumentException("Uang tunai yang diterima kurang dari total tagihan.");
    }

    $changeAmount = max(round($amountPaid - $totalPrice, 2), 0);

    validateInventoryAvailabilityForCart($conn, $normalizedItems, $branchId);

    $transactionStatement = $conn->prepare(
        "INSERT INTO transactions (
            user_id,
            branch_id,
            total_price,
            payment_method,
            payment_gateway,
            amount_paid,
            change_amount,
            payment_status,
            payment_note,
            customer_name,
            paid_at
        ) VALUES (
            :user_id,
            :branch_id,
            :total_price,
            :payment_method,
            'manual',
            :amount_paid,
            :change_amount,
            'Paid',
            :payment_note,
            :customer_name,
            NOW()
        )"
    );
    $transactionStatement->execute([
        ":user_id" => (int) $authUser["id"],
        ":branch_id" => $branchId,
        ":total_price" => $totalPrice,
        ":payment_method" => $paymentMethod,
        ":amount_paid" => $amountPaid,
        ":change_amount" => $changeAmount,
        ":payment_note" => $paymentNote !== "" ? substr($paymentNote, 0, 255) : null,
        ":customer_name" => $customerName !== "" ? substr($customerName, 0, 120) : null,
    ]);

    $transactionId = (int) $conn->lastInsertId();
    $transactionCode = buildTransactionCode($transactionId);

    $codeStatement = $conn->prepare(
        "UPDATE transactions
         SET transaction_code = :transaction_code
         WHERE id = :id"
    );
    $codeStatement->execute([
        ":transaction_code" => $transactionCode,
        ":id" => $transactionId,
    ]);

    $itemStatement = $conn->prepare(
        "INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal)
         VALUES (:transaction_id, :product_id, :quantity, :subtotal)"
    );

    foreach ($normalizedItems as $item) {
        $itemStatement->execute([
            ":transaction_id" => $transactionId,
            ":product_id" => $item["id"],
            ":quantity" => $item["qty"],
            ":subtotal" => $item["subtotal"],
        ]);
    }

    applyInventoryUsageForTransaction($conn, [
        "id" => $transactionId,
        "branch_id" => $branchId,
        "user_id" => (int) $authUser["id"],
        "transaction_code" => $transactionCode,
    ], "deduct");

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Transaksi berhasil diproses.",
        "data" => [
            "id" => $transactionId,
            "transaction_code" => $transactionCode,
            "total_price" => $totalPrice,
            "amount_paid" => $amountPaid,
            "change_amount" => $changeAmount,
            "customer_name" => $customerName,
            "payment_note" => $paymentNote,
        ],
    ]);
} catch (InvalidArgumentException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal menyimpan transaksi.",
    ]);
}
?>
