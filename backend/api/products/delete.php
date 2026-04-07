<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        // Ganti DELETE menjadi UPDATE status
        $query = "UPDATE products SET status = 'inactive' WHERE id = :id";
        $stmt = $conn->prepare($query);
        
        if ($stmt->execute([':id' => $data->id])) {
            echo json_encode([
                "status" => "success", 
                "message" => "Produk berhasil dinonaktifkan!"
            ]);
        } else {
            echo json_encode([
                "status" => "error", 
                "message" => "Gagal mengubah status produk."
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode([
            "status" => "error", 
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "ID tidak ditemukan."]);
}
?>