# Grey Box Testing - Regression Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Regression Testing adalah metode pengujian untuk memastikan perubahan kode atau penambahan fitur tidak merusak fungsi yang sudah berjalan. Pada LocalesPro, fitur bahan baku terhubung dengan produk, POS, stok, mutasi, laporan transaksi, dan void transaksi. Karena saling terhubung, perubahan pada satu bagian dapat mempengaruhi bagian lain.

Grey box regression testing dilakukan dengan menjalankan ulang skenario penting sambil memperhatikan struktur internal API, database, dan helper backend.

## 2. Tujuan Pengujian

1. Memastikan fitur lama tetap berjalan setelah fitur resep dan stok otomatis ditambahkan atau diperbarui.
2. Memastikan perbaikan bug tidak menimbulkan bug baru.
3. Memastikan perubahan konfigurasi API atau database tidak merusak transaksi bahan baku.
4. Memastikan fungsi produk, POS, stok, mutasi, laporan, dan void tetap stabil.

## 3. Ruang Lingkup

Regression Testing pada dokumen ini mencakup fitur yang berpotensi terdampak oleh perubahan fitur bahan baku dan resep produk. Area yang diuji ulang meliputi login, produk, resep, POS, stok, mutasi stok, laporan transaksi, void transaksi, dan konfigurasi API.

## 4. Definisi Metode

Regression Testing adalah teknik pengujian yang memastikan perubahan pada sistem tidak menyebabkan kerusakan pada fitur yang sudah ada. Menurut materi dosen, regression testing dapat dilakukan pada kondisi penambahan fitur baru, perbaikan bug/gangguan, dan perubahan infrastruktur.

## 5. Prosedur Penerapan pada LocalesPro

1. Menentukan fitur lama yang harus tetap berjalan.
2. Menentukan perubahan yang berpotensi mempengaruhi fitur bahan baku.
3. Menjalankan ulang test case utama setelah perubahan.
4. Membandingkan hasil dengan expected result sebelumnya.
5. Memeriksa data internal untuk memastikan tidak ada efek samping.
6. Mencatat test case yang gagal sebagai regresi.

## 6. Informasi Internal Sistem

| Area Perubahan | Komponen Internal yang Dipengaruhi |
| --- | --- |
| Penambahan resep produk | `products`, `product_ingredients` |
| Pengurangan stok otomatis | `ingredients`, `stock_movements`, `payment_helpers.php` |
| Perubahan transaksi POS | `transactions`, `transaction_items`, `transactions/create.php` |
| Void transaksi | `transactions/delete.php`, `applyInventoryUsageForTransaction()` |
| Konfigurasi API frontend | `frontend/src/services/api.js`, `frontend/.env` |

## 7. Regression Suite Utama

| ID | Fitur yang Diuji Ulang | Tujuan Regression | Expected Result |
| --- | --- | --- | --- |
| RG-01 | Login admin | Memastikan admin tetap bisa mengakses manajemen produk/bahan | Login berhasil |
| RG-02 | Tambah bahan baku | Memastikan fitur bahan tetap berjalan | Bahan tersimpan |
| RG-03 | Tambah produk dengan resep | Memastikan produk dan resep tersimpan | Produk tampil dengan resep |
| RG-04 | Edit resep produk | Memastikan update resep tidak merusak data lama | Resep diperbarui |
| RG-05 | POS transaksi berhasil | Memastikan transaksi tetap berjalan setelah fitur stok otomatis | Transaksi paid dan stok berkurang |
| RG-06 | POS stok kurang | Memastikan validasi stok tetap mencegah transaksi invalid | Transaksi ditolak |
| RG-07 | Pembayaran tunai kurang | Memastikan validasi pembayaran tidak rusak | Transaksi ditolak |
| RG-08 | Mutasi stok sale | Memastikan stok keluar tercatat | Mutasi `sale` tercatat |
| RG-09 | Void transaksi | Memastikan stok kembali setelah void | Status void dan mutasi `void_restore` tercatat |
| RG-10 | Laporan transaksi | Memastikan transaksi paid/void tampil benar | Laporan sesuai status transaksi |

## 8. Skenario Regression Berdasarkan Materi Dosen

### 6.1 Penambahan Fitur Baru

Contoh perubahan: fitur resep bahan baku dan pengurangan stok otomatis ditambahkan ke POS.

