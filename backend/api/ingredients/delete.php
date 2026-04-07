<?php
// 1. Panggil CORS paling atas untuk buka gerbang keamanan
require_once "../../config/cors.php";
require_once "../../config/database.php";

// 2. Tangkap data JSON (biasanya cuma kirim ID)
$data = json_decode(file_get_contents("php://input"));

// 3. Validasi: Pastikan ID-nya ada
if (!empty($data->id)) {
    try {
        // Siapkan query hapus
        $query = "DELETE FROM ingredients WHERE id = :id";
        $stmt = $conn->prepare($query);

        // Bind parameter ID
        $params = [
            ':id' => $data->id
        ];

        if ($stmt->execute($params)) {
            echo json_encode([
                "status"  => "success",
                "message" => "Bahan baku berhasil dihapus!"
            ]);
        } else {
            echo json_encode([
                "status"  => "error",
                "message" => "Gagal menghapus data dari database."
            ]);
        }

    } catch (PDOException $e) {
        // Jika error karena bahan ini masih dipakai di tabel lain (Foreign Key Error)
        if ($e->getCode() == "23000") {
            echo json_encode([
                "status"  => "error",
                "message" => "Tidak bisa dihapus! Bahan ini masih digunakan dalam resep menu."
            ]);
        } else {
            echo json_encode([
                "status"  => "error", 
                "message" => "Database Error: " . $e->getMessage()
            ]);
        }
    }
} else {
    echo json_encode([
        "status"  => "error", 
        "message" => "ID tidak ditemukan. Gagal menghapus."
    ]);
}
?>