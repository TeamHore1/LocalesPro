<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();

try {
    $branchId = resolveAuthorizedBranchId($authUser, $_GET["branch_id"] ?? null, true);
    $query = "SELECT * FROM ingredients";
    $params = [];

    if ($branchId !== null) {
        $query .= " WHERE branch_id = :branch_id";
        $params[":branch_id"] = $branchId;
    }

    $query .= " ORDER BY id DESC";

    $statement = $conn->prepare($query);
    $statement->execute($params);

    echo json_encode([
        "status" => "success",
        "data" => $statement->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data bahan.",
    ]);
}
?>
