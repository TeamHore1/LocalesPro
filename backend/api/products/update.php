<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireRoles(["admin"]);
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $recipe = $data->recipe ?? [];

        if (!is_array($recipe) || count($recipe) === 0) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Resep produk wajib diisi minimal 1 bahan.",
            ]);
            exit;
        }

        $branchId = resolveAuthorizedBranchId($authUser, $data->branch_id ?? null, false);
        $conn->beginTransaction();

        $query = "UPDATE products SET
                  name = :name,
                  price = :price,
                  category = :category,
                  image_url = :image_url,
                  branch_id = :branch_id,
                  status = :status
                  WHERE id = :id";

        $statement = $conn->prepare($query);
        $statement->execute([
            ":id" => $data->id,
            ":name" => $data->name,
            ":price" => $data->price,
            ":category" => $data->category,
            ":image_url" => $data->image_url ?? "boba-default.png",
            ":branch_id" => $branchId,
            ":status" => $data->status ?? "active",
        ]);

        // Ambil resep lama untuk perbandingan
        $existingRecipeStatement = $conn->prepare(
            "SELECT ingredient_id FROM product_ingredients WHERE product_id = :product_id"
        );
        $existingRecipeStatement->execute([":product_id" => $data->id]);
        $existingIngredientIds = array_map(fn($row) => (int) $row['ingredient_id'], $existingRecipeStatement->fetchAll(PDO::FETCH_ASSOC));

        // Siapkan statement untuk UPSERT
        $recipeStatement = $conn->prepare(
            "INSERT INTO product_ingredients (product_id, ingredient_id, quantity_needed)
             VALUES (:product_id, :ingredient_id, :quantity_needed)
             ON DUPLICATE KEY UPDATE quantity_needed = VALUES(quantity_needed)"
        );

        $newIngredientIds = [];

        foreach ($recipe as $item) {
            $ingredientId = isset($item->ingredientId) ? (int) $item->ingredientId : 0;
            $quantityNeeded = isset($item->amount) ? (float) $item->amount : 0;

            if ($ingredientId <= 0) {
                throw new InvalidArgumentException("ID bahan baku tidak valid. Periksa bahan yang dipilih.");
            }

            if ($quantityNeeded <= 0) {
                throw new InvalidArgumentException("Jumlah bahan harus lebih dari 0.");
            }

            $recipeStatement->execute([
                ":product_id" => (int) $data->id,
                ":ingredient_id" => $ingredientId,
                ":quantity_needed" => $quantityNeeded,
            ]);

            $newIngredientIds[] = $ingredientId;
        }

        // Hapus resep yang tidak ada di resep baru
        $ingredientsToDelete = array_diff($existingIngredientIds, $newIngredientIds);
        if (!empty($ingredientsToDelete)) {
            $deleteStatement = $conn->prepare(
                "DELETE FROM product_ingredients 
                 WHERE product_id = :product_id AND ingredient_id = :ingredient_id"
            );
            foreach ($ingredientsToDelete as $ingredientId) {
                $deleteStatement->execute([
                    ":product_id" => $data->id,
                    ":ingredient_id" => $ingredientId,
                ]);
            }
        }

        $conn->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Produk berhasil diupdate!",
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

        error_log("Update Product Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Gagal memperbarui produk. Error: " . $e->getMessage(),
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "ID produk wajib diisi.",
    ]);
}
?>
