<?php

function localespro_load_env(): void
{
    static $loaded = false;

    if ($loaded) {
        return;
    }

    $loaded = true;

    $candidates = [
        dirname(__DIR__) . DIRECTORY_SEPARATOR . ".env",
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . ".env",
    ];

    foreach ($candidates as $path) {
        if (!is_file($path)) {
            continue;
        }

        localespro_parse_env_file($path);
        break;
    }
}

function localespro_parse_env_file(string $path): void
{
    $lines = file($path, FILE_IGNORE_NEW_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === "" || str_starts_with($line, "#")) {
            continue;
        }

        $separatorPos = strpos($line, "=");
        if ($separatorPos === false) {
            continue;
        }

        $key = trim(substr($line, 0, $separatorPos));
        $value = trim(substr($line, $separatorPos + 1));

        if ($key === "") {
            continue;
        }

        if (
            (str_starts_with($value, "\"") && str_ends_with($value, "\""))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        ) {
            $value = substr($value, 1, -1);
        }

        if (getenv($key) === false) {
            putenv($key . "=" . $value);
            $_ENV[$key] = $value;
        }
    }
}

function localespro_env(string $key, $default = null)
{
    localespro_load_env();

    $value = getenv($key);
    if ($value === false) {
        return $default;
    }

    return $value;
}

function localespro_is_production(): bool
{
    return strtolower((string) localespro_env("LOCALESPRO_APP_ENV", "local")) === "production";
}

function localespro_env_bool(string $key, bool $default = false): bool
{
    $value = strtolower(trim((string) localespro_env($key, $default ? "true" : "false")));

    return in_array($value, ["1", "true", "yes", "on"], true);
}

function localespro_get_allowed_origins(): array
{
    $raw = trim((string) localespro_env("LOCALESPRO_CORS_ORIGINS", ""));

    if ($raw === "") {
        if (localespro_is_production()) {
            return [];
        }

        return ["*"];
    }

    if ($raw === "*") {
        return localespro_is_production() ? [] : ["*"];
    }

    return array_values(array_filter(array_map("trim", explode(",", $raw))));
}

function localespro_require_production_secret(string $envKey, string $message): string
{
    $value = trim((string) localespro_env($envKey, ""));

    if ($value !== "") {
        return $value;
    }

    if (!localespro_is_production()) {
        return "";
    }

    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "status" => "error",
        "message" => $message,
    ]);
    exit;
}

?>
