<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

// Mengambil data dari React
$data = json_decode(file_get_contents("php://input"));

// Validasi minimal seperti update (tapi tanpa ID karena ini create)
if(!empty($data->name) && !empty($data->price)) {
    try {
        // Query disederhanakan: Mengikuti kolom yang ada di update.php kamu
        // Ditambah branch_id dan status karena tabel products biasanya mewajibkan ini untuk data baru
        $query = "INSERT INTO products (name, price, category, image_url, branch_id, status) 
                  VALUES (:name, :price, :category, :image_url, :branch_id, :status)";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':name'      => $data->name,
            ':price'     => $data->price,
            ':category'  => $data->category,
            ':image_url' => $data->image_url ?? 'boba-default.png',
            ':branch_id' => $data->branch_id ?? 1, // Default 1 jika tidak dikirim
            ':status'    => $data->status ?? 'active' // Default active jika tidak dikirim
        ]);

        echo json_encode(["status" => "success", "message" => "Produk Berhasil Ditambah!"]);
    } catch (PDOException $e) {
        // Menampilkan pesan error asli jika gagal agar kita tahu salahnya di mana
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Nama dan Harga wajib diisi!"]);
}
?>
