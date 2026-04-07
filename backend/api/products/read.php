<?php
// 1. BARIS WAJIB: Header CORS dan Koneksi Database
require_once "../../config/cors.php";
require_once "../../config/database.php";

try {
    // 2. Ambil parameter branch_id dari URL (jika ada)
    // Contoh: read.php?branch_id=1
    $branch_id = isset($_GET['branch_id']) ? $_GET['branch_id'] : null;

    // 3. Susun Query SQL
    // Kita hanya mengambil yang statusnya 'active' agar produk yang "dihapus" tidak muncul
    if ($branch_id) {
        $query = "SELECT * FROM products 
                  WHERE status = 'active' AND branch_id = :branch_id 
                  ORDER BY id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute([':branch_id' => $branch_id]);
    } else {
        // Jika tidak ada branch_id, ambil semua yang aktif
        $query = "SELECT * FROM products 
                  WHERE status = 'active' 
                  ORDER BY id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
    }

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Kirim Respon ke React
    echo json_encode([
        "status" => "success",
        "data" => $products
    ]);

} catch (PDOException $e) {
    // Jika ada error database
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data: " . $e->getMessage()
    ]);
}
?>