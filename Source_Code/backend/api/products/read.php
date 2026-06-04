<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAuth();

try {
    $branchId = resolveAuthorizedBranchId($authUser, $_GET["branch_id"] ?? null, true);
    $params = [];

    if ($branchId !== null) {
        $query = "SELECT * FROM products
                  WHERE status = 'active' AND branch_id = :branch_id
                  ORDER BY id DESC";
        $params[":branch_id"] = $branchId;
    } else {
        $query = "SELECT * FROM products
                  WHERE status = 'active'
                  ORDER BY id DESC";
    }

    $statement = $conn->prepare($query);
    $statement->execute($params);
    $products = $statement->fetchAll(PDO::FETCH_ASSOC);
    $productIds = array_column($products, "id");

    foreach ($products as &$product) {
        $product["image"] = $product["image_url"];
        $product["recipe"] = [];
    }
    unset($product);

    if (!empty($productIds)) {
        $placeholders = implode(",", array_fill(0, count($productIds), "?"));
        $recipeQuery = "SELECT
                            pi.product_id,
                            pi.ingredient_id,
                            pi.quantity_needed,
                            i.name AS ingredient_name,
                            i.unit
                        FROM product_ingredients pi
                        LEFT JOIN ingredients i ON i.id = pi.ingredient_id
                        WHERE pi.product_id IN ($placeholders)
                        ORDER BY pi.id ASC";
        $recipeStatement = $conn->prepare($recipeQuery);
        $recipeStatement->execute($productIds);
        $recipeRows = $recipeStatement->fetchAll(PDO::FETCH_ASSOC);

        $productMap = [];
        foreach ($products as $index => $product) {
            $productMap[$product["id"]] = $index;
        }

        foreach ($recipeRows as $row) {
            $productIndex = $productMap[$row["product_id"]] ?? null;
            if ($productIndex === null) {
                continue;
            }

            $products[$productIndex]["recipe"][] = [
                "ingredientId" => (int) $row["ingredient_id"],
                "name" => $row["ingredient_name"],
                "amount" => (float) $row["quantity_needed"],
                "unit" => $row["unit"],
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $products,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data produk.",
    ]);
}
?>
