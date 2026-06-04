<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));
$username = trim((string) ($data->username ?? ""));
$password = (string) ($data->password ?? "");
$requestedRole = strtolower(trim((string) ($data->requested_role ?? "cashier")));
$clientIp = getClientIpAddress();
$tokenTtl = 28800;
$allowedRequestedRoles = ["cashier", "dashboard"];

if ($username === "" || $password === "") {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Username dan password wajib diisi.",
    ]);
    exit;
}

if (!in_array($requestedRole, $allowedRequestedRoles, true)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Mode login tidak valid.",
    ]);
    exit;
}

$throttleState = getLoginThrottleState($username, $clientIp);

if (($throttleState["locked"] ?? false) === true) {
    $retryAfter = max(1, (int) ($throttleState["lock_until"] ?? 0) - time());

    appendSecurityLog("login_blocked", [
        "username" => strtolower($username),
        "ip" => $clientIp,
        "reason" => "rate_limited",
        "requested_role" => $requestedRole,
        "retry_after_seconds" => $retryAfter,
    ]);

    http_response_code(429);
    echo json_encode([
        "status" => "error",
        "message" => "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.",
        "retry_after_seconds" => $retryAfter,
    ]);
    exit;
}

$query = "SELECT u.*, b.name AS branch_name
          FROM users u
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.username = :username
          LIMIT 1";

$statement = $conn->prepare($query);
$statement->bindValue(":username", $username, PDO::PARAM_STR);
$statement->execute();
$user = $statement->fetch(PDO::FETCH_ASSOC);

if ($user && isValidPassword($password, (string) $user["password"])) {
    $userStatus = normalizeUserStatus((string) ($user["status"] ?? "active"));
    $normalizedRole = normalizeRole((string) ($user["role"] ?? ""));
    $requiresDashboardRole = $requestedRole === "dashboard";

    if ($requiresDashboardRole && $normalizedRole !== "admin") {
        appendSecurityLog("login_denied_role", [
            "username" => strtolower($username),
            "ip" => $clientIp,
            "role" => $normalizedRole,
            "requested_role" => $requestedRole,
            "reason" => "role_mismatch",
        ]);

        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Akun ini tidak punya akses ke mode admin.",
        ]);
        exit;
    }

    if (!$requiresDashboardRole && $normalizedRole !== "cashier") {
        appendSecurityLog("login_denied_role", [
            "username" => strtolower($username),
            "ip" => $clientIp,
            "role" => $normalizedRole,
            "requested_role" => $requestedRole,
            "reason" => "role_mismatch",
        ]);

        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Akun ini tidak punya akses ke mode kasir.",
        ]);
        exit;
    }

    if (!canUserLogin($user)) {
        appendSecurityLog("login_denied_status", [
            "username" => strtolower($username),
            "ip" => $clientIp,
            "reason" => $userStatus,
            "requested_role" => $requestedRole,
        ]);

        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => getUserLoginBlockMessage($userStatus),
        ]);
        exit;
    }

    upgradePasswordHashIfNeeded($conn, $user, $password);
    recordSuccessfulLogin($conn, (int) ($user["id"] ?? 0));
    clearLoginAttempts($username, $clientIp);

    $normalizedUser = normalizeUserRecord($user);
    unset($normalizedUser["password"]);

    appendSecurityLog("login_success", [
        "username" => $normalizedUser["username"] ?? strtolower($username),
        "ip" => $clientIp,
        "role" => $normalizedUser["role"] ?? null,
        "requested_role" => $requestedRole,
        "branch_id" => $normalizedUser["branch_id"] ?? null,
    ]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "token" => createToken($normalizedUser, $tokenTtl),
            "expires_in" => $tokenTtl,
            "expires_at" => gmdate("c", time() + $tokenTtl),
            "user" => $normalizedUser,
        ],
    ]);
    exit;
}

usleep(250000);
$updatedState = recordFailedLoginAttempt($username, $clientIp);

appendSecurityLog("login_failed", [
    "username" => strtolower($username),
    "ip" => $clientIp,
    "reason" => "invalid_credentials",
    "requested_role" => $requestedRole,
    "remaining_attempts" => $updatedState["remaining_attempts"] ?? 0,
]);

if (($updatedState["locked"] ?? false) === true) {
    $retryAfter = max(1, (int) ($updatedState["lock_until"] ?? 0) - time());

    http_response_code(429);
    echo json_encode([
        "status" => "error",
        "message" => "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi.",
        "retry_after_seconds" => $retryAfter,
    ]);
    exit;
}

http_response_code(401);
echo json_encode([
    "status" => "error",
    "message" => "Login gagal. Periksa kembali username dan password.",
    "remaining_attempts" => $updatedState["remaining_attempts"] ?? 0,
]);
?>
