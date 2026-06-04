<?php
require_once __DIR__ . "/../config/env.php";

function getAuthSecret(): string
{
    localespro_load_env();

    $envSecret = getenv("LOCALESPRO_JWT_SECRET");
    if ($envSecret !== false && trim($envSecret) !== "") {
        return trim($envSecret);
    }

    if (localespro_is_production()) {
        localespro_require_production_secret(
            "LOCALESPRO_JWT_SECRET",
            "Server belum dikonfigurasi. Isi LOCALESPRO_JWT_SECRET di backend/.env"
        );
    }

    return hash(
        "sha256",
        implode("|", [
            __DIR__,
            dirname(__DIR__),
            php_uname(),
            gethostname() ?: "localespro-host",
        ])
    );
}

function getAuthIssuer(): string
{
    $issuer = getenv("LOCALESPRO_JWT_ISSUER");
    if ($issuer !== false && trim($issuer) !== "") {
        return trim($issuer);
    }

    return "localespro-backend";
}

function getAuthAudience(): string
{
    $audience = getenv("LOCALESPRO_JWT_AUDIENCE");
    if ($audience !== false && trim($audience) !== "") {
        return trim($audience);
    }

    return "localespro-frontend";
}

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), "+/", "-_"), "=");
}

function base64UrlDecode(string $value)
{
    $remainder = strlen($value) % 4;
    if ($remainder > 0) {
        $value .= str_repeat("=", 4 - $remainder);
    }

    return base64_decode(strtr($value, "-_", "+/"), true);
}

function getAuthorizationHeader(): ?string
{
    $headers = [];

    if (function_exists("getallheaders")) {
        $headers = getallheaders();
    } elseif (function_exists("apache_request_headers")) {
        $headers = apache_request_headers();
    }

    foreach ($headers as $key => $value) {
        if (strtolower($key) === "authorization") {
            return $value;
        }
    }

    if (!empty($_SERVER["HTTP_AUTHORIZATION"])) {
        return $_SERVER["HTTP_AUTHORIZATION"];
    }

    if (!empty($_SERVER["REDIRECT_HTTP_AUTHORIZATION"])) {
        return $_SERVER["REDIRECT_HTTP_AUTHORIZATION"];
    }

    return null;
}

function normalizeRole(string $role): string
{
    $normalized = strtolower(trim($role));

    if (in_array($normalized, ["cashier", "kasir", "pegawai"], true)) {
        return "cashier";
    }

    if ($normalized === "admin") {
        return "admin";
    }

    return $normalized !== "" ? $normalized : "unknown";
}

function normalizeUserStatus(string $status): string
{
    $normalized = strtolower(trim($status));

    if (in_array($normalized, ["pending", "active", "rejected", "inactive"], true)) {
        return $normalized;
    }

    return $normalized !== "" ? $normalized : "active";
}

function normalizeUserRecord(array $user): array
{
    $normalized = $user;
    $normalized["id"] = (int) ($user["id"] ?? 0);
    $normalized["role"] = normalizeRole((string) ($user["role"] ?? ""));
    $normalized["status"] = normalizeUserStatus((string) ($user["status"] ?? "active"));
    $normalized["branch_id"] = isset($user["branch_id"]) && is_numeric($user["branch_id"])
        ? (int) $user["branch_id"]
        : null;
    $normalized["approved_by"] = isset($user["approved_by"]) && is_numeric($user["approved_by"])
        ? (int) $user["approved_by"]
        : null;
    $normalized["full_name"] = trim((string) ($user["full_name"] ?? $user["name"] ?? ""));
    $normalized["name"] = $normalized["full_name"] !== ""
        ? $normalized["full_name"]
        : (string) ($user["name"] ?? $user["username"] ?? "");
    $normalized["email"] = isset($user["email"]) ? trim((string) $user["email"]) : null;
    $normalized["phone"] = isset($user["phone"]) ? trim((string) $user["phone"]) : null;

    return $normalized;
}

function createToken(array $user, int $ttlInSeconds = 28800): string
{
    $normalizedUser = normalizeUserRecord($user);
    $issuedAt = time();
    $header = [
        "alg" => "HS256",
        "typ" => "JWT",
    ];
    $payload = [
        "iss" => getAuthIssuer(),
        "aud" => getAuthAudience(),
        "jti" => bin2hex(random_bytes(16)),
        "id" => $normalizedUser["id"],
        "sub" => $normalizedUser["id"],
        "username" => $normalizedUser["username"] ?? null,
        "full_name" => $normalizedUser["full_name"] ?? null,
        "role" => $normalizedUser["role"] ?? null,
        "status" => $normalizedUser["status"] ?? "active",
        "branch_id" => $normalizedUser["branch_id"],
        "iat" => $issuedAt,
        "nbf" => $issuedAt,
        "exp" => $issuedAt + $ttlInSeconds,
    ];

    $headerEncoded = base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES));
    $payloadEncoded = base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $signature = hash_hmac(
        "sha256",
        $headerEncoded . "." . $payloadEncoded,
        getAuthSecret(),
        true
    );

    return $headerEncoded . "." . $payloadEncoded . "." . base64UrlEncode($signature);
}

