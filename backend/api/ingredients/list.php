<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$stmt = $conn->query("SELECT * FROM ingredients");
echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
?>