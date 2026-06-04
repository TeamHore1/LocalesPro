<?php

require_once __DIR__ . "/env.php";

localespro_load_env();

$defaultConfig = [
    "enabled" => false,
    "app_path" => (string) localespro_env("LOCALESPRO_APP_PATH", "/LocalesPro-v1-main"),
    "public_base_url" => trim((string) localespro_env("LOCALESPRO_PUBLIC_BASE_URL", "")),
];

$localConfigPath = __DIR__ . "/payment.local.php";

if (file_exists($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig)) {
        return array_replace_recursive($defaultConfig, $localConfig);
    }
}

return $defaultConfig;
?>
