<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/inventory_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();

try {
    ensureStockMovementTable($conn, true);

    $branchId = resolveAuthorizedBranchId($authUser, $_GET["branch_id"] ?? null, true);
    $ingredientId = isset($_GET["ingredient_id"]) && is_numeric($_GET["ingredient_id"]) && (int) $_GET["ingredient_id"] > 0
        ? (int) $_GET["ingredient_id"]
        : null;
    $limit = isset($_GET["limit"]) && is_numeric($_GET["limit"])
        ? max(1, min((int) $_GET["limit"], 200))
        : 50;

    $conditions = [];
    $params = [];

    if ($branchId !== null) {
        $conditions[] = "sm.branch_id = :branch_id";
        $params[":branch_id"] = $branchId;
    }

    if ($ingredientId !== null) {
        $conditions[] = "sm.ingredient_id = :ingredient_id";
        $params[":ingredient_id"] = $ingredientId;
    }

    $whereClause = count($conditions) > 0 ? "WHERE " . implode(" AND ", $conditions) : "";

    $statement = $conn->prepare(
        "SELECT
            sm.*,
            i.name AS ingredient_name,
            i.unit AS ingredient_unit,
            b.name AS branch_name,
            COALESCE(u.full_name, u.username) AS actor_name
         FROM stock_movements sm
         LEFT JOIN ingredients i ON i.id = sm.ingredient_id
         LEFT JOIN branches b ON b.id = sm.branch_id
         LEFT JOIN users u ON u.id = sm.user_id
         {$whereClause}
         ORDER BY sm.created_at DESC, sm.id DESC
         LIMIT {$limit}"
    );
    $statement->execute($params);

    echo json_encode([
        "status" => "success",
        "data" => $statement->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (RuntimeException $e) {
    http_response_code(403);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil riwayat mutasi stok.",
    ]);
}
?>
