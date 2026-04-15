<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->items)) {
    $conn->beginTransaction();
    try {
        // Simpan transaksi utama
        $stmt = $conn->prepare("INSERT INTO transactions (user_id, branch_id, total_price, payment_method) VALUES (:u, :b, :t, :p)");
        $stmt->execute([
            ':u' => $data->user_id,
            ':b' => $data->branch_id,
            ':t' => $data->total_price,
            ':p' => $data->payment_method
        ]);
        $trx_id = $conn->lastInsertId();

        foreach($data->items as $item) {
            // 1. Simpan detail item transaksi
            $stmtItem = $conn->prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (:t, :p, :q, :s)");
            $stmtItem->execute([
                ':t' => $trx_id,
                ':p' => $item->id,
                ':q' => $item->qty,
                ':s' => $item->price * $item->qty
            ]);

            // 2. LOGIKA POTONG STOK (Resep Manual)
            $recipe = [];

            // Jika yang dibeli adalah Brown Sugar Fresh Milk (ID 6)
            if ($item->id == 6) {
                $recipe = [
                    ['id' => 2, 'usage' => 150], // Potong Susu UHT (ID 2) 150ml
                    ['id' => 3, 'usage' => 20],  // Potong Gula Aren (ID 3) 20ml
                ];
            } 
            // Jika yang dibeli adalah Matcha Latte (Contoh ID 8)
            else if ($item->id == 8) {
                $recipe = [
                    ['id' => 8, 'usage' => 10],  // Potong Powder Matcha (ID 8) 10gr
                    ['id' => 7, 'usage' => 15],  // Potong Gula Cair (ID 7) 15ml
                ];
            }

            // Eksekusi pemotongan stok di tabel ingredients
            foreach ($recipe as $ingredient) {
                $total_used = $ingredient['usage'] * $item->qty;
                
                $stmtUpdate = $conn->prepare("UPDATE ingredients SET stock_quantity = stock_quantity - :used WHERE id = :ing_id");
                $stmtUpdate->execute([
                    ':used' => $total_used,
                    ':ing_id' => $ingredient['id']
                ]);
            }
        }

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "Stok Berhasil Dipotong!"]);
    } catch(Exception $e) {
        $conn->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}