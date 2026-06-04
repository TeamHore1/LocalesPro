<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireRoles(["admin"]);
$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->name) &&
    isset($data->price) &&
    is_numeric($data->price)
) {
    $recipe = $data->recipe ?? [];

    if (!is_array($recipe) || count($recipe) === 0) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Resep produk wajib diisi minimal 1 bahan.",
        ]);
        exit;
    }

    try {
        $branchId = resolveAuthorizedBranchId($authUser, $data->branch_id ?? null, false);
        $conn->beginTransaction();

        $query = "INSERT INTO products (name, price, category, image_url, branch_id, status)
                  VALUES (:name, :price, :category, :image_url, :branch_id, :status)";

        $statement = $conn->prepare($query);
        $statement->execute([
            ":name" => trim((string) $data->name),
            ":price" => $data->price,
            ":category" => $data->category ?? null,
            ":image_url" => $data->image_url ?? "boba-default.png",
            ":branch_id" => $branchId,
            ":status" => $data->status ?? "active",
        ]);

        $productId = (int) $conn->lastInsertId();

        $recipeStatement = $conn->prepare(
            "INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed)
             VALUES (:product_id, :ingredient_id, :quantity_needed)"
        );

        foreach ($recipe as $item) {
            $ingredientId = isset($item->ingredientId) ? (int) $item->ingredientId : 0;
            $quantityNeeded = isset($item->amount) ? (float) $item->amount : 0;

            if ($ingredientId <= 0 || $quantityNeeded <= 0) {
                throw new InvalidArgumentException("Data resep tidak valid. Periksa bahan dan jumlahnya.");
            }

            $recipeStatement->execute([
                ":product_id" => $productId,
                ":ingredient_id" => $ingredientId,
                ":quantity_needed" => $quantityNeeded,
            ]);
        }

        $conn->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Produk berhasil ditambah!",
            "data" => [
                "id" => $productId,
            ],
        ]);
    } catch (InvalidArgumentException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }

        http_response_code(400);
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
            "message" => "Gagal menambah produk.",
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Nama dan harga wajib diisi.",
    ]);
}
?>
