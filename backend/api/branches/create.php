<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data['name']) && !empty($data['address'])) {
    try {
        // Tambahkan phone dan status ke dalam query INSERT
        $query = "INSERT INTO branches (name, address, phone, status, created_at) 
                  VALUES (:name, :address, :phone, :status, NOW())";
        
        $stmt = $conn->prepare($query);
        
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':address', $data['address']);
        $stmt->bindParam(':phone', $data['phone']);
        // Jika status tidak dikirim, default ke 'active'
        $status = !empty($data['status']) ? $data['status'] : 'active';
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Cabang berhasil ditambahkan"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan cabang"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Data tidak lengkap"]);
}
?>