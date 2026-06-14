# White Box Testing - Basic Path Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Basic Path Testing adalah model white box testing yang mengidentifikasi jalur eksekusi independen dalam program. Metode ini menggunakan flow graph dan Cyclomatic Complexity untuk menentukan jumlah minimal jalur yang perlu diuji.

Pada LocalesPro, basic path testing difokuskan pada fungsi `validateInventoryAvailabilityForCart()` karena fungsi ini menjadi inti validasi stok bahan baku sebelum transaksi POS berhasil.

## 2. Tujuan Dokumen

1. Menjelaskan penerapan Basic Path Testing pada fungsi validasi stok bahan baku.
2. Menentukan node dan edge dari source code.
3. Menghitung Cyclomatic Complexity berdasarkan predicate node dan rumus flow graph.
4. Menentukan independent path dan test case yang mewakili jalur tersebut.

## 3. Ruang Lingkup

Basic Path Testing difokuskan pada fungsi `validateInventoryAvailabilityForCart()` di `backend/config/payment_helpers.php`. Fungsi ini dipilih karena menjadi titik keputusan utama sebelum transaksi POS dinyatakan berhasil dan stok bahan dikurangi.

## 4. Definisi Metode

Basic Path Testing adalah metode white box testing yang menguji jalur independen pada program. Jumlah jalur minimum dihitung menggunakan Cyclomatic Complexity. Dalam materi dosen, rumus yang digunakan adalah `V(G) = E - N + 2P`, dengan `E` sebagai jumlah edge, `N` sebagai jumlah node, dan `P` sebagai jumlah komponen terhubung.

## 5. Prosedur Penerapan

1. Menentukan fungsi yang akan diuji.
2. Mengubah alur kode menjadi node dan edge.
3. Mengidentifikasi predicate node.
4. Menghitung Cyclomatic Complexity.
5. Menentukan independent path.
6. Membuat test case untuk setiap path penting.

## 6. Tujuan Pengujian

1. Mengidentifikasi node dan edge pada fungsi validasi stok.
2. Menghitung Cyclomatic Complexity.
3. Menentukan jalur independen yang perlu diuji.
4. Membuat test case berdasarkan jalur independen.

## 7. Source Code yang Diuji

File:

```text
backend/config/payment_helpers.php
```

Fungsi utama:

```php
function validateInventoryAvailabilityForCart(PDO $connection, array $items, int $branchId): void
```

Potongan kode penting:

```php
if ($branchId <= 0) {
    throw new InvalidArgumentException("Cabang aktif belum valid.");
}
```

```php
foreach ($items as $item) {
    $productId = (int) ($item["id"] ?? 0);
    $quantity = (int) ($item["qty"] ?? 0);

    if ($productId <= 0 || $quantity <= 0) {
        throw new InvalidArgumentException("Ada item transaksi yang tidak valid.");
    }
}
```

```php
if (!$recipeRows) {
    continue;
}
```

```php
if ($ingredientId <= 0 || $requiredPerItem <= 0) {
    throw new InvalidArgumentException("Resep produk tidak valid.");
}
```

```php
if ($ingredientBranchId > 0 && $ingredientBranchId !== $branchId) {
    throw new InvalidArgumentException("Resep produk memakai bahan dari cabang berbeda.");
}
```

```php
if ($required > $available) {
    throw new InvalidArgumentException(...);
}
```

## 8. Node Flow Graph

| Node | Proses |
| --- | --- |
| N1 | Mulai fungsi validasi stok |
| N2 | Cek `branchId <= 0` |
| N3 | Siapkan query resep produk |
| N4 | Inisialisasi `$usageByIngredient = []` |
| N5 | Loop setiap item transaksi |
| N6 | Ambil `productId` dan `quantity` |
| N7 | Cek product ID atau qty tidak valid |
| N8 | Eksekusi query resep produk |
| N9 | Cek resep produk kosong |
| N10 | Loop setiap bahan dalam resep |
| N11 | Ambil `ingredientId` dan `requiredPerItem` |
| N12 | Cek data resep tidak valid |
| N13 | Cek bahan berasal dari cabang berbeda |
| N14 | Cek ingredient belum ada di `$usageByIngredient` |
| N15 | Akumulasi kebutuhan bahan |
| N16 | Loop setiap total kebutuhan bahan |
| N17 | Hitung `available` dan `required` |
| N18 | Cek kebutuhan lebih besar dari stok tersedia |
| N19 | Throw error stok kurang |
| N20 | Validasi selesai tanpa error |

## 9. Perhitungan Cyclomatic Complexity

Predicate node yang dihitung:

| No | Predicate Node |
| --- | --- |
| 1 | `branchId <= 0` |
| 2 | Loop item transaksi |
| 3 | `productId <= 0 || quantity <= 0` |
| 4 | `!$recipeRows` |
| 5 | Loop bahan resep |
| 6 | `ingredientId <= 0 || requiredPerItem <= 0` |
| 7 | `ingredientBranchId > 0 && ingredientBranchId !== branchId` |
| 8 | `!isset($usageByIngredient[$ingredientId])` |
| 9 | Loop total kebutuhan bahan |
| 10 | `required > available` |

Cyclomatic Complexity:

```text
V(G) = jumlah predicate node + 1
V(G) = 10 + 1
V(G) = 11
```

Perhitungan ini ekuivalen dengan rumus flow graph dari materi dosen:

