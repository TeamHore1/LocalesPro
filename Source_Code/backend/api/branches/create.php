<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAdmin();
$data = json_decode(file_get_contents("php://input"), true);

if (!empty($data["name"]) && !empty($data["address"])) {
    try {
        $query = "INSERT INTO branches (name, address, phone, status, created_at)
                  VALUES (:name, :address, :phone, :status, NOW())";

        $statement = $conn->prepare($query);
        $status = !empty($data["status"]) ? $data["status"] : "active";

        $statement->bindParam(":name", $data["name"]);
        $statement->bindParam(":address", $data["address"]);
        $statement->bindParam(":phone", $data["phone"]);
        $statement->bindParam(":status", $status);

        if ($statement->execute()) {
            echo json_encode([
                "status" => "success",
                "message" => "Cabang berhasil ditambahkan",
            ]);
        } else {
            echo json_encode([
                "status" => "error",
                "message" => "Gagal menambahkan cabang",
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Gagal menambahkan cabang.",
        ]);
    }
} else {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Data tidak lengkap",
    ]);
}
?>
