# Grey Box Testing - Orthogonal Array Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Orthogonal Array Testing adalah teknik grey box testing yang menggunakan kombinasi faktor dan level untuk membuat test case secara efisien. Metode ini cocok ketika sistem memiliki banyak kombinasi input, tetapi waktu pengujian terbatas. Dengan orthogonal array, kombinasi penting tetap terwakili tanpa harus menguji semua kemungkinan.

Pada fitur bahan baku LocalesPro, kombinasi yang penting meliputi status produk, validitas resep, kondisi stok, qty transaksi, pembayaran, dan cabang. Tester menguji aplikasi dari sisi POS dan admin, tetapi juga menggunakan informasi internal tentang API transaksi, tabel resep, dan tabel stok.

## 2. Tujuan Pengujian

1. Mengurangi jumlah test case tanpa kehilangan cakupan kombinasi penting.
2. Menguji kombinasi faktor yang mempengaruhi keberhasilan transaksi POS.
3. Memastikan stok bahan berkurang hanya pada kombinasi valid.
4. Menggunakan informasi internal sistem untuk menentukan faktor dan level.

## 3. Ruang Lingkup

Orthogonal Array Testing pada dokumen ini mencakup kombinasi faktor yang mempengaruhi transaksi bahan baku, yaitu status produk, validitas resep, kondisi stok, qty transaksi, pembayaran, dan cabang. Pengujian dilakukan dari sisi aplikasi POS dan diverifikasi dengan informasi internal database serta helper backend.

Di luar ruang lingkup dokumen ini adalah pengujian performa jangka panjang, keamanan login, dan tampilan UI secara detail.

## 4. Definisi Metode

Orthogonal Array Testing adalah pengujian statistik yang menyusun kombinasi faktor dan level dalam bentuk array. Metode ini membantu memaksimalkan cakupan kombinasi input dengan jumlah test case yang lebih sedikit dibanding exhaustive testing.

Langkah umum:

1. Mengidentifikasi variabel independen atau faktor.
2. Menentukan level dari setiap faktor.
3. Memilih array yang sesuai.
4. Memetakan faktor ke array.
5. Membuat test case berdasarkan kombinasi array.
6. Menambahkan kombinasi mencurigakan jika tidak terwakili.

## 5. Prosedur Penerapan pada LocalesPro

1. Menentukan faktor yang mempengaruhi keberhasilan transaksi POS.
2. Menentukan level untuk setiap faktor berdasarkan kondisi aplikasi dan struktur internal.
3. Menyusun kombinasi Orthogonal Array L9.
4. Menjalankan setiap kombinasi sebagai test case.
5. Memverifikasi output aplikasi, stok bahan, status transaksi, dan mutasi stok.
6. Menambahkan kombinasi tambahan untuk kondisi berisiko tinggi seperti void dan bahan yang sama dipakai beberapa produk.

## 6. Informasi Internal Sistem yang Digunakan

| Informasi Internal | Keterangan |
| --- | --- |
| `products.status` | Menentukan apakah produk dapat dijual |
| `product_ingredients` | Menentukan resep bahan baku produk |
| `ingredients.stock_quantity` | Menentukan stok bahan tersedia |
| `transactions.payment_status` | Menentukan status transaksi |
| `stock_movements` | Menentukan apakah mutasi stok tercatat |
| `backend/api/transactions/create.php` | Endpoint yang memproses transaksi POS |
| `validateInventoryAvailabilityForCart()` | Fungsi validasi stok sebelum transaksi commit |

## 7. Faktor dan Level

| Faktor | Level 1 | Level 2 | Level 3 |
| --- | --- | --- | --- |
| F1 - Status Produk | Aktif | Nonaktif | Produk beda cabang |
| F2 - Resep Produk | Valid | Kosong | Jumlah bahan tidak valid |
| F3 - Kondisi Stok | Cukup | Sama dengan kebutuhan | Kurang |
| F4 - Qty Transaksi | 1 | 3 | 0 / tidak valid |
| F5 - Pembayaran | Pas total | Lebih dari total | Kurang dari total |

Karena terdapat 5 faktor dengan 3 level, exhaustive testing akan menghasilkan:

```text
3^5 = 243 kombinasi
```

Dengan Orthogonal Array, kombinasi dapat direpresentasikan menggunakan 9 test case utama sehingga pengujian lebih efisien.

## 8. Alasan Pemilihan Array L9

Fitur transaksi bahan baku memiliki banyak kombinasi. Jika seluruh kombinasi diuji secara exhaustive, jumlah test case menjadi besar. Dengan 5 faktor dan 3 level, total kombinasi penuh adalah 243 test case. Orthogonal Array L9 dipilih agar kombinasi utama tetap terwakili dengan 9 test case inti.

Array L9 tidak menggantikan seluruh pengujian, tetapi menjadi strategi efisien untuk memilih kombinasi yang representatif. Kombinasi tambahan tetap dimasukkan jika ada skenario yang dianggap berisiko tinggi.

## 9. Orthogonal Array L9