function verifyToken(?string $token = null): ?array
{
    if ($token === null) {
        $authorization = getAuthorizationHeader();
        if (!$authorization || !preg_match('/Bearer\s+(.+)/i', $authorization, $matches)) {
            return null;
        }

        $token = trim($matches[1]);
    }

    $parts = explode(".", $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    $headerJson = base64UrlDecode($headerEncoded);
    $payloadJson = base64UrlDecode($payloadEncoded);
    $signature = base64UrlDecode($signatureEncoded);

    if ($headerJson === false || $payloadJson === false || $signature === false) {
        return null;
    }

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);

    if (!is_array($header) || !is_array($payload)) {
        return null;
    }

    if (($header["alg"] ?? "") !== "HS256") {
        return null;
    }

    $expectedSignature = hash_hmac(
        "sha256",
        $headerEncoded . "." . $payloadEncoded,
        getAuthSecret(),
        true
    );

    if (!hash_equals($expectedSignature, $signature)) {
        return null;
    }

    $now = time();

    if (trim((string) ($payload["iss"] ?? "")) !== getAuthIssuer()) {
        return null;
    }

    if (trim((string) ($payload["aud"] ?? "")) !== getAuthAudience()) {
        return null;
    }

    if (isset($payload["nbf"]) && $now < (int) $payload["nbf"]) {
        return null;
    }

    if (isset($payload["exp"]) && $now >= (int) $payload["exp"]) {
        return null;
    }

    if ((int) ($payload["sub"] ?? 0) <= 0) {
        return null;
    }

    return normalizeUserRecord($payload);
}

function sendAuthJson(int $httpCode, string $message): void
{
    http_response_code($httpCode);
    echo json_encode([
        "status" => "error",
        "message" => $message,
    ]);
    exit;
}

function requireAuth(): array
{
    $user = verifyToken();

    if (!$user) {
        sendAuthJson(401, "Sesi login tidak valid atau sudah kedaluwarsa.");
    }

    return $user;
}

function hasAllowedRole(array $user, array $allowedRoles): bool
{
    $normalizedUserRole = normalizeRole((string) ($user["role"] ?? ""));
    $normalizedAllowedRoles = array_map(
        static fn($role) => normalizeRole((string) $role),
        $allowedRoles
    );

    return in_array($normalizedUserRole, $normalizedAllowedRoles, true);
}

function requireRoles(array $allowedRoles): array
{
    $user = requireAuth();

    if (!hasAllowedRole($user, $allowedRoles)) {
        sendAuthJson(403, "Akun ini tidak punya akses ke fitur tersebut.");
    }

    return $user;
}

function requireAdmin(): array
{
    return requireRoles(["admin"]);
}

function getAuthenticatedBranchId(array $user): ?int
{
    return isset($user["branch_id"]) && is_numeric($user["branch_id"]) && (int) $user["branch_id"] > 0
        ? (int) $user["branch_id"]
        : null;
}

function getUserLoginBlockMessage(string $status): string
{
    $normalizedStatus = normalizeUserStatus($status);

    if ($normalizedStatus === "pending") {
        return "Pendaftaran akun kasir Anda masih menunggu persetujuan admin.";
    }

    if ($normalizedStatus === "rejected") {
        return "Pendaftaran akun Anda ditolak. Hubungi admin untuk informasi lebih lanjut.";
    }

    if ($normalizedStatus === "inactive") {
        return "Akun Anda sedang dinonaktifkan. Hubungi admin untuk mengaktifkan kembali.";
    }

    return "Akun belum dapat digunakan untuk login.";
}

function canUserLogin(array $user): bool
{
    return normalizeUserStatus((string) ($user["status"] ?? "active")) === "active";
}

function sanitizePhoneNumber(string $phone): string
{
    return preg_replace('/[^0-9+]/', '', trim($phone)) ?? "";
}

function isValidUsername(string $username): bool
{
    return preg_match('/^[a-zA-Z0-9._-]{4,30}$/', $username) === 1;
}

function validatePasswordStrength(string $password): ?string
{
    if (strlen($password) < 8) {
        return "Password minimal 8 karakter.";
    }

    if (!preg_match('/[A-Z]/', $password)) {
        return "Password harus mengandung minimal 1 huruf besar.";
    }

    if (!preg_match('/[a-z]/', $password)) {
        return "Password harus mengandung minimal 1 huruf kecil.";
    }

    if (!preg_match('/[0-9]/', $password)) {
        return "Password harus mengandung minimal 1 angka.";
    }

    return null;
}

