# Grey Box Testing - Matrix Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Matrix Testing adalah metode grey box testing yang menyusun hubungan antar parameter, kondisi, dan komponen sistem dalam bentuk matriks. Teknik ini membantu tester melihat interaksi antar faktor yang dapat menyebabkan bug.

Pada LocalesPro, Matrix Testing digunakan untuk menguji hubungan antara produk, resep bahan baku, stok, transaksi POS, pembayaran, cabang, mutasi stok, dan void transaksi.

## 2. Tujuan Pengujian

1. Mengidentifikasi hubungan antar modul yang mempengaruhi stok bahan baku.
2. Menguji kombinasi kondisi yang dapat menyebabkan transaksi berhasil atau gagal.
3. Memastikan setiap perubahan stok memiliki sumber transaksi atau mutasi yang jelas.
4. Memanfaatkan pengetahuan internal sistem seperti tabel database dan endpoint API.

## 3. Ruang Lingkup

Matrix Testing pada dokumen ini mencakup interaksi antara modul produk, resep, bahan baku, POS, transaksi, mutasi stok, dan void transaksi. Pengujian tidak hanya mengecek tampilan aplikasi, tetapi juga memeriksa apakah data internal berubah sesuai hubungan antar modul.

## 4. Definisi Metode

Matrix Testing adalah teknik pengujian sistematis untuk menguji berbagai kombinasi input, parameter, dan kondisi dalam aplikasi. Metode ini membantu mengidentifikasi bug yang muncul akibat interaksi antar parameter.

Langkah Matrix Testing:

1. Mendefinisikan parameter dan kondisi.
2. Membuat tabel matriks.
3. Menjalankan test case.
4. Menganalisis hasil.

## 5. Prosedur Penerapan pada LocalesPro

1. Menentukan modul dan parameter yang saling berhubungan.
2. Membuat matriks hubungan antar tabel dan fitur.
3. Membuat matriks kondisi dan expected result.
4. Menjalankan test case berdasarkan kombinasi matriks.
5. Memeriksa hasil melalui UI dan database.
6. Menganalisis apakah ada hubungan antar modul yang menyebabkan bug.

## 6. Parameter dan Kondisi

| Parameter | Kondisi yang Diuji |
| --- | --- |
| Produk | Aktif, nonaktif, beda cabang |
| Resep | Valid, kosong, jumlah bahan tidak valid |
| Stok | Cukup, sama kebutuhan, kurang |
| Qty POS | Valid, nol, melebihi stok |
| Pembayaran | Cukup, pas total, kurang |
| Transaksi | Paid, gagal, voided |
| Mutasi Stok | Sale, void_restore, tidak tercatat |

## 7. Matrix Modul dan Data Internal

| Modul / Data | Produk | Resep | Stok | POS | Transaksi | Mutasi | Void |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `products` | Sumber data produk | Terhubung ke resep | Tidak langsung | Dipilih di POS | Masuk item transaksi | Tidak langsung | Tidak langsung |
| `product_ingredients` | Menentukan bahan produk | Sumber resep | Menghasilkan kebutuhan | Dipakai saat POS | Dipakai hitung usage | Dipakai mutasi | Dipakai restore |
| `ingredients` | Tidak langsung | Sumber stok bahan | Sumber stok | Dicek saat POS | Berubah saat paid | Dicatat | Bertambah saat void |
| `transactions` | Menyimpan transaksi | Tidak langsung | Tidak langsung | Dibuat dari POS | Status paid/void | Reference mutasi | Diupdate void |
| `transaction_items` | Menyimpan produk dibeli | Dipakai hitung usage | Tidak langsung | Dibuat dari POS | Detail transaksi | Dasar mutasi | Dasar restore |
| `stock_movements` | Tidak langsung | Tidak langsung | Riwayat stok | Tidak langsung | Reference transaksi | Sumber audit | Catat restore |

## 8. Matrix Kondisi dan Expected Result

