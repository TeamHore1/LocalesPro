<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/payment_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();
$data = json_decode(file_get_contents("php://input"));
ensureTransactionOperationalColumns($conn);
$transactionId = (int) ($data->id ?? 0);
$voidReason = trim((string) ($data->void_reason ?? ""));

if ($transactionId <= 0) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "ID transaksi tidak valid.",
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $selectStatement = $conn->prepare("SELECT * FROM transactions WHERE id = :id LIMIT 1");
    $selectStatement->execute([":id" => $transactionId]);
    $transaction = $selectStatement->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Transaksi tidak ditemukan.",
        ]);
        exit;
    }

    $authorizedBranchId = resolveAuthorizedBranchId($authUser, $transaction["branch_id"] ?? null, false);
    if ((int) $authorizedBranchId !== (int) ($transaction["branch_id"] ?? 0)) {
        throw new RuntimeException("Akses transaksi lintas cabang tidak diizinkan.");
    }

    if (($transaction["payment_status"] ?? "") === "Voided") {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        echo json_encode([
            "status" => "error",
            "message" => "Transaksi ini sudah berstatus void.",
        ]);
        exit;
    }

    $previousPaymentStatus = normalizeLocalPaymentStatus($transaction["payment_status"] ?? "");
    $statement = $conn->prepare(
        "UPDATE transactions
         SET payment_status = 'Voided',
             void_reason = :void_reason,
             voided_by = :voided_by,
             voided_at = NOW()
         WHERE id = :id"
    );
    $statement->execute([
        ":id" => $transactionId,
        ":void_reason" => $voidReason !== "" ? substr($voidReason, 0, 255) : null,
        ":voided_by" => (int) $authUser["id"],
    ]);

    if ($statement->rowCount() === 0) {
        throw new InvalidArgumentException("Status transaksi gagal diperbarui.");
    }

    if (shouldRestoreInventoryOnVoid($previousPaymentStatus, "Voided")) {
        applyInventoryUsageForTransaction($conn, $transaction, "restore");
    }

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Transaksi berhasil ditandai sebagai void.",
    ]);
} catch (RuntimeException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(403);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
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
        "message" => "Gagal memperbarui status transaksi.",
    ]);
}
?>