| TC | F1 Status Produk | F2 Resep Produk | F3 Kondisi Stok | F4 Qty | F5 Pembayaran |
| --- | --- | --- | --- | --- | --- |
| OAT-01 | Aktif | Valid | Cukup | 1 | Pas total |
| OAT-02 | Aktif | Kosong | Sama kebutuhan | 3 | Lebih dari total |
| OAT-03 | Aktif | Jumlah bahan tidak valid | Kurang | 0 | Kurang |
| OAT-04 | Nonaktif | Valid | Sama kebutuhan | 0 | Kurang |
| OAT-05 | Nonaktif | Kosong | Kurang | 1 | Pas total |
| OAT-06 | Nonaktif | Jumlah bahan tidak valid | Cukup | 3 | Lebih dari total |
| OAT-07 | Produk beda cabang | Valid | Kurang | 3 | Pas total |
| OAT-08 | Produk beda cabang | Kosong | Cukup | 0 | Lebih dari total |
| OAT-09 | Produk beda cabang | Jumlah bahan tidak valid | Sama kebutuhan | 1 | Kurang |

## 10. Test Case Orthogonal Array

| ID | Skenario | Expected Result | Verifikasi Internal |
| --- | --- | --- | --- |
| OAT-01 | Produk aktif, resep valid, stok cukup, qty 1, bayar pas | Transaksi berhasil, stok berkurang sesuai 1 porsi | Cek `transactions`, `ingredients`, `stock_movements` |
| OAT-02 | Produk aktif tetapi resep kosong | Produk tidak boleh menjadi transaksi valid | Cek produk ditolak saat create/update atau stok tidak berubah |
| OAT-03 | Resep tidak valid, qty 0, pembayaran kurang | Transaksi ditolak | Cek tidak ada transaksi paid dan stok tetap |
| OAT-04 | Produk nonaktif, stok sama kebutuhan, qty 0 | Transaksi ditolak | Cek response produk tidak tersedia / item invalid |
| OAT-05 | Produk nonaktif dan stok kurang | Transaksi ditolak | Cek stok tidak berubah |
| OAT-06 | Produk nonaktif walaupun stok cukup dan bayar lebih | Transaksi ditolak | Cek tidak ada mutasi sale |
| OAT-07 | Produk beda cabang dengan stok kurang | Transaksi ditolak karena cabang/stok | Cek tidak ada data lintas cabang berubah |
| OAT-08 | Produk beda cabang, resep kosong, qty 0 | Transaksi ditolak | Cek tidak ada transaksi dan stok tetap |
| OAT-09 | Produk beda cabang, resep tidak valid, pembayaran kurang | Transaksi ditolak | Cek error dan rollback |

## 11. Kombinasi Tambahan yang Mencurigakan

| ID | Kombinasi Tambahan | Alasan Ditambahkan | Expected Result |
| --- | --- | --- | --- |
| OAT-X01 | Dua produk berbeda memakai bahan yang sama | Menguji akumulasi kebutuhan bahan | Stok bahan berkurang sesuai total gabungan |
| OAT-X02 | Transaksi berhasil lalu langsung void | Menguji pengembalian stok | Stok kembali sesuai pemakaian |
| OAT-X03 | Stok sama persis dengan kebutuhan untuk semua bahan | Menguji batas kritis stok | Transaksi berhasil dan stok menjadi 0 untuk bahan terkait |

## 12. Traceability Test Case ke Data Internal

| Test Case | Output Aplikasi | Verifikasi Internal |
| --- | --- | --- |
| OAT-01 | Transaksi berhasil | `transactions.payment_status = Paid`, stok berkurang, mutasi `sale` |
| OAT-02 | Produk/resep ditolak | Tidak ada resep kosong tersimpan sebagai produk valid |
| OAT-03 | Transaksi ditolak | Tidak ada transaksi paid, stok tetap |
| OAT-06 | Produk nonaktif ditolak | Tidak ada row mutasi baru |
| OAT-07 | Cabang tidak sesuai ditolak | Tidak ada perubahan stok cabang lain |
| OAT-X02 | Void berhasil | `payment_status = Voided`, mutasi `void_restore` tercatat |

## 13. Format Pencatatan Hasil

| ID | Expected Result | Actual Result | Status | Catatan Internal |
| --- | --- | --- | --- | --- |
| OAT-01 | Transaksi berhasil dan stok berkurang | Diisi saat pengujian | Pass / Fail | Cek tabel transaksi dan stok |

## 14. Kriteria Keberhasilan

1. Kombinasi valid menghasilkan transaksi paid dan stok berkurang.
2. Kombinasi tidak valid menghasilkan transaksi ditolak dan stok tetap.
3. Kombinasi cabang berbeda tidak mengubah data cabang lain.
4. Kombinasi void mengembalikan stok sesuai pemakaian transaksi.
5. Mutasi stok tercatat untuk setiap perubahan stok yang valid.

## 15. Kesimpulan

Orthogonal Array Testing membantu menguji kombinasi penting fitur bahan baku dengan jumlah test case yang lebih efisien. Dari 243 kombinasi kemungkinan, dipilih 9 kombinasi utama dan 3 kombinasi tambahan yang dianggap berisiko. Metode ini cocok untuk LocalesPro karena transaksi POS dipengaruhi oleh banyak faktor internal dan eksternal.