| ID | Produk | Resep | Stok | Qty | Pembayaran | Expected Result |
| --- | --- | --- | --- | --- | --- | --- |
| MT-01 | Aktif | Valid | Cukup | Valid | Cukup | Transaksi paid, stok berkurang, mutasi sale tercatat |
| MT-02 | Aktif | Valid | Kurang | Valid | Cukup | Transaksi ditolak, stok tetap |
| MT-03 | Aktif | Valid | Cukup | Valid | Kurang | Transaksi ditolak, stok tetap |
| MT-04 | Aktif | Valid | Cukup | Nol | Cukup | Transaksi ditolak, stok tetap |
| MT-05 | Nonaktif | Valid | Cukup | Valid | Cukup | Transaksi ditolak |
| MT-06 | Beda cabang | Valid | Cukup | Valid | Cukup | Transaksi ditolak, data cabang lain tidak berubah |
| MT-07 | Aktif | Kosong | Cukup | Valid | Cukup | Produk tidak boleh valid untuk proses penjualan berbasis stok |
| MT-08 | Aktif | Jumlah bahan invalid | Cukup | Valid | Cukup | Resep ditolak / transaksi ditolak |
| MT-09 | Aktif | Valid | Sama kebutuhan | Valid | Cukup | Transaksi berhasil, stok bahan menjadi 0 |
| MT-10 | Aktif | Valid | Cukup | Valid | Cukup lalu void | Stok berkurang lalu kembali setelah void |

## 9. Matrix Risiko

| Risiko | Kombinasi Penyebab | Dampak | Verifikasi Grey Box |
| --- | --- | --- | --- |
| Stok negatif | Qty melebihi stok dan validasi gagal | Data stok rusak | Cek `ingredients.stock_quantity` tetap |
| Mutasi tidak tercatat | Stok berubah tetapi `stock_movements` kosong | Audit stok hilang | Cek row mutasi setelah transaksi |
| Cabang tercampur | Produk/bahan beda cabang | Stok cabang lain berubah | Cek branch_id pada produk, bahan, mutasi |
| Void ganda | Transaksi sudah void diproses ulang | Stok kembali dua kali | Cek status transaksi dan mutasi void_restore |
| Resep invalid | Ingredient ID atau amount tidak valid | Perhitungan bahan salah | Cek produk ditolak atau rollback |

## 10. Matrix Traceability Fitur ke Tabel

| Fitur | Tabel Utama | Tabel Pendukung | Risiko Jika Gagal |
| --- | --- | --- | --- |
| Produk dan resep | `products` | `product_ingredients` | Produk tidak punya komposisi bahan |
| Transaksi POS | `transactions` | `transaction_items` | Transaksi tidak tercatat lengkap |
| Validasi stok | `ingredients` | `product_ingredients` | Stok kurang bisa tetap diproses |
| Mutasi penjualan | `stock_movements` | `transactions` | Audit stok tidak lengkap |
| Void transaksi | `transactions` | `stock_movements`, `ingredients` | Stok tidak kembali atau kembali ganda |

## 11. Query Verifikasi Internal

```sql
SELECT id, name, stock_quantity, unit, branch_id
FROM ingredients
WHERE name IN ('Sedotan', 'Keju', 'Sirup Gula Aren');
```

```sql
SELECT id, transaction_code, total_price, payment_status, branch_id
FROM transactions
ORDER BY id DESC
LIMIT 5;
```

```sql
SELECT ingredient_id, movement_type, direction, quantity, stock_before, stock_after, reference_type, reference_id
FROM stock_movements
ORDER BY id DESC
LIMIT 10;
```

## 12. Format Pencatatan Hasil

| ID | Expected Result | Actual Result | Status | Catatan Database |
| --- | --- | --- | --- | --- |
| MT-01 | Transaksi paid, stok berkurang, mutasi tercatat | Diisi saat pengujian | Pass / Fail | Cek tabel transaksi, bahan, mutasi |

## 13. Kriteria Keberhasilan

1. Setiap kombinasi pada matriks menghasilkan output sesuai expected result.
2. Tabel internal yang terkait ikut berubah sesuai aturan bisnis.
3. Kondisi gagal tidak menghasilkan perubahan stok atau mutasi baru.
4. Kondisi void menghasilkan status void dan mutasi restore.
5. Tidak ada perubahan data cabang lain pada skenario cabang berbeda.

## 14. Kesimpulan

Matrix Testing menunjukkan hubungan antar modul dan data internal pada fitur bahan baku LocalesPro. Dengan matriks ini, tester dapat memastikan bahwa setiap kondisi transaksi memiliki dampak yang benar terhadap stok, transaksi, dan mutasi stok. Metode ini cocok untuk grey box karena menggabungkan pengujian input-output dengan pengetahuan tentang database dan endpoint backend.