function recordSuccessfulLogin(PDO $conn, int $userId): void
{
    if ($userId <= 0) {
        return;
    }

    try {
        $statement = $conn->prepare(
            "UPDATE users
             SET last_login_at = NOW()
             WHERE id = :id"
        );
        $statement->execute([
            ":id" => $userId,
        ]);
    } catch (Throwable $e) {
        // Abaikan jika skema lama belum memiliki kolom last_login_at.
    }
}

function resolveAuthorizedBranchId(array $user, $requestedBranchId = null, bool $allowNull = false): ?int
{
    $role = normalizeRole((string) ($user["role"] ?? ""));
    $userBranchId = getAuthenticatedBranchId($user);
    $normalizedRequest = isset($requestedBranchId) && is_numeric($requestedBranchId) && (int) $requestedBranchId > 0
        ? (int) $requestedBranchId
        : null;

    if ($role === "cashier") {
        if ($userBranchId === null) {
            throw new RuntimeException("Akun kasir belum terhubung ke cabang.");
        }

        if ($normalizedRequest !== null && $normalizedRequest !== $userBranchId) {
            throw new RuntimeException("Kasir hanya boleh mengakses cabangnya sendiri.");
        }

        return $userBranchId;
    }

    if ($normalizedRequest !== null) {
        return $normalizedRequest;
    }

    if ($allowNull) {
        return null;
    }

    if ($userBranchId !== null) {
        return $userBranchId;
    }

    throw new RuntimeException("Cabang aktif belum dipilih.");
}

function getClientIpAddress(): string
{
    $candidates = [
        $_SERVER["HTTP_CF_CONNECTING_IP"] ?? null,
        $_SERVER["HTTP_X_FORWARDED_FOR"] ?? null,
        $_SERVER["REMOTE_ADDR"] ?? null,
    ];

    foreach ($candidates as $candidate) {
        if (!$candidate) {
            continue;
        }

        $parts = explode(",", (string) $candidate);
        $ip = trim((string) $parts[0]);

        if ($ip !== "") {
            return $ip;
        }
    }

    return "unknown";
}

function getSecurityStorageDirectory(): string
{
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . "logs";
}

function ensureSecurityStorageDirectory(): string
{
    $directory = getSecurityStorageDirectory();

    if (!is_dir($directory)) {
        mkdir($directory, 0775, true);
    }

    return $directory;
}

function getSecurityLogPath(): string
{
    return ensureSecurityStorageDirectory() . DIRECTORY_SEPARATOR . "auth_security.log";
}

function getLoginAttemptStorePath(): string
{
    return ensureSecurityStorageDirectory() . DIRECTORY_SEPARATOR . "login_attempts.json";
}

