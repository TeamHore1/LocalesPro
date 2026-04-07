<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

// 1. Tangkap data JSON dari React (Axios)
$data = json_decode(file_get_contents("php://input"));

// 2. Validasi: Pastikan ID dan Nama tersedia (Minimal syarat update)
if (
    !empty($data->id) && 
    !empty($data->name)
) {
    try {
        // 3. Siapkan Query Update disesuaikan dengan struktur database asli
        // Menggunakan stock_quantity dan branch_id sesuai screenshot phpMyAdmin
        $query = "UPDATE ingredients 
                  SET name = :name, 
                      unit = :unit, 
                      stock_quantity = :stock_quantity, 
                      branch_id = :branch_id 
                  WHERE id = :id";

        $stmt = $conn->prepare($query);

        // 4. Bind Parameter dan Eksekusi
        // Kita ambil data 'stock' dari React dan masukkan ke 'stock_quantity' di DB
        $params = [
            ':id'             => $data->id,
            ':name'           => $data->name,
            ':unit'           => isset($data->unit) ? $data->unit : "",
            ':stock_quantity' => isset($data->stock) ? $data->stock : 0,
            ':branch_id'      => isset($data->branch_id) ? $data->branch_id : 1
        ];

        if ($stmt->execute($params)) {
            echo json_encode([
                "status"  => "success",
                "message" => "Data bahan baku berhasil diperbarui!"
            ]);
        } else {
            echo json_encode([
                "status"  => "error",
                "message" => "Gagal memperbarui data di database."
            ]);
        }

    } catch (PDOException $e) {
        // Tangani error database jika query bermasalah
        echo json_encode([
            "status"  => "error", 
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    // Jika data wajib (ID atau Nama) tidak dikirim oleh React
    echo json_encode([
        "status"  => "error", 
        "message" => "Data tidak lengkap. ID dan Nama bahan wajib diisi."
    ]);
}
?>