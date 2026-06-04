<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

header("Content-Type: application/json; charset=UTF-8");

$checks = [
    "app_env" => (string) localespro_env("LOCALESPRO_APP_ENV", "local"),
    "database" => "ok",
    "jwt_secret" => trim((string) localespro_env("LOCALESPRO_JWT_SECRET", "")) !== "" ? "configured" : "missing",
];

try {
    $conn->query("SELECT 1");
} catch (Throwable $e) {
    $checks["database"] = "error";
}

$healthy = $checks["database"] === "ok"
    && (!localespro_is_production() || $checks["jwt_secret"] === "configured");

http_response_code($healthy ? 200 : 503);
echo json_encode([
    "status" => $healthy ? "success" : "error",
    "message" => $healthy ? "Locales Pro API siap." : "Konfigurasi hosting belum lengkap.",
    "checks" => $checks,
]);
?>
