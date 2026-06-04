<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAdmin();
$data = json_decode(file_get_contents("php://input"));

$userId = (int) ($data->id ?? 0);
$action = strtolower(trim((string) ($data->action ?? "")));
$reviewNote = trim((string) ($data->review_note ?? ""));
$requestedBranchId = isset($data->branch_id) ? (int) $data->branch_id : 0;
$allowedActions = ["approve", "reject", "activate", "deactivate"];

if ($userId <= 0 || !in_array($action, $allowedActions, true)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Aksi review tidak valid.",
    ]);
    exit;
}

if (mb_strlen($reviewNote) > 500) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Catatan review maksimal 500 karakter.",
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $userStatement = $conn->prepare(
        "SELECT *
         FROM users
         WHERE id = :id AND role = 'cashier'
         LIMIT 1"
    );
    $userStatement->execute([
        ":id" => $userId,
    ]);
    $cashier = $userStatement->fetch(PDO::FETCH_ASSOC);

    if (!$cashier) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Akun kasir tidak ditemukan.",
        ]);
        exit;
    }

    $nextStatus = match ($action) {
        "approve", "activate" => "active",
        "reject" => "rejected",
        "deactivate" => "inactive",
    };

    $finalBranchId = isset($cashier["branch_id"]) && is_numeric($cashier["branch_id"])
        ? (int) $cashier["branch_id"]
        : null;

    if (in_array($action, ["approve", "activate"], true)) {
        if ($requestedBranchId > 0) {
            $finalBranchId = $requestedBranchId;
        }

        if (($finalBranchId ?? 0) <= 0) {
            throw new InvalidArgumentException("Cabang penempatan kasir wajib dipilih.");
        }

        $branchStatement = $conn->prepare(
            "SELECT id
             FROM branches
             WHERE id = :id AND status = 'active'
             LIMIT 1"
        );
        $branchStatement->execute([
            ":id" => $finalBranchId,
        ]);

        if (!$branchStatement->fetchColumn()) {
            throw new InvalidArgumentException("Cabang penempatan tidak ditemukan atau sedang nonaktif.");
        }
    }

    $updateStatement = $conn->prepare(
        "UPDATE users
         SET status = :status,
             review_note = :review_note,
             branch_id = :branch_id,
             approved_by = :approved_by,
             approved_at = NOW()
         WHERE id = :id"
    );
    $updateStatement->execute([
        ":status" => $nextStatus,
        ":review_note" => $reviewNote !== "" ? $reviewNote : null,
        ":branch_id" => $finalBranchId,
        ":approved_by" => (int) ($authUser["id"] ?? 0),
        ":id" => $userId,
    ]);

    $conn->commit();

    appendSecurityLog("cashier_registration_reviewed", [
        "username" => strtolower((string) ($cashier["username"] ?? "")),
        "ip" => getClientIpAddress(),
        "review_action" => $action,
        "reviewed_by" => (int) ($authUser["id"] ?? 0),
        "branch_id" => $finalBranchId,
    ]);

    $actionLabel = match ($action) {
        "approve" => "disetujui",
        "reject" => "ditolak",
        "activate" => "diaktifkan",
        "deactivate" => "dinonaktifkan",
    };

    echo json_encode([
        "status" => "success",
        "message" => "Akun kasir berhasil {$actionLabel}.",
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
        "message" => "Gagal memperbarui status akun kasir.",
    ]);
}
?>
