<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/payment_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();
ensureTransactionOperationalColumns($conn);

try {
    $branchId = resolveAuthorizedBranchId($authUser, $_GET["branch_id"] ?? null, true);
    $conditions = [];
    $params = [];

    if ($branchId !== null) {
        $conditions[] = "t.branch_id = :branch_id";
        $params[":branch_id"] = $branchId;
    }

    $whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

    $query = "SELECT t.*, u.username AS cashier_name, vu.username AS voided_by_name, b.name AS branch_name
              FROM transactions t
              JOIN users u ON t.user_id = u.id
              LEFT JOIN users vu ON t.voided_by = vu.id
              JOIN branches b ON t.branch_id = b.id
              {$whereClause}
              ORDER BY t.created_at DESC";

    $statement = $conn->prepare($query);
    $statement->execute($params);
    $history = $statement->fetchAll(PDO::FETCH_ASSOC);

    $itemStatement = $conn->prepare(
        "SELECT p.name, ti.quantity
         FROM transaction_items ti
         JOIN products p ON ti.product_id = p.id
         WHERE ti.transaction_id = :transaction_id"
    );

    foreach ($history as $index => $transaction) {
        $itemStatement->execute([
            ":transaction_id" => $transaction["id"],
        ]);
        $history[$index]["items"] = $itemStatement->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "data" => $history,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil riwayat transaksi.",
    ]);
}
?>
