<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/inventory_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

$ingredientId = isset($data->id) ? (int) $data->id : 0;
$ingredientName = trim((string) ($data->name ?? ""));

if ($ingredientId <= 0 || $ingredientName === "") {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Input data bahan tidak valid.",
    ]);
    exit;
}

try {
    $user = requireRoles(["admin"]);

    $conn->beginTransaction();

    $selectStatement = $conn->prepare(
        "SELECT *
         FROM ingredients
         WHERE id = :id
         LIMIT 1
         FOR UPDATE"
    );
    $selectStatement->execute([
        ":id" => $ingredientId,
    ]);
    $existingIngredient = $selectStatement->fetch(PDO::FETCH_ASSOC);

    if (!$existingIngredient) {
        throw new InvalidArgumentException("Bahan baku tidak ditemukan.");
    }

    $resolvedBranchId = resolveAuthorizedBranchId(
        $user,
        $data->branch_id ?? ($existingIngredient["branch_id"] ?? null),
        false
    );

    $updatedStock = isset($data->stock) ? round((float) $data->stock, 2) : (float) ($existingIngredient["stock_quantity"] ?? 0);
    $previousStock = round((float) ($existingIngredient["stock_quantity"] ?? 0), 2);
    $stockDelta = round($updatedStock - $previousStock, 2);

    $updateStatement = $conn->prepare(
        "UPDATE ingredients
         SET name = :name,
             unit = :unit,
             stock_quantity = :stock_quantity,
             min_stock = :min_stock,
             branch_id = :branch_id
         WHERE id = :id"
    );

    $updateStatement->execute([
        ":id" => $ingredientId,
        ":name" => $ingredientName,
        ":unit" => trim((string) ($data->unit ?? "")),
        ":stock_quantity" => $updatedStock,
        ":min_stock" => isset($data->minStock) ? round((float) $data->minStock, 2) : 0,
        ":branch_id" => $resolvedBranchId,
    ]);

    if (abs($stockDelta) > 0) {
        recordStockMovement($conn, [
            "ingredient_id" => $ingredientId,
            "branch_id" => $resolvedBranchId,
            "user_id" => (int) $user["id"],
            "movement_type" => $stockDelta > 0 ? "stock_in" : "stock_out",
            "direction" => $stockDelta > 0 ? "in" : "out",
            "quantity" => abs($stockDelta),
            "stock_before" => $previousStock,
            "stock_after" => $updatedStock,
            "reference_type" => "manual_adjustment",
            "reference_id" => $ingredientId,
            "notes" => $stockDelta > 0
                ? "Penambahan stok manual dari halaman manajemen stok."
                : "Pengurangan stok manual dari halaman manajemen stok.",
        ]);
    }

    $conn->commit();

    error_log("Stock updated by user {$user['id']} for ingredient ID {$ingredientId}");

    echo json_encode([
        "status" => "success",
        "message" => "Data bahan baku berhasil diperbarui!",
    ]);
} catch (InvalidArgumentException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(404);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
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
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal memperbarui data bahan baku.",
    ]);
}
?>
