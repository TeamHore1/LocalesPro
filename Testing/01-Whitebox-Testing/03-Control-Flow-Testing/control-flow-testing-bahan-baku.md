# White Box Testing - Control Flow Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Control Flow Testing adalah model white box testing yang berfokus pada alur kontrol program. Pengujian ini memeriksa percabangan, kondisi, dan jalur eksekusi untuk memastikan program tidak salah masuk cabang, tidak melewati validasi penting, dan tidak menghasilkan proses yang tidak diinginkan.

Pada LocalesPro, control flow testing difokuskan pada alur transaksi POS yang mempengaruhi stok bahan baku.

## 2. Tujuan Dokumen

1. Menjelaskan alur kontrol kode transaksi bahan baku.
2. Memetakan node, edge, dan percabangan utama.
3. Menentukan jalur berhasil dan jalur gagal pada transaksi POS.
4. Menjadi dasar untuk Basic Path Testing dan Cyclomatic Complexity.

## 3. Ruang Lingkup

Control flow testing mencakup alur `transactions/create.php` dan pemanggilan validasi stok pada `payment_helpers.php`. Fokusnya adalah percabangan yang menentukan apakah transaksi dilanjutkan, ditolak, rollback, atau berhasil commit.

## 4. Definisi Metode

Control Flow Testing adalah pengujian white box yang memeriksa urutan eksekusi kode dan jalur logika yang mungkin dilalui program. Metode ini memastikan setiap cabang validasi dapat dijelaskan dan diuji.

## 5. Prosedur Penerapan

1. Menentukan fungsi utama yang diuji.
2. Mengidentifikasi percabangan `if`, `foreach`, dan `catch`.
3. Menyusun node dan edge alur kontrol.
4. Menentukan skenario jalur berhasil dan jalur gagal.
5. Membandingkan jalur yang diharapkan dengan perilaku kode.

## 6. Tujuan Pengujian

1. Memetakan alur kontrol transaksi POS dari input sampai stok berubah.
2. Mengidentifikasi percabangan penting pada validasi transaksi dan stok.
3. Memastikan jalur gagal berhenti sebelum stok berubah.
4. Memastikan jalur berhasil melakukan commit transaksi dan pengurangan stok.

## 7. Source Code yang Diuji

| File | Bagian Kontrol |
| --- | --- |
| `backend/api/transactions/create.php` | Validasi item, loop item, validasi produk, pembayaran, commit/rollback |
| `backend/config/payment_helpers.php` | Validasi stok berdasarkan resep, akumulasi kebutuhan bahan |
| `backend/api/transactions/delete.php` | Validasi void transaksi dan pemulihan stok |

## 8. Potongan Kode Percabangan

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

## 9. Node Alur Kontrol Transaksi POS

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

## 10. Edge / Hubungan Antar Node

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

## 11. Skenario Control Flow

| ID | Jalur | Kondisi | Expected Result |
| --- | --- | --- | --- |
| CF-01 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N14-N15-N16-N17-N18 | Semua input valid, stok cukup | Transaksi berhasil dan stok berkurang |
| CF-02 | N1-N2-N19 | Item kosong | Response error, transaksi tidak dibuat |
| CF-03 | N1-N2-N3-N4-N5-N6-N19 | Qty atau product ID tidak valid | Rollback, stok tidak berubah |
| CF-04 | N1-N2-N3-N4-N5-N6-N7-N8-N19 | Produk tidak aktif | Rollback, stok tidak berubah |
| CF-05 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N19 | Produk beda cabang | Rollback, stok tidak berubah |
| CF-06 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N19 | Uang tunai kurang | Rollback, stok tidak berubah |
| CF-07 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N19 | Stok bahan kurang | Rollback, stok tidak berubah |

## 12. Matriks Percabangan

| Percabangan | Kondisi True | Kondisi False | Dampak |
| --- | --- | --- | --- |
| `empty($data->items)` | Transaksi ditolak | Lanjut resolve cabang | Mencegah transaksi kosong |
| `$productId <= 0 || $quantity <= 0` | Throw error item invalid | Lanjut ambil produk | Mencegah item rusak diproses |
| Produk tidak ada / inactive | Throw error produk tidak tersedia | Lanjut validasi cabang | Mencegah produk tidak valid dijual |
| Produk beda cabang | Throw error cabang | Lanjut hitung total | Mencegah stok lintas cabang |
| `$totalPrice <= 0` | Throw error total invalid | Lanjut pembayaran | Mencegah transaksi bernilai nol |
| Cash dan uang kurang | Throw error uang kurang | Lanjut validasi stok | Mencegah transaksi tidak lunas |
| Stok kurang | Throw error stok kurang | Lanjut simpan transaksi | Mencegah stok negatif |

## 13. Kriteria Keberhasilan

1. Setiap cabang error berhenti sebelum stok berubah.
2. Jalur sukses melewati seluruh validasi sebelum commit.
3. Rollback terjadi ketika exception muncul di dalam transaksi database.
4. Pengurangan stok hanya terjadi setelah transaksi dan item transaksi tersimpan.

## 14. Kesimpulan

Control flow testing menunjukkan bahwa transaksi POS memiliki jalur berhasil dan beberapa jalur gagal. Jalur gagal diarahkan ke exception dan rollback, sehingga stok bahan tidak berubah jika transaksi tidak valid. Jalur berhasil melewati validasi item, produk, cabang, pembayaran, stok, lalu menyimpan transaksi dan mengurangi stok bahan.
