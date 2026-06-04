<?php
require_once __DIR__ . "/env.php";

localespro_load_env();

$allowedOrigins = localespro_get_allowed_origins();
$requestOrigin = trim((string) ($_SERVER["HTTP_ORIGIN"] ?? ""));

if (in_array("*", $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: *");
} elseif ($requestOrigin !== "" && in_array($requestOrigin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $requestOrigin);
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept");
header("Access-Control-Max-Age: 86400");

if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
    http_response_code(204);
    exit;
}
?>
