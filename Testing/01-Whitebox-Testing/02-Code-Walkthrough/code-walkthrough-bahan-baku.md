# White Box Testing - Code Walkthrough Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Code Walkthrough adalah teknik white box testing dengan cara menelusuri source code untuk memahami logika program, menemukan potensi kesalahan, dan memastikan fungsi berjalan sesuai kebutuhan sistem. Pada LocalesPro, code walkthrough dilakukan pada fitur resep produk dan pengurangan stok bahan baku otomatis.

## 2. Tujuan Pengujian

1. Mengidentifikasi file dan fungsi yang mengatur fitur bahan baku.
2. Menjelaskan alur kode dari produk dibuat sampai stok berkurang.
3. Menemukan potensi risiko validasi pada kode.
4. Menyiapkan dasar untuk control flow, data flow, dan basic path testing.

## 3. File dan Fungsi yang Direview

| File | Fungsi / Bagian | Hasil Walkthrough |
| --- | --- | --- |
| `backend/api/products/create.php` | Membuat produk dan resep | Produk wajib memiliki minimal 1 bahan resep |
| `backend/api/products/update.php` | Update produk dan resep | Resep lama dapat diupdate dan bahan yang dihapus ikut dihapus |
| `backend/api/transactions/create.php` | Membuat transaksi POS | Transaksi memvalidasi item, produk, cabang, pembayaran, dan stok |
| `backend/config/payment_helpers.php` | Validasi stok dan pengurangan stok | Kebutuhan bahan dihitung dari resep dan qty transaksi |
| `backend/api/transactions/delete.php` | Void transaksi | Transaksi paid dapat diubah menjadi void dan stok dikembalikan |
| `backend/config/inventory_helpers.php` | Mutasi stok | Setiap perubahan stok dicatat dalam `stock_movements` |

## 4. Walkthrough Source Code

### 4.1 Produk wajib memiliki resep

```php
$recipe = $data->recipe ?? [];

if (!is_array($recipe) || count($recipe) === 0) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Resep produk wajib diisi minimal 1 bahan.",
    ]);
    exit;
}
```

Analisis:

| Elemen Kode | Keterangan |
| --- | --- |
| `$recipe = $data->recipe ?? []` | Mengambil resep dari request |
| `!is_array($recipe)` | Menolak resep jika format bukan array |
| `count($recipe) === 0` | Menolak produk tanpa resep |
| `exit` | Menghentikan proses agar produk tidak tersimpan |

### 4.2 Validasi item transaksi POS

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

Analisis:

| Kondisi | Dampak |
| --- | --- |
| `items` kosong | Transaksi langsung ditolak |
| `items` bukan array | Transaksi langsung ditolak |
| `items` valid | Program lanjut ke validasi produk dan stok |

### 4.3 Validasi produk aktif dan cabang sesuai

```php
if (!$product || ($product["status"] ?? "active") !== "active") {
    throw new InvalidArgumentException("Produk dengan ID {$productId} tidak tersedia.");
}

if ($productBranchId !== null && $productBranchId > 0 && $productBranchId !== $branchId) {
    throw new InvalidArgumentException("Produk tidak tersedia untuk cabang aktif.");
}
```

Analisis:

| Pemeriksaan | Tujuan |
| --- | --- |
| Produk tidak ditemukan | Mencegah transaksi produk tidak valid |
| Status bukan active | Mencegah produk nonaktif dijual |
| Cabang berbeda | Mencegah stok antar cabang tercampur |

### 4.4 Validasi pembayaran tunai

```php
if (strtolower($paymentMethod) === "cash" && $amountPaid < $totalPrice) {
    throw new InvalidArgumentException("Uang tunai yang diterima kurang dari total tagihan.");
}
```

Analisis:

Pembayaran tunai harus sama atau lebih besar dari total transaksi. Jika uang kurang, transaksi dihentikan sebelum validasi dan pengurangan stok diproses lebih lanjut.

### 4.5 Validasi stok bahan

```php
validateInventoryAvailabilityForCart($conn, $normalizedItems, $branchId);
```

Fungsi ini menjadi gerbang utama sebelum transaksi disimpan. Jika stok kurang, fungsi melempar exception sehingga proses transaksi rollback.

### 4.6 Pengurangan stok setelah transaksi tersimpan

```php
applyInventoryUsageForTransaction($conn, [
    "id" => $transactionId,
    "branch_id" => $branchId,
    "user_id" => (int) $authUser["id"],
    "transaction_code" => $transactionCode,
], "deduct");
```

Analisis:

Pengurangan stok dilakukan setelah transaksi dan item transaksi berhasil disimpan. Mode `deduct` membuat nilai `direction = -1`, sehingga stok bahan dikurangi.

## 5. Potensi Temuan dari Walkthrough

| No | Temuan | Risiko | Rekomendasi |
| --- | --- | --- | --- |
| 1 | Harga produk pada create hanya dicek `is_numeric` | Harga 0 atau negatif berpotensi lolos | Tambahkan validasi `price > 0` |
| 2 | Produk tanpa resep lama dapat menjadi risiko jika ada data warisan | Stok tidak berkurang jika produk lama tidak punya resep | Audit data produk lama |
| 3 | Pengurangan stok bergantung pada data `transaction_items` | Jika item gagal tersimpan, stok tidak boleh diproses | Sudah dilindungi transaksi database |
| 4 | Pencatatan mutasi stok silent return jika data tidak valid | Mutasi bisa tidak tercatat jika ingredient/branch/quantity invalid | Pastikan data mutasi lengkap sebelum pemanggilan |

## 6. Panduan Screenshot Manual

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode `products/create.php` bagian validasi resep | Membuktikan produk wajib punya resep |
| 2 | Kode `transactions/create.php` bagian validasi item, produk, cabang, pembayaran | Membuktikan walkthrough alur transaksi |
| 3 | Kode `payment_helpers.php` bagian validasi stok | Membuktikan stok dicek sebelum transaksi selesai |
| 4 | Kode `transactions/delete.php` bagian void | Membuktikan stok dapat dikembalikan saat transaksi void |
| 5 | Halaman GitHub folder source code | Bukti file yang direview berasal dari repository aplikasi |

Rekomendasi nama file:

```text
screenshot-walkthrough-01-validasi-resep.png
screenshot-walkthrough-02-validasi-transaksi.png
screenshot-walkthrough-03-validasi-stok.png
screenshot-walkthrough-04-void-transaksi.png
```

## 7. Kesimpulan

Code walkthrough menunjukkan bahwa fitur bahan baku dikendalikan oleh backend melalui validasi resep, validasi transaksi, validasi stok, pengurangan stok, dan pencatatan mutasi. Kode utama sudah membentuk alur transaksi yang aman karena menggunakan validasi dan rollback. Beberapa risiko validasi tetap perlu dicatat sebagai bahan perbaikan, terutama validasi harga produk dan audit produk lama tanpa resep.
