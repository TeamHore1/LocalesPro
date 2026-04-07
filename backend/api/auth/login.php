<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $query = "SELECT u.*, b.name as branch_name FROM users u 
              LEFT JOIN branches b ON u.branch_id = b.id 
              WHERE u.username = :username LIMIT 1";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $user['password'] === $data->password) { // Gunakan password_verify jika sudah di-hash
        unset($user['password']); // Jangan kirim password ke frontend
        echo json_encode([
            "status" => "success",
            "data" => [
                "token" => base64_encode($user['username'] . time()), 
                "user" => $user
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Login Gagal, Cek User/Pass!"]);
    }
}
?>