<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAdmin();
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data["id"])) {
    try {
        $query = "DELETE FROM branches WHERE id = :id";
        $statement = $conn->prepare($query);
        $statement->bindParam(":id", $data["id"]);

        if ($statement->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Cabang berhasil dihapus",
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Gagal menghapus cabang",
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Gagal menghapus cabang.",
        ]);
    }
} else {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "ID tidak ditemukan",
    ]);
}
?>
