<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

try {
    // Ambil semua kolom termasuk yang baru (phone & status)
    $query = "SELECT id, name, address, phone, status, created_at 
              FROM branches 
              ORDER BY created_at DESC";
              
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => $branches
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>