# White Box Testing - Data Flow Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Data Flow Testing adalah metode white box testing yang memeriksa aliran data dalam program, mulai dari data didefinisikan, digunakan, diubah, sampai menghasilkan output. Pada fitur bahan baku LocalesPro, data utama yang diuji adalah item transaksi, resep produk, stok bahan, dan mutasi stok.

## 2. Tujuan Pengujian

1. Melacak aliran data dari input POS sampai stok bahan berubah.
2. Memastikan variabel penting didefinisikan dan digunakan dengan benar.
3. Memastikan data resep produk digunakan untuk menghitung kebutuhan bahan.
4. Memastikan stok akhir dan mutasi stok menggunakan nilai yang sesuai.

## 3. Variabel dan Data Penting

| Variabel / Data | Lokasi | Fungsi |
| --- | --- | --- |
| `$data->items` | `transactions/create.php` | Input daftar produk dari POS |
| `$productId` | `transactions/create.php` | ID produk yang diproses |
| `$quantity` | `transactions/create.php` | Jumlah produk yang dibeli |
| `$normalizedItems` | `transactions/create.php` | Data item transaksi yang sudah valid |
| `$totalPrice` | `transactions/create.php` | Total harga transaksi |
| `$amountPaid` | `transactions/create.php` | Uang tunai diterima |
| `$recipeRows` | `payment_helpers.php` | Data resep produk dari database |
| `$usageByIngredient` | `payment_helpers.php` | Akumulasi kebutuhan bahan per ingredient |
| `$available` | `payment_helpers.php` | Stok tersedia |
| `$required` | `payment_helpers.php` | Total kebutuhan bahan |
| `$delta` | `payment_helpers.php` | Nilai perubahan stok, negatif untuk penjualan dan positif untuk restore |
| `$stockAfter` | `payment_helpers.php` | Stok akhir setelah perubahan |

## 4. Source Code Aliran Data

### 4.1 Input POS menjadi normalized items

```php
$normalizedItems[] = [
    "id" => $productId,
    "name" => (string) $product["name"],
    "qty" => $quantity,
    "subtotal" => $subtotal,
];
```

Data dari request POS tidak langsung digunakan untuk stok. Data divalidasi terlebih dahulu, lalu disimpan ke `$normalizedItems`.

### 4.2 Normalized items masuk ke validasi stok

```php
validateInventoryAvailabilityForCart($conn, $normalizedItems, $branchId);
```

Data yang masuk ke fungsi validasi stok sudah berisi produk dan qty yang valid.

### 4.3 Resep menjadi kebutuhan bahan

```php
$requiredPerItem = (float) ($recipe["quantity_needed"] ?? 0);
$usageByIngredient[$ingredientId]["required"] += $requiredPerItem * $quantity;
```

Nilai kebutuhan bahan berasal dari tabel `product_ingredients`, kemudian dikalikan dengan qty produk.

### 4.4 Kebutuhan bahan dibandingkan dengan stok tersedia

```php
$available = round((float) $usage["available"], 2);
$required = round((float) $usage["required"], 2);

if ($required > $available) {
    throw new InvalidArgumentException(...);
}
```

Jika kebutuhan lebih besar dari stok tersedia, proses transaksi dihentikan.

### 4.5 Stok berubah setelah transaksi tersimpan

```php
$delta = round($direction * $totalUsage, 2);
$stockAfter = round($stockBefore + $delta, 2);
```

Pada mode `deduct`, `$direction = -1`, sehingga stok berkurang. Pada mode `restore`, `$direction = 1`, sehingga stok bertambah kembali.

## 5. Alur Data Utama

| Tahap | Data Masuk | Proses | Data Keluar |
| --- | --- | --- | --- |
| 1 | Request POS | Baca `items` | `$data->items` |
| 2 | Item POS | Validasi product ID dan qty | `$normalizedItems` |
| 3 | Produk valid | Hitung subtotal | `$totalPrice` |
| 4 | Pembayaran | Validasi uang tunai | `$changeAmount` |
| 5 | Normalized items | Ambil resep produk | `$recipeRows` |
| 6 | Resep dan qty | Hitung total kebutuhan bahan | `$usageByIngredient` |
| 7 | Kebutuhan dan stok | Bandingkan required vs available | Valid / error stok kurang |
| 8 | Transaksi tersimpan | Ambil usage dari transaction_items | `$ingredientUsage` |
| 9 | Usage bahan | Hitung delta stok | `$stockAfter` |
| 10 | Data mutasi | Simpan `stock_movements` | Riwayat stok |

## 6. Data Flow Test Case

| ID | Definisi Data | Penggunaan Data | Expected Result |
| --- | --- | --- | --- |
| DF-01 | `$quantity = 3` | Menghitung subtotal dan kebutuhan bahan | Total harga dan kebutuhan bahan sesuai qty 3 |
| DF-02 | `$requiredPerItem = 100` untuk Keju | `100 * 3` | `$required = 300` |
| DF-03 | `$available = 1000`, `$required = 300` | Validasi stok | Stok cukup, transaksi lanjut |
| DF-04 | `$available = 200`, `$required = 300` | Validasi stok | Error stok kurang |
| DF-05 | `$direction = -1`, `$totalUsage = 300` | Hitung delta | `$delta = -300`, stok berkurang |
| DF-06 | `$direction = 1`, `$totalUsage = 300` | Void transaksi | `$delta = 300`, stok dikembalikan |

## 7. Panduan Screenshot Manual

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode pembentukan `$normalizedItems` | Bukti data POS dibersihkan sebelum diproses |
| 2 | Kode perhitungan `$usageByIngredient` | Bukti resep dikalikan qty |
| 3 | Kode validasi `$required > $available` | Bukti stok dicek sebelum transaksi berhasil |
| 4 | Kode `$delta` dan `$stockAfter` | Bukti aliran data perubahan stok |
| 5 | Screenshot halaman Stok setelah transaksi | Bukti output data flow |

Rekomendasi nama file:

```text
screenshot-dataflow-01-normalized-items.png
screenshot-dataflow-02-usage-by-ingredient.png
screenshot-dataflow-03-validasi-required-available.png
screenshot-dataflow-04-delta-stockafter.png
screenshot-dataflow-05-output-stok.png
```

## 8. Kesimpulan

Data flow testing menunjukkan bahwa data transaksi mengalir dari input POS ke validasi produk, validasi stok, penyimpanan transaksi, pengurangan stok, dan pencatatan mutasi. Variabel utama seperti `$quantity`, `$required`, `$available`, `$delta`, dan `$stockAfter` menjadi titik penting yang harus benar agar stok bahan baku tetap akurat.
