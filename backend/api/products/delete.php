<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireRoles(["admin"]);
$data = json_decode(file_get_contents("php://input"));

if (empty($data->id) || !is_numeric($data->id) || (int) $data->id <= 0) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "ID tidak ditemukan.",
    ]);
    exit;
}

$productId = (int) $data->id;

try {
    $usageStatement = $conn->prepare(
        "SELECT COUNT(*) FROM transaction_items WHERE product_id = :id"
    );
    $usageStatement->execute([":id" => $productId]);
    $transactionUsageCount = (int) $usageStatement->fetchColumn();

    if ($transactionUsageCount > 0) {
        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => "Produk tidak bisa dihapus permanen karena sudah digunakan dalam transaksi. Ubah status menjadi inactive jika ingin menyembunyikannya dari menu.",
        ]);
        exit;
    }

    $conn->beginTransaction();

    $recipeStatement = $conn->prepare(
        "DELETE FROM product_ingredients WHERE product_id = :id"
    );
    $recipeStatement->execute([":id" => $productId]);

    $productStatement = $conn->prepare(
        "DELETE FROM products WHERE id = :id"
    );
    $productStatement->execute([":id" => $productId]);

    if ($productStatement->rowCount() === 0) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Produk tidak ditemukan.",
        ]);
        exit;
    }

    $conn->commit();

    error_log("Product deleted by user {$authUser['id']} for product ID {$productId}");

    echo json_encode([
        "status" => "success",
        "message" => "Produk berhasil dihapus permanen!",
    ]);
} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal menghapus produk dari database.",
    ]);
}
?>
