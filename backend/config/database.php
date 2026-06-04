<?php
require_once __DIR__ . "/env.php";

localespro_load_env();

$host = (string) localespro_env("DB_HOST", "localhost");
$db_name = (string) localespro_env("DB_NAME", "locales_db");
$username = (string) localespro_env("DB_USER", "root");
$password = (string) localespro_env("DB_PASS", "");
$charset = (string) localespro_env("DB_CHARSET", "utf8mb4");

try {
    $conn = new PDO(
        "mysql:host={$host};dbname={$db_name};charset={$charset}",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");

    $message = localespro_is_production()
        ? "Koneksi database gagal. Periksa konfigurasi DB di backend/.env"
        : "Koneksi Database Gagal: " . $e->getMessage();

    echo json_encode([
        "status" => "error",
        "message" => $message,
    ]);
    exit();
}
?>
