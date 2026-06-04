<?php

function ensureStockMovementTable(PDO $connection, bool $createIfMissing = false): bool
{
    static $initialized = false;

    if ($initialized) {
        return true;
    }

    $databaseName = (string) $connection->query("SELECT DATABASE()")->fetchColumn();

    if ($databaseName !== "") {
        $statement = $connection->prepare(
            "SELECT COUNT(*)
             FROM information_schema.tables
             WHERE table_schema = :table_schema
               AND table_name = 'stock_movements'"
        );
        $statement->execute([
            ":table_schema" => $databaseName,
        ]);

        if ((int) $statement->fetchColumn() > 0) {
            $initialized = true;
            return true;
        }
    }

    if (!$createIfMissing || $connection->inTransaction()) {
        return false;
    }

    $connection->exec(
        "CREATE TABLE IF NOT EXISTS stock_movements (
            id INT(11) NOT NULL AUTO_INCREMENT,
            ingredient_id INT(11) NOT NULL,
            branch_id INT(11) NOT NULL,
            user_id INT(11) DEFAULT NULL,
            movement_type VARCHAR(30) NOT NULL,
            direction ENUM('in', 'out') NOT NULL,
            quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            stock_before DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            stock_after DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            reference_type VARCHAR(30) DEFAULT NULL,
            reference_id INT(11) DEFAULT NULL,
            notes VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_stock_movements_branch_created (branch_id, created_at),
            KEY idx_stock_movements_ingredient_created (ingredient_id, created_at),
            KEY idx_stock_movements_reference (reference_type, reference_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"
    );

    $initialized = true;
    return true;
}

function normalizeStockDirection(string $direction): string
{
    return strtolower(trim($direction)) === "out" ? "out" : "in";
}

function recordStockMovement(PDO $connection, array $movement): void
{
    if (!ensureStockMovementTable($connection)) {
        return;
    }

    $ingredientId = (int) ($movement["ingredient_id"] ?? 0);
    $branchId = isset($movement["branch_id"]) && is_numeric($movement["branch_id"])
        ? (int) $movement["branch_id"]
        : 0;
    $quantity = round((float) ($movement["quantity"] ?? 0), 2);

    if ($ingredientId <= 0 || $branchId <= 0 || $quantity <= 0) {
        return;
    }

    $statement = $connection->prepare(
        "INSERT INTO stock_movements (
            ingredient_id,
            branch_id,
            user_id,
            movement_type,
            direction,
            quantity,
            stock_before,
            stock_after,
            reference_type,
            reference_id,
            notes
        ) VALUES (
            :ingredient_id,
            :branch_id,
            :user_id,
            :movement_type,
            :direction,
            :quantity,
            :stock_before,
            :stock_after,
            :reference_type,
            :reference_id,
            :notes
        )"
    );

    $statement->execute([
        ":ingredient_id" => $ingredientId,
        ":branch_id" => $branchId,
        ":user_id" => isset($movement["user_id"]) && is_numeric($movement["user_id"])
            ? (int) $movement["user_id"]
            : null,
        ":movement_type" => trim((string) ($movement["movement_type"] ?? "adjustment")),
        ":direction" => normalizeStockDirection((string) ($movement["direction"] ?? "in")),
        ":quantity" => $quantity,
        ":stock_before" => round((float) ($movement["stock_before"] ?? 0), 2),
        ":stock_after" => round((float) ($movement["stock_after"] ?? 0), 2),
        ":reference_type" => (($movement["reference_type"] ?? null) !== null)
            ? trim((string) $movement["reference_type"])
            : null,
        ":reference_id" => isset($movement["reference_id"]) && is_numeric($movement["reference_id"])
            ? (int) $movement["reference_id"]
            : null,
        ":notes" => (($movement["notes"] ?? null) !== null)
            ? trim((string) $movement["notes"])
            : null,
    ]);
}
?>
