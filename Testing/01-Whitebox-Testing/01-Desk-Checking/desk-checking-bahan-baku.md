# White Box Testing - Desk Checking Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Desk Checking adalah metode white box testing yang dilakukan dengan menelusuri kode program secara manual untuk memeriksa logika, nilai variabel, dan perubahan data pada setiap langkah eksekusi. Pengujian ini cocok digunakan pada fitur bahan baku LocalesPro karena proses transaksi POS memiliki perhitungan stok yang harus tepat.

Fokus desk checking pada dokumen ini adalah alur produk yang memiliki resep bahan baku. Ketika produk dijual melalui POS, sistem membaca resep produk, menghitung total kebutuhan bahan, memvalidasi stok, menyimpan transaksi, mengurangi stok bahan, dan mencatat mutasi stok.

## 2. Tujuan Pengujian

1. Memeriksa nilai variabel utama pada proses transaksi bahan baku.
2. Memastikan perhitungan kebutuhan bahan sesuai rumus `quantity_needed * qty produk`.
3. Memastikan stok tidak berkurang jika validasi transaksi gagal.
4. Memastikan stok berkurang jika transaksi berhasil.
5. Memastikan alur manual sesuai dengan logika kode program.

## 3. Source Code yang Diperiksa

| File | Fungsi / Bagian Kode | Peran |
| --- | --- | --- |
| `backend/api/transactions/create.php` | Validasi item, produk, cabang, pembayaran, simpan transaksi | Entry point transaksi POS |
| `backend/config/payment_helpers.php` | `validateInventoryAvailabilityForCart()` | Validasi ketersediaan stok bahan |
| `backend/config/payment_helpers.php` | `applyInventoryUsageForTransaction()` | Mengurangi atau mengembalikan stok bahan |
| `backend/config/inventory_helpers.php` | `recordStockMovement()` | Mencatat riwayat mutasi stok |

## 4. Potongan Kode Utama

### 4.1 Validasi item transaksi

```php
foreach ($data->items as $item) {
    $productId = (int) ($item->id ?? 0);
    $quantity = (int) ($item->qty ?? 0);

    if ($productId <= 0 || $quantity <= 0) {
        throw new InvalidArgumentException("Ada item transaksi yang tidak valid.");
    }
}
```

### 4.2 Perhitungan kebutuhan bahan

```php
$usageByIngredient[$ingredientId]["required"] += $requiredPerItem * $quantity;
```

### 4.3 Validasi stok cukup

```php
if ($required > $available) {
    throw new InvalidArgumentException(
        "Stok {$ingredientName} tidak cukup. Tersedia {$available} {$unit}, butuh {$required} {$unit}."
    );
}
```

### 4.4 Pengurangan stok bahan

```php
$direction = $mode === "restore" ? 1 : -1;
$delta = round($direction * $totalUsage, 2);
$stockAfter = round($stockBefore + $delta, 2);
```

## 5. Data Uji Desk Checking

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Qty transaksi | 3 |
| Harga produk | Rp 10.000 |
| Total transaksi | Rp 30.000 |
| Pembayaran tunai | Rp 50.000 |
| Kembalian | Rp 20.000 |

Resep produk:

| Bahan | Stok Awal | Kebutuhan per Produk |
| --- | ---: | ---: |
| Sedotan | 10 pcs | 1 pcs |
| Keju | 1.000 gr | 100 gr |
| Sirup Gula Aren | 1.500 ml | 10 ml |

## 6. Tabel Desk Checking

| Langkah | Kode / Proses | Nilai Variabel | Expected Result |
| --- | --- | --- | --- |
| 1 | Input `items` diterima | `items = [{id: Kopisusu, qty: 3}]` | Item tidak kosong |
| 2 | Validasi item | `productId > 0`, `quantity = 3` | Item valid |
| 3 | Ambil produk | `status = active`, `branch_id = cabang aktif` | Produk boleh dijual |
| 4 | Hitung subtotal | `10000 * 3 = 30000` | `totalPrice = 30000` |
| 5 | Validasi pembayaran | `amountPaid = 50000`, `totalPrice = 30000` | Pembayaran cukup |
| 6 | Validasi resep Sedotan | `1 * 3 = 3`, tersedia 10 | Stok cukup |
| 7 | Validasi resep Keju | `100 * 3 = 300`, tersedia 1000 | Stok cukup |
| 8 | Validasi resep Sirup | `10 * 3 = 30`, tersedia 1500 | Stok cukup |
| 9 | Simpan transaksi | `payment_status = Paid` | Transaksi tercatat |
| 10 | Kurangi stok Sedotan | `10 - 3 = 7` | Stok akhir 7 pcs |
| 11 | Kurangi stok Keju | `1000 - 300 = 700` | Stok akhir 700 gr |
| 12 | Kurangi stok Sirup | `1500 - 30 = 1470` | Stok akhir 1470 ml |
| 13 | Catat mutasi stok | `movement_type = sale`, `direction = out` | Riwayat stok keluar tercatat |

## 7. Skenario Gagal yang Dicek Manual

| Skenario | Nilai Variabel | Expected Result |
| --- | --- | --- |
| Item kosong | `items = []` | Response error, transaksi tidak dibuat |
| Qty tidak valid | `qty = 0` | Throw `Ada item transaksi yang tidak valid.` |
| Stok kurang | Sedotan tersedia 2, kebutuhan 3 | Throw error stok tidak cukup |
| Pembayaran kurang | `amountPaid = 20000`, `totalPrice = 30000` | Throw error uang tunai kurang |
| Produk beda cabang | `product.branch_id != branchId` | Throw error produk tidak tersedia untuk cabang aktif |

## 8. Panduan Screenshot Manual

Tambahkan screenshot berikut secara manual ke folder GitHub jika dibutuhkan:

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Potongan kode `transactions/create.php` bagian validasi item dan pembayaran | Membuktikan desk checking memakai source code |
| 2 | Potongan kode `validateInventoryAvailabilityForCart()` | Membuktikan perhitungan kebutuhan bahan dibaca dari kode |
| 3 | Potongan kode `applyInventoryUsageForTransaction()` | Membuktikan stok berkurang melalui `delta` |
| 4 | Halaman POS saat transaksi Kopisusu qty 3 berhasil | Bukti input transaksi |
| 5 | Halaman Stok setelah transaksi | Bukti hasil pengurangan stok |

Rekomendasi penamaan file screenshot:

```text
screenshot-desk-01-validasi-item.png
screenshot-desk-02-validasi-stok.png
screenshot-desk-03-pengurangan-stok.png
screenshot-desk-04-pos-berhasil.png
screenshot-desk-05-stok-akhir.png
```

## 9. Kesimpulan

Berdasarkan desk checking, alur kode transaksi bahan baku sudah menunjukkan hubungan yang jelas antara input transaksi, resep produk, validasi stok, dan pengurangan stok. Pada skenario valid, stok berkurang sesuai resep. Pada skenario gagal seperti item kosong, qty tidak valid, stok kurang, atau pembayaran kurang, transaksi dihentikan sebelum stok berubah.