```text
V(G) = E - N + 2P
```

Keterangan:

| Simbol | Arti |
| --- | --- |
| E | Jumlah edge / garis penghubung pada flow graph |
| N | Jumlah node / titik proses dan keputusan |
| P | Jumlah komponen terhubung, untuk satu fungsi bernilai 1 |

Pada dokumen ini, perhitungan praktis menggunakan jumlah predicate node + 1 karena fungsi yang diuji merupakan satu komponen terhubung dan predicate node sudah diidentifikasi dari source code.

Artinya minimal terdapat 11 jalur independen yang perlu diuji agar alur validasi stok tercakup.

## 10. Independent Path

| Path | Jalur Independen | Expected Result |
| --- | --- | --- |
| P1 | N1-N2(error) | Cabang aktif tidak valid |
| P2 | N1-N2-N3-N4-N5-N6-N7(error) | Item transaksi tidak valid |
| P3 | N1-N2-N3-N4-N5-N6-N7-N8-N9(kosong)-N16-N20 | Produk tanpa resep tidak menambah kebutuhan bahan |
| P4 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12(error) | Resep produk tidak valid |
| P5 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13(error) | Resep memakai bahan cabang berbeda |
| P6 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N14-N15-N16-N17-N18(error) | Stok bahan kurang |
| P7 | N1-N2-N3-N4-N5-N6-N7-N8-N9-N10-N11-N12-N13-N14-N15-N16-N17-N18-N20 | Stok cukup satu bahan |
| P8 | Jalur P7 dengan dua bahan berbeda | Semua bahan cukup |
| P9 | Jalur P7 dengan dua produk memakai bahan sama | Kebutuhan bahan diakumulasi |
| P10 | Jalur P7 dengan beberapa item transaksi | Semua item divalidasi |
| P11 | Jalur P7 dilanjutkan ke `applyInventoryUsageForTransaction()` mode deduct | Stok berkurang setelah transaksi berhasil |

## 11. Test Case Basic Path

| ID | Path | Input / Kondisi | Expected Result |
| --- | --- | --- | --- |
| BP-01 | P1 | `branchId = 0` | Error `Cabang aktif belum valid.` |
| BP-02 | P2 | `productId = 0` atau `qty = 0` | Error item transaksi tidak valid |
| BP-03 | P3 | Produk tidak memiliki resep | Tidak ada kebutuhan bahan yang dihitung |
| BP-04 | P4 | `ingredientId <= 0` atau `quantity_needed <= 0` | Error resep produk tidak valid |
| BP-05 | P5 | Ingredient dari cabang berbeda | Error resep memakai bahan cabang berbeda |
| BP-06 | P6 | Stok Keju 200 gr, kebutuhan 300 gr | Error stok tidak cukup |
| BP-07 | P7 | Satu bahan, stok cukup | Validasi selesai tanpa error |
| BP-08 | P8 | Tiga bahan resep, stok semua cukup | Validasi selesai tanpa error |
| BP-09 | P9 | Dua produk memakai Keju | Kebutuhan Keju diakumulasi |
| BP-10 | P10 | Beberapa item transaksi valid | Semua item divalidasi |
| BP-11 | P11 | Transaksi berhasil mode deduct | Stok berkurang dan mutasi stok tercatat |

## 12. Kriteria Keberhasilan

1. Seluruh predicate node utama memiliki test case yang mewakili.
2. Jalur error menghasilkan exception yang sesuai.
3. Jalur sukses tidak menghasilkan exception dan mengizinkan transaksi dilanjutkan.
4. Jalur stok kurang berhenti sebelum pengurangan stok terjadi.
5. Jalur stok cukup dapat dilanjutkan ke proses `applyInventoryUsageForTransaction()`.

## 13. Catatan Flow Graph

Flow graph dapat digambar manual berdasarkan node N1 sampai N20. Node keputusan utama diberi bentuk belah ketupat, sedangkan proses biasa diberi bentuk persegi. Jalur error diarahkan ke node throw exception, sedangkan jalur valid diarahkan ke node selesai tanpa error.

## 14. Panduan Screenshot Manual

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode fungsi `validateInventoryAvailabilityForCart()` | Bukti fungsi utama basic path |
| 2 | Potongan kode predicate node | Bukti percabangan yang dihitung |
| 3 | Diagram flow graph node N1-N20 | Bukti visual jalur eksekusi |
| 4 | Tabel Cyclomatic Complexity | Bukti perhitungan V(G) |
| 5 | Hasil uji jalur stok cukup / stok kurang | Bukti path berhasil dan gagal |

Rekomendasi nama file:

```text
screenshot-basicpath-01-fungsi-validasi.png
screenshot-basicpath-02-predicate-node.png
screenshot-basicpath-03-flowgraph.png
screenshot-basicpath-04-cyclomatic-complexity.png
screenshot-basicpath-05-hasil-uji-path.png
```

## 15. Kesimpulan

Basic path testing pada fungsi `validateInventoryAvailabilityForCart()` menghasilkan Cyclomatic Complexity sebesar 11. Dengan demikian, minimal terdapat 11 jalur independen yang perlu diuji. Jalur tersebut mencakup cabang aktif tidak valid, item tidak valid, resep kosong, resep tidak valid, bahan beda cabang, stok kurang, stok cukup, akumulasi bahan sama, dan pengurangan stok setelah transaksi berhasil.