function appendSecurityLog(string $event, array $context = []): void
{
    $record = [
        "timestamp" => gmdate("c"),
        "event" => $event,
        "ip" => $context["ip"] ?? getClientIpAddress(),
        "username" => $context["username"] ?? null,
        "role" => $context["role"] ?? null,
        "reason" => $context["reason"] ?? null,
        "user_agent" => substr((string) ($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 300),
    ];

    foreach ($context as $key => $value) {
        if (!array_key_exists($key, $record)) {
            $record[$key] = $value;
        }
    }

    file_put_contents(
        getSecurityLogPath(),
        json_encode($record, JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function getLoginRateLimitConfig(): array
{
    return [
        "window_seconds" => 900,
        "max_attempts" => 5,
        "lockout_seconds" => 900,
    ];
}

function buildLoginAttemptKey(string $username, string $ip): string
{
    return hash("sha256", strtolower(trim($username)) . "|" . trim($ip));
}

function pruneLoginAttemptStore(array &$store, int $now): void
{
    $config = getLoginRateLimitConfig();
    $maxAge = max($config["window_seconds"], $config["lockout_seconds"]) * 2;

    if (!isset($store["entries"]) || !is_array($store["entries"])) {
        $store["entries"] = [];
        return;
    }

    foreach ($store["entries"] as $key => $entry) {
        $lastAttemptAt = (int) ($entry["last_attempt_at"] ?? 0);
        $lockUntil = (int) ($entry["lock_until"] ?? 0);

        if ($lockUntil > $now) {
            continue;
        }

        if ($lastAttemptAt <= 0 || ($now - $lastAttemptAt) > $maxAge) {
            unset($store["entries"][$key]);
        }
    }
}

function mutateLoginAttemptStore(callable $callback)
{
    $path = getLoginAttemptStorePath();
    $handle = fopen($path, "c+");

    if ($handle === false) {
        return null;
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            return null;
        }

        rewind($handle);
        $contents = stream_get_contents($handle);
        $store = json_decode($contents ?: "[]", true);

        if (!is_array($store)) {
            $store = [];
        }

        if (!isset($store["entries"]) || !is_array($store["entries"])) {
            $store["entries"] = [];
        }

        $result = $callback($store);

        rewind($handle);
        ftruncate($handle, 0);
        fwrite($handle, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($handle);
        flock($handle, LOCK_UN);

        return $result;
    } finally {
        fclose($handle);
    }
}

function getLoginThrottleState(string $username, string $ip): array
{
    $username = strtolower(trim($username));
    $ip = trim($ip);
    $config = getLoginRateLimitConfig();

    $state = mutateLoginAttemptStore(function (&$store) use ($username, $ip, $config) {
        $now = time();
        pruneLoginAttemptStore($store, $now);

        $key = buildLoginAttemptKey($username, $ip);
        $entry = $store["entries"][$key] ?? null;
        $lockUntil = (int) ($entry["lock_until"] ?? 0);

        return [
            "locked" => $lockUntil > $now,
            "lock_until" => $lockUntil,
            "remaining_attempts" => max(
                0,
                $config["max_attempts"] - (int) ($entry["attempts"] ?? 0)
            ),
        ];
    });

    if (!is_array($state)) {
        return [
            "locked" => false,
            "lock_until" => 0,
            "remaining_attempts" => $config["max_attempts"],
        ];
    }

    return $state;
}

function recordFailedLoginAttempt(string $username, string $ip): array
{
    $username = strtolower(trim($username));
    $ip = trim($ip);
    $config = getLoginRateLimitConfig();

    $state = mutateLoginAttemptStore(function (&$store) use ($username, $ip, $config) {
        $now = time();
        pruneLoginAttemptStore($store, $now);

        $key = buildLoginAttemptKey($username, $ip);
        $entry = $store["entries"][$key] ?? [
            "username" => $username,
            "ip" => $ip,
            "attempts" => 0,
            "first_attempt_at" => $now,
            "last_attempt_at" => 0,
            "lock_until" => 0,
        ];

        if (($now - (int) ($entry["last_attempt_at"] ?? 0)) > $config["window_seconds"]) {
            $entry["attempts"] = 0;
            $entry["first_attempt_at"] = $now;
            $entry["lock_until"] = 0;
        }

        $entry["attempts"] = (int) ($entry["attempts"] ?? 0) + 1;
        $entry["last_attempt_at"] = $now;

        if ((int) $entry["attempts"] >= $config["max_attempts"]) {
            $entry["lock_until"] = $now + $config["lockout_seconds"];
        }

        $store["entries"][$key] = $entry;

        return [
            "locked" => (int) $entry["lock_until"] > $now,
            "lock_until" => (int) $entry["lock_until"],
            "remaining_attempts" => max(0, $config["max_attempts"] - (int) $entry["attempts"]),
        ];
    });

    if (!is_array($state)) {
        return [
            "locked" => false,
            "lock_until" => 0,
            "remaining_attempts" => 0,
        ];
    }

    return $state;
}

function clearLoginAttempts(string $username, string $ip): void
{
    $username = strtolower(trim($username));
    $ip = trim($ip);

    mutateLoginAttemptStore(function (&$store) use ($username, $ip) {
        $key = buildLoginAttemptKey($username, $ip);
        unset($store["entries"][$key]);
        return true;
    });
}

function isValidPassword(string $plainPassword, string $storedPassword): bool
{
    $passwordInfo = password_get_info($storedPassword);
    if (($passwordInfo["algo"] ?? null) !== null && $passwordInfo["algo"] !== 0) {
        return password_verify($plainPassword, $storedPassword);
    }

    return hash_equals($storedPassword, $plainPassword);
}

function shouldUpgradePasswordHash(string $storedPassword): bool
{
    $passwordInfo = password_get_info($storedPassword);

    if (($passwordInfo["algo"] ?? null) === null || $passwordInfo["algo"] === 0) {
        return true;
    }

    return password_needs_rehash($storedPassword, PASSWORD_DEFAULT);
}

function upgradePasswordHashIfNeeded(PDO $conn, array $user, string $plainPassword): void
{
    $storedPassword = (string) ($user["password"] ?? "");
    $userId = (int) ($user["id"] ?? 0);

    if ($userId <= 0 || $storedPassword === "" || !shouldUpgradePasswordHash($storedPassword)) {
        return;
    }

    $newHash = password_hash($plainPassword, PASSWORD_DEFAULT);
    $statement = $conn->prepare(
        "UPDATE users
         SET password = :password
         WHERE id = :id AND password = :current_password"
    );

    $statement->execute([
        ":password" => $newHash,
        ":id" => $userId,
        ":current_password" => $storedPassword,
    ]);
}
?>
