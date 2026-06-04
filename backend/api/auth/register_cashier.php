<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"));

$fullName = trim((string) ($data->full_name ?? ""));
$email = strtolower(trim((string) ($data->email ?? "")));
$phone = sanitizePhoneNumber((string) ($data->phone ?? ""));
$username = strtolower(trim((string) ($data->username ?? "")));
$password = (string) ($data->password ?? "");
$branchId = (int) ($data->branch_id ?? 0);
$registrationNote = trim((string) ($data->registration_note ?? ""));
$clientIp = getClientIpAddress();

if (mb_strlen($fullName) < 3 || mb_strlen($fullName) > 100) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Nama lengkap harus diisi 3 sampai 100 karakter.",
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Email tidak valid.",
    ]);
    exit;
}

if (strlen($phone) < 10 || strlen($phone) > 16) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Nomor HP harus diisi 10 sampai 16 digit.",
    ]);
    exit;
}

if (!isValidUsername($username)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Username harus 4-30 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau strip.",
    ]);
    exit;
}

$passwordError = validatePasswordStrength($password);
if ($passwordError !== null) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => $passwordError,
    ]);
    exit;
}

if ($branchId <= 0) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Cabang tujuan wajib dipilih.",
    ]);
    exit;
}

if (mb_strlen($registrationNote) > 500) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Catatan pendaftaran maksimal 500 karakter.",
    ]);
    exit;
}

try {
    $branchStatement = $conn->prepare(
        "SELECT id, name
         FROM branches
         WHERE id = :id AND status = 'active'
         LIMIT 1"
    );
    $branchStatement->execute([
        ":id" => $branchId,
    ]);
    $branch = $branchStatement->fetch(PDO::FETCH_ASSOC);

    if (!$branch) {
        http_response_code(422);
        echo json_encode([
            "status" => "error",
            "message" => "Cabang tujuan tidak tersedia atau sedang nonaktif.",
        ]);
        exit;
    }

    $duplicateStatement = $conn->prepare(
        "SELECT username, email
         FROM users
         WHERE username = :username OR email = :email
         LIMIT 1"
    );
    $duplicateStatement->execute([
        ":username" => $username,
        ":email" => $email,
    ]);
    $duplicateUser = $duplicateStatement->fetch(PDO::FETCH_ASSOC);

    if ($duplicateUser) {
        $message = ($duplicateUser["username"] ?? "") === $username
            ? "Username sudah dipakai. Gunakan username lain."
            : "Email sudah terdaftar. Gunakan email lain.";

        http_response_code(409);
        echo json_encode([
            "status" => "error",
            "message" => $message,
        ]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $insertStatement = $conn->prepare(
        "INSERT INTO users (
            username,
            full_name,
            email,
            phone,
            password,
            role,
            status,
            registration_note,
            branch_id,
            created_at
        ) VALUES (
            :username,
            :full_name,
            :email,
            :phone,
            :password,
            'cashier',
            'pending',
            :registration_note,
            :branch_id,
            NOW()
        )"
    );

    $insertStatement->execute([
        ":username" => $username,
        ":full_name" => $fullName,
        ":email" => $email,
        ":phone" => $phone,
        ":password" => $hashedPassword,
        ":registration_note" => $registrationNote !== "" ? $registrationNote : null,
        ":branch_id" => $branchId,
    ]);

    appendSecurityLog("cashier_registration_submitted", [
        "username" => $username,
        "ip" => $clientIp,
        "branch_id" => $branchId,
        "email" => $email,
    ]);

    echo json_encode([
        "status" => "success",
        "message" => "Pendaftaran kasir berhasil dikirim. Tunggu persetujuan admin sebelum login.",
        "data" => [
            "branch_name" => $branch["name"] ?? null,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengirim pendaftaran kasir.",
    ]);
}
?>
