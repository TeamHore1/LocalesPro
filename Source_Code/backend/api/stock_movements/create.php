<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../config/inventory_helpers.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

$ingredientId = isset($data->ingredient_id) ? (int) $data->ingredient_id : 0;
$quantity = isset($data->quantity) ? round((float) $data->quantity, 2) : 0;
$notes = trim((string) ($data->notes ?? ""));

if ($ingredientId <= 0 || $quantity <= 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Pilih bahan dan masukkan jumlah stok masuk yang valid.",
    ]);
    exit;
}

try {
    $user = requireRoles(["admin", "cashier"]);

    ensureStockMovementTable($conn, true);
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
    $ingredient = $selectStatement->fetch(PDO::FETCH_ASSOC);

    if (!$ingredient) {
        throw new InvalidArgumentException("Bahan baku tidak ditemukan.");
    }

    $branchId = resolveAuthorizedBranchId(
        $user,
        $data->branch_id ?? ($ingredient["branch_id"] ?? null),
        false
    );

    if ((int) ($ingredient["branch_id"] ?? 0) !== $branchId) {
        throw new RuntimeException("Bahan baku tidak tersedia untuk cabang aktif.");
    }

    $stockBefore = round((float) ($ingredient["stock_quantity"] ?? 0), 2);
    $stockAfter = round($stockBefore + $quantity, 2);

    $updateStatement = $conn->prepare(
        "UPDATE ingredients
         SET stock_quantity = :stock_quantity
         WHERE id = :id"
    );
    $updateStatement->execute([
        ":id" => $ingredientId,
        ":stock_quantity" => $stockAfter,
    ]);

    $defaultNote = normalizeRole((string) ($user["role"] ?? "")) === "cashier"
        ? "Stok masuk diterima kasir cabang."
        : "Penambahan stok masuk dari halaman manajemen stok.";

    recordStockMovement($conn, [
        "ingredient_id" => $ingredientId,
        "branch_id" => $branchId,
        "user_id" => (int) $user["id"],
        "movement_type" => "stock_in",
        "direction" => "in",
        "quantity" => $quantity,
        "stock_before" => $stockBefore,
        "stock_after" => $stockAfter,
        "reference_type" => "stock_receipt",
        "reference_id" => $ingredientId,
        "notes" => $notes !== "" ? $notes : $defaultNote,
    ]);

    $conn->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Stok masuk berhasil dicatat.",
        "data" => [
            "ingredient_id" => $ingredientId,
            "stock_before" => $stockBefore,
            "stock_after" => $stockAfter,
            "quantity" => $quantity,
        ],
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
        "message" => "Gagal mencatat stok masuk.",
    ]);
}
?>