| ID | Test Case | Expected Result |
| --- | --- | --- |
| RG-FN-01 | Tambah produk lama dengan format produk normal | Produk tetap bisa dibuat selama resep valid |
| RG-FN-02 | Jual produk melalui POS | POS tetap menghasilkan transaksi paid |
| RG-FN-03 | Cek stok setelah transaksi | Stok bahan berkurang sesuai resep |
| RG-FN-04 | Cek laporan transaksi | Transaksi tetap muncul di laporan |

### 6.2 Perbaikan Bug dan Gangguan

Contoh bug: stok tidak berkurang atau mutasi stok tidak tercatat setelah transaksi.

| ID | Test Case | Expected Result |
| --- | --- | --- |
| RG-BG-01 | Jalankan ulang transaksi stok cukup | Stok berkurang sesuai resep |
| RG-BG-02 | Cek tabel `stock_movements` | Mutasi `sale` tercatat |
| RG-BG-03 | Jalankan transaksi stok kurang | Transaksi ditolak dan tidak ada mutasi baru |
| RG-BG-04 | Void transaksi paid | Stok dikembalikan dan mutasi `void_restore` tercatat |

### 6.3 Perubahan Infrastruktur

Contoh perubahan: perubahan base URL API frontend atau perpindahan folder backend.

| ID | Test Case | Expected Result |
| --- | --- | --- |
| RG-INF-01 | Frontend memanggil API melalui `VITE_API_BASE_URL` | Data produk/bahan berhasil dimuat |
| RG-INF-02 | Login setelah konfigurasi API berubah | Login tetap berhasil |
| RG-INF-03 | POS transaksi setelah konfigurasi berubah | Transaksi tetap tersimpan |
| RG-INF-04 | Stok dan laporan setelah konfigurasi berubah | Data tetap sinkron dengan backend |

## 9. Dampak Perubahan dan Area yang Harus Dicek

| Jenis Perubahan | Area yang Mungkin Terdampak | Test Case Wajib Diulang |
| --- | --- | --- |
| Perubahan resep produk | Produk, POS, stok | RG-03, RG-04, RG-05, RG-06 |
| Perubahan validasi transaksi | POS, laporan, stok | RG-05, RG-06, RG-07, RG-10 |
| Perubahan helper stok | Stok, mutasi, void | RG-05, RG-08, RG-09 |
| Perubahan konfigurasi API | Login, load data, POS | RG-INF-01 sampai RG-INF-04 |
| Perubahan database | Produk, resep, transaksi, mutasi | Semua regression suite utama |

## 10. Query Verifikasi Internal

```sql
SELECT transaction_code, payment_status, total_price, amount_paid, change_amount
FROM transactions
ORDER BY id DESC
LIMIT 5;
```

```sql
SELECT name, stock_quantity, unit
FROM ingredients
WHERE name IN ('Sedotan', 'Keju', 'Sirup Gula Aren');
```

```sql
SELECT movement_type, direction, quantity, stock_before, stock_after
FROM stock_movements
ORDER BY id DESC
LIMIT 10;
```

## 11. Format Pencatatan Regression

| ID | Fitur | Expected Result | Actual Result | Status | Catatan |
| --- | --- | --- | --- | --- | --- |
| RG-05 | POS transaksi berhasil | Transaksi paid dan stok berkurang | Diisi saat pengujian | Pass / Fail | Cek API dan database |

## 12. Kriteria Keberhasilan

1. Semua fitur utama yang sudah ada tetap berjalan.
2. Transaksi POS tidak rusak setelah fitur stok otomatis digunakan.
3. Stok dan mutasi tetap konsisten.
4. Void transaksi tetap mengembalikan stok.
5. Perubahan konfigurasi API tidak memutus koneksi frontend-backend.

## 13. Indikator Regression Bug

| Indikator | Artinya |
| --- | --- |
| Test case yang sebelumnya pass menjadi fail | Ada regresi fungsi |
| Stok berubah tanpa transaksi valid | Ada regresi pada helper stok |
| Transaksi paid tanpa mutasi stok | Ada regresi pencatatan audit |
| Void tidak mengembalikan stok | Ada regresi restore stok |
| Data POS tidak muncul setelah ubah `.env` | Ada regresi konfigurasi API |

## 14. Kesimpulan

Regression Testing memastikan fitur bahan baku tidak merusak fitur lain pada LocalesPro. Dengan menjalankan ulang test suite produk, POS, stok, mutasi, laporan, dan void transaksi, sistem dapat divalidasi tetap stabil setelah perubahan kode atau konfigurasi.
