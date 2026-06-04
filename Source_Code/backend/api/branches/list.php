<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();

try {
    $query = "SELECT id, name, address, phone, status, created_at
              FROM branches";
    $params = [];

    if (normalizeRole((string) ($authUser["role"] ?? "")) === "cashier") {
        $branchId = getAuthenticatedBranchId($authUser);

        if ($branchId === null) {
            http_response_code(403);
            echo json_encode([
                "status" => "error",
                "message" => "Akun kasir belum terhubung ke cabang.",
            ]);
            exit;
        }

        $query .= " WHERE id = :branch_id";
        $params[":branch_id"] = $branchId;
    }

    $query .= " ORDER BY created_at DESC";

    $statement = $conn->prepare($query);
    $statement->execute($params);
    $branches = $statement->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $branches,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data cabang.",
    ]);
}
?>
