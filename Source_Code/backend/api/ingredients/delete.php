<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        $user = requireRoles(["admin"]);

        $query = "DELETE FROM ingredients WHERE id = :id";
        $stmt = $conn->prepare($query);

        $params = [
            ':id' => $data->id
        ];

        if ($stmt->execute($params)) {
            error_log("Stock deleted by user {$user['id']} for ingredient ID {$data->id}");
            echo json_encode([
                "status"  => "success",
                "message" => "Bahan baku berhasil dihapus!"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "status"  => "error",
                "message" => "Gagal menghapus data dari database."
            ]);
        }

    } catch (PDOException $e) {
        if ($e->getCode() == "23000") {
            http_response_code(409);
            echo json_encode([
                "status"  => "error",
                "message" => "Tidak bisa dihapus! Bahan ini masih digunakan dalam resep menu."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "status"  => "error", 
                "message" => "Database Error: " . $e->getMessage()
            ]);
        }
    }
} else {
    http_response_code(400);
    echo json_encode([
        "status"  => "error", 
        "message" => "ID tidak ditemukan. Gagal menghapus."
    ]);
}
?>
