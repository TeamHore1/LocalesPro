<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

try {
    // 1. Ambil data transaksi utama
    $query = "SELECT t.*, u.username as cashier_name, b.name as branch_name 
              FROM transactions t
              JOIN users u ON t.user_id = u.id
              JOIN branches b ON t.branch_id = b.id
              ORDER BY t.created_at DESC";
              
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Ambil semua detail item untuk setiap transaksi
    // Kita buat loop untuk memasukkan detail item ke masing-masing transaksi
    foreach ($history as $key => $trx) {
        $trx_id = $trx['id'];
        $queryItems = "SELECT p.name, ti.quantity 
                       FROM transaction_items ti 
                       JOIN products p ON ti.product_id = p.id 
                       WHERE ti.transaction_id = ?";
        $stmtItems = $conn->prepare($queryItems);
        $stmtItems->execute([$trx_id]);
        $history[$key]['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success", 
        "data" => $history
    ]);

} catch (Exception $e) {
    // Jika error, jangan kirim status 500 dulu agar React tidak crash total
    echo json_encode([
        "status" => "error", 
        "message" => $e->getMessage()
    ]);
}
?>