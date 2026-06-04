<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";
require_once "../../auth/verify_token.php";

header("Content-Type: application/json");

$authUser = requireAdmin();
$statusFilter = strtolower(trim((string) ($_GET["status"] ?? "all")));
$allowedStatuses = ["all", "pending", "active", "inactive", "rejected"];

if (!in_array($statusFilter, $allowedStatuses, true)) {
    $statusFilter = "all";
}

try {
    $countStatement = $conn->prepare(
        "SELECT status, COUNT(*) AS total
         FROM users
         WHERE role = 'cashier'
         GROUP BY status"
    );
    $countStatement->execute();
    $countRows = $countStatement->fetchAll(PDO::FETCH_ASSOC);

    $counts = [
        "pending" => 0,
        "active" => 0,
        "inactive" => 0,
        "rejected" => 0,
    ];

    foreach ($countRows as $row) {
        $counts[normalizeUserStatus((string) ($row["status"] ?? ""))] = (int) ($row["total"] ?? 0);
    }

    $query = "SELECT
                u.id,
                u.username,
                u.full_name,
                u.email,
                u.phone,
                u.role,
                u.status,
                u.registration_note,
                u.review_note,
                u.branch_id,
                u.approved_by,
                u.approved_at,
                u.last_login_at,
                u.created_at,
                b.name AS branch_name,
                approver.username AS approved_by_username,
                approver.full_name AS approved_by_name
              FROM users u
              LEFT JOIN branches b ON b.id = u.branch_id
              LEFT JOIN users approver ON approver.id = u.approved_by
              WHERE u.role = 'cashier'";

    $params = [];
    if ($statusFilter !== "all") {
        $query .= " AND u.status = :status";
        $params[":status"] = $statusFilter;
    }

    $query .= " ORDER BY
                  FIELD(u.status, 'pending', 'active', 'inactive', 'rejected'),
                  u.created_at DESC,
                  u.id DESC";

    $statement = $conn->prepare($query);
    $statement->execute($params);
    $registrations = $statement->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "data" => [
            "items" => array_map("normalizeUserRecord", $registrations),
            "counts" => $counts,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data pendaftaran kasir.",
    ]);
}
?>
