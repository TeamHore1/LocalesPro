<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->id)) {
    try {
        $query = "UPDATE products SET 
                  name=:name, 
                  price=:price, 
                  category=:category, 
                  image_url=:image_url 
                  WHERE id=:id";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':id'        => $data->id,
            ':name'      => $data->name,
            ':price'     => $data->price,
            ':category'  => $data->category,
            ':image_url' => $data->image_url ?? 'boba-default.png'
        ]);
        echo json_encode(["status" => "success", "message" => "Produk Berhasil Diupdate!"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Error: " . $e->getMessage()]);
    }
}
?>