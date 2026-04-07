<?php
require_once "../../config/cors.php";
require_once "../../config/database.php";

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->items)) {
    $conn->beginTransaction();
    try {
        // 1. Simpan Header Transaksi
        $stmt = $conn->prepare("INSERT INTO transactions (user_id, branch_id, total_price, payment_method) VALUES (:u, :b, :t, :p)");
        $stmt->execute([
            ':u' => $data->user_id,
            ':b' => $data->branch_id,
            ':t' => $data->total_price,
            ':p' => $data->payment_method
        ]);
        $trx_id = $conn->lastInsertId();

        // 2. Simpan Detail Item
        foreach($data->items as $item) {
            $stmt = $conn->prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, subtotal) VALUES (:t, :p, :q, :s)");
            $stmt->execute([
                ':t' => $trx_id,
                ':p' => $item->id,
                ':q' => $item->qty,
                ':s' => $item->price * $item->qty
            ]);
        }

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "Transaksi Berhasil!"]);
    } catch(Exception $e) {
        $conn->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>