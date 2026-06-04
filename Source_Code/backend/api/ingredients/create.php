<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name)) {
    try {
        $user = requireRoles(["admin"]);

        $query = "INSERT INTO ingredients (name, unit, stock_quantity, min_stock, branch_id) 
                  VALUES (:name, :unit, :stock, :min_stock, :branch_id)";

        $stmt = $conn->prepare($query);

        $params = [
            ':name'      => $data->name,
            ':unit'      => $data->unit,
            ':stock'     => $data->stock ?? 0,
            ':min_stock' => $data->minStock ?? 0,
            ':branch_id' => $data->branch_id ?? 1
        ];

        if ($stmt->execute($params)) {
            error_log("Stock created by user {$user['id']} for ingredient {$data->name}");

            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "Bahan berhasil ditambah",
                "data" => [
                    "id" => $conn->lastInsertId(),
                ],
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Gagal menambah bahan."]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
}
