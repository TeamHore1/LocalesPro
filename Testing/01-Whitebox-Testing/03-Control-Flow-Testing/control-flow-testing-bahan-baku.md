# White Box Testing - Control Flow Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Control Flow Testing adalah model white box testing yang berfokus pada alur kontrol program. Pengujian ini memeriksa percabangan, kondisi, dan jalur eksekusi untuk memastikan program tidak salah masuk cabang, tidak melewati validasi penting, dan tidak menghasilkan proses yang tidak diinginkan.

Pada LocalesPro, control flow testing difokuskan pada alur transaksi POS yang mempengaruhi stok bahan baku.

## 2. Tujuan Pengujian

1. Memetakan alur kontrol transaksi POS dari input sampai stok berubah.
2. Mengidentifikasi percabangan penting pada validasi transaksi dan stok.
3. Memastikan jalur gagal berhenti sebelum stok berubah.
4. Memastikan jalur berhasil melakukan commit transaksi dan pengurangan stok.

## 3. Source Code yang Diuji

| File | Bagian Kontrol |
| --- | --- |
| `backend/api/transactions/create.php` | Validasi item, loop item, validasi produk, pembayaran, commit/rollback |
| `backend/config/payment_helpers.php` | Validasi stok berdasarkan resep, akumulasi kebutuhan bahan |
| `backend/api/transactions/delete.php` | Validasi void transaksi dan pemulihan stok |

## 4. Potongan Kode Percabangan

```php
if (empty($data->items) || !is_array($data->items)) {
    http_response_code(422);
    echo json_encode([
        "status" => "error",
        "message" => "Item transaksi tidak boleh kosong.",
    ]);
    exit;
}
```

```php
if ($productId <= 0 || $quantity <= 0) {
    throw new InvalidArgumentException("Ada item transaksi yang tidak valid.");
}
```

```php
if (!$product || ($product["status"] ?? "active") !== "active") {
    throw new InvalidArgumentException("Produk dengan ID {$productId} tidak tersedia.");
}
```

```php
if ($required > $available) {
    throw new InvalidArgumentException(
        "Stok {$ingredientName} tidak cukup. Tersedia {$available} {$unit}, butuh {$required} {$unit}."
    );
}
```

## 5. Node Alur Kontrol Transaksi POS

| Node | Proses |
| --- | --- |
| N1 | Mulai request transaksi POS |
| N2 | Validasi `items` tidak kosong dan berbentuk array |
| N3 | Resolve cabang aktif user |
| N4 | Mulai transaksi database |
| N5 | Loop setiap item transaksi |
| N6 | Validasi `productId` dan `quantity` |
| N7 | Ambil data produk dari database |
| N8 | Validasi produk ada dan aktif |
| N9 | Validasi cabang produk sesuai cabang aktif |
| N10 | Hitung subtotal dan total transaksi |
| N11 | Validasi total transaksi lebih dari 0 |
| N12 | Validasi pembayaran tunai cukup |
| N13 | Panggil validasi stok bahan |
| N14 | Simpan transaksi |
| N15 | Simpan item transaksi |
| N16 | Kurangi stok bahan dan catat mutasi |
| N17 | Commit transaksi database |
| N18 | Return response success |
| N19 | Catch error, rollback, return response error |

## 6. Edge / Hubungan Antar Node

| Edge | Dari | Ke | Kondisi |
| --- | --- | --- | --- |
| E1 | N1 | N2 | Request diterima |
| E2 | N2 | N19 | `items` kosong / bukan array |
| E3 | N2 | N3 | `items` valid |
| E4 | N5 | N6 | Ada item yang diproses |
| E5 | N6 | N19 | Product ID atau qty tidak valid |
| E6 | N6 | N7 | Item valid |
| E7 | N8 | N19 | Produk tidak ada / nonaktif |
| E8 | N9 | N19 | Produk beda cabang |
| E9 | N12 | N19 | Uang tunai kurang |
| E10 | N13 | N19 | Stok bahan kurang |
| E11 | N13 | N14 | Stok cukup |
| E12 | N16 | N17 | Stok berhasil dikurangi |
| E13 | N17 | N18 | Commit berhasil |

## 7. Skenario Control Flow

| ID | Jalur | Kondisi | Expected Result |
| --- | --- | --- | --- |
| CF-01 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N14-N15-N16-N17-N18 | Semua input valid, stok cukup | Transaksi berhasil dan stok berkurang |
| CF-02 | N1-N2-N19 | Item kosong | Response error, transaksi tidak dibuat |
| CF-03 | N1-N2-N3-N4-N5-N6-N19 | Qty atau product ID tidak valid | Rollback, stok tidak berubah |
| CF-04 | N1-N2-N3-N4-N5-N6-N7-N8-N19 | Produk tidak aktif | Rollback, stok tidak berubah |
| CF-05 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N19 | Produk beda cabang | Rollback, stok tidak berubah |
| CF-06 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N19 | Uang tunai kurang | Rollback, stok tidak berubah |
| CF-07 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N19 | Stok bahan kurang | Rollback, stok tidak berubah |

## 8. Panduan Screenshot Manual

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Potongan kode percabangan `items` kosong | Bukti node N2 |
| 2 | Potongan kode loop item dan validasi produk | Bukti node N5-N9 |
| 3 | Potongan kode validasi pembayaran | Bukti node N12 |
| 4 | Potongan kode validasi stok | Bukti node N13 |
| 5 | Diagram control flow yang dibuat manual | Bukti visual alur node dan edge |

Rekomendasi nama file:

```text
screenshot-control-01-items-kosong.png
screenshot-control-02-loop-produk.png
screenshot-control-03-pembayaran.png
screenshot-control-04-validasi-stok.png
screenshot-control-05-flowgraph.png
```

## 9. Kesimpulan

Control flow testing menunjukkan bahwa transaksi POS memiliki jalur berhasil dan beberapa jalur gagal. Jalur gagal diarahkan ke exception dan rollback, sehingga stok bahan tidak berubah jika transaksi tidak valid. Jalur berhasil melewati validasi item, produk, cabang, pembayaran, stok, lalu menyimpan transaksi dan mengurangi stok bahan.
