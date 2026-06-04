<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

header("Content-Type: application/json");

try {
    $statement = $conn->prepare(
        "SELECT id, name, address, phone
         FROM branches
         WHERE status = 'active'
         ORDER BY name ASC"
    );
    $statement->execute();

    echo json_encode([
        "status" => "success",
        "data" => $statement->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil daftar cabang aktif.",
    ]);
}
?>
