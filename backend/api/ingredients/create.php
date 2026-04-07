<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->name)) {
    try {
        // Gunakan stock_quantity dan min_stock sesuai standar database
        $query = "INSERT INTO ingredients (name, unit, stock_quantity, min_stock, branch_id) 
                  VALUES (:name, :unit, :stock, :min_stock, :branch_id)";

        $stmt = $conn->prepare($query);

        $params = [
            ':name'      => $data->name,
            ':unit'      => $data->unit,
            ':stock'     => $data->stock ?? 0,
            ':min_stock' => $data->minStock ?? 0, // Ambil dari minStock di React
            ':branch_id' => $data->branch_id ?? 1
        ];

        if ($stmt->execute($params)) {
            echo json_encode(["status" => "success", "message" => "Bahan berhasil ditambah"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>