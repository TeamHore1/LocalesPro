# Laporan Induk Gray Box Testing Fitur Bahan Baku LocalesPro

## Pendahuluan

LocalesPro merupakan aplikasi point of sale yang mengelola proses operasional cafe, mulai dari data cabang, menu, bahan baku, transaksi penjualan, hingga laporan. Pada aplikasi ini, fitur bahan baku memiliki posisi yang sangat penting karena menjadi penghubung antara konfigurasi resep produk, transaksi POS, mutasi stok, dan proses void transaksi.

Pengujian pada area ini tidak cukup dilakukan hanya dari sisi keluaran antarmuka. Diperlukan pendekatan yang dapat memeriksa perilaku sistem berdasarkan pengetahuan parsial tentang struktur internal aplikasi, khususnya alur validasi transaksi, relasi produk dan resep, pengurangan stok, serta pengembalian stok. Oleh karena itu, digunakan gray box testing.

## Latar Belakang

Pada LocalesPro, transaksi penjualan yang berhasil tidak hanya menghasilkan catatan transaksi, tetapi juga berdampak langsung pada stok bahan baku. Hubungan ini terlihat pada beberapa modul yang saling terintegrasi:

1. halaman bahan baku menyimpan stok awal, satuan, dan batas minimum;
2. halaman produk menyimpan resep per porsi;
3. halaman POS membentuk keranjang transaksi dan pembayaran tunai;
4. backend transaksi memvalidasi produk, cabang, dan pembayaran;
5. helper stok memverifikasi ketersediaan bahan dan memperbarui stok;
6. helper mutasi stok mencatat riwayat perubahan stok.

Jika salah satu bagian tersebut tidak berjalan dengan benar, maka sistem dapat menimbulkan masalah seperti transaksi berhasil tetapi stok tidak berkurang, transaksi gagal tetapi stok berubah, atau void transaksi tidak mengembalikan stok. Kondisi seperti itu akan merusak akurasi operasional dan laporan.

## Tujuan Pengujian

Pengujian gray box ini bertujuan untuk:

1. memverifikasi konsistensi perilaku fitur bahan baku dari sisi UI dan backend;
2. memastikan transaksi hanya berhasil ketika seluruh syarat bisnis terpenuhi;
3. membuktikan bahwa pengurangan stok mengikuti resep dan jumlah pembelian;
4. memastikan mutasi stok tercatat secara konsisten;
5. memastikan void transaksi mengembalikan stok yang telah terpakai;
6. menyediakan dokumen pengujian yang siap dipakai sebagai arsip akademik maupun dokumentasi proyek.

## Definisi Gray Box Testing pada Kasus Ini

Gray box testing adalah metode pengujian yang berada di antara black box dan white box. Penguji tidak memeriksa seluruh detail internal program secara menyeluruh seperti white box, tetapi juga tidak mengandalkan input-output semata seperti black box. Pada pendekatan ini, penguji memanfaatkan pengetahuan terbatas mengenai alur logika, struktur modul, aturan bisnis, dan titik integrasi sistem untuk menyusun skenario uji yang lebih relevan.

Pada LocalesPro, pengetahuan parsial tersebut berasal dari pembacaan terhadap modul frontend, endpoint backend, serta helper yang menangani validasi stok dan mutasi bahan baku.

## Objek Pengujian

Objek pengujian difokuskan pada fitur bahan baku yang terhubung dengan modul berikut:

| Modul | Peran dalam Sistem | Relevansi Pengujian |
| --- | --- | --- |
| Bahan Baku | Menyimpan nama bahan, stok, satuan, minimum stok | Menjadi sumber data stok aktual |
| Produk dan Resep | Menentukan komposisi bahan per porsi | Menjadi dasar perhitungan kebutuhan bahan |
| POS | Membentuk transaksi penjualan | Menjadi titik awal perubahan stok |
| Transaksi | Menyimpan hasil penjualan | Menentukan kapan stok boleh dikurangi |
| Mutasi Stok | Menyimpan riwayat stok masuk dan stok keluar | Menjadi bukti audit perubahan stok |
| Void Transaksi | Membatalkan transaksi `Paid` | Mengembalikan stok yang telah dipotong |

## Ruang Lingkup

Ruang lingkup pengujian meliputi:

1. pembuatan bahan baku;
2. pembuatan dan perubahan resep produk;
3. transaksi POS tunai;
4. validasi stok bahan;
5. perubahan stok setelah transaksi;
6. penambahan stok masuk;
7. void transaksi dan restore stok;
8. konsistensi data berdasarkan cabang aktif.

Pengujian ini tidak membahas penetrasi keamanan, performa server skala besar, maupun pengujian antarmuka visual murni yang tidak memengaruhi logika stok.

## Dasar Analisis Sistem

Penyusunan skenario uji mengacu pada modul aplikasi berikut:

| Area | File Acuan | Fungsi dalam Analisis |
| --- | --- | --- |
| Form bahan baku | `frontend/src/pages/ingredient/IngredientList.jsx` | Menentukan input data bahan baku |
| Form produk | `frontend/src/pages/product/ProductList.jsx` | Menentukan validasi resep produk |
| POS | `frontend/src/pages/pos/POS.jsx` | Menentukan perilaku cart, qty, dan pembayaran |
| State aplikasi | `frontend/src/store/AppContext.jsx` | Menentukan payload transaksi dan sinkronisasi data |
| Tambah bahan | `backend/api/ingredients/create.php` | Menyimpan data bahan baku |
| Tambah stok | `backend/api/stock_movements/create.php` | Menambah stok masuk dan mutasi |
| Buat transaksi | `backend/api/transactions/create.php` | Menjalankan validasi transaksi |
| Void transaksi | `backend/api/transactions/delete.php` | Mengubah status transaksi dan restore stok |
| Helper pembayaran dan stok | `backend/config/payment_helpers.php` | Validasi stok, deduct, dan restore |
| Helper mutasi stok | `backend/config/inventory_helpers.php` | Audit perubahan stok |

## Data Uji Global

Untuk menjaga konsistensi antar dokumen, digunakan data uji global berikut:

| Data | Nilai |
| --- | --- |
| Produk uji | Kopisusu |
| Harga produk | Rp 10.000 |
| Metode pembayaran utama | Cash |
| Status transaksi berhasil | `Paid` |
| Status transaksi dibatalkan | `Voided` |

Resep acuan:

| Bahan | Stok Awal | Kebutuhan per Porsi | Satuan |
| --- | ---: | ---: | --- |
| Sedotan | 10 | 1 | pcs |
| Keju | 1000 | 100 | gr |
| Sirup Gula Aren | 1500 | 10 | ml |

Simulasi transaksi normal:

| Variabel | Nilai |
| --- | --- |
| Qty | 3 porsi |
| Total harga | Rp 30.000 |
| Uang diterima | Rp 50.000 |
| Kembalian | Rp 20.000 |

Expected hasil setelah transaksi normal:

| Bahan | Stok Awal | Pemakaian | Stok Akhir |
| --- | ---: | ---: | ---: |
| Sedotan | 10 | 3 | 7 |
| Keju | 1000 | 300 | 700 |
| Sirup Gula Aren | 1500 | 30 | 1470 |

## Metodologi yang Digunakan

Pengujian gray box disusun berdasarkan empat metodologi utama:

| No | Metodologi | Fungsi |
| --- | --- | --- |
| 1 | Orthogonal Array Testing | Menyederhanakan kombinasi banyak faktor uji |
| 2 | Matrix Testing | Memetakan kombinasi kondisi bisnis secara sistematis |
| 3 | Regression Testing | Menjaga kestabilan fitur setelah perubahan |
| 4 | Pattern Testing | Mengeksplorasi perilaku sistem pada skenario nyata dan tidak terduga |

## Traceability Kebutuhan dan Pengujian

| Kebutuhan Fitur | Bukti Implementasi | Metodologi yang Memeriksa |
| --- | --- | --- |
| Produk wajib memiliki resep minimal satu bahan | `products/create.php`, `products/update.php`, `ProductList.jsx` | Matrix, Regression, Pattern |
| Produk nonaktif tidak boleh dijual | `transactions/create.php` | Orthogonal Array, Matrix, Regression |
| Produk beda cabang harus ditolak | `transactions/create.php`, `AppContext.jsx` | Orthogonal Array, Matrix, Regression, Pattern |
| Stok bahan harus cukup sebelum transaksi berhasil | `validateInventoryAvailabilityForCart()` | Orthogonal Array, Matrix, Regression, Pattern |
| Transaksi berhasil mengurangi stok | `applyInventoryUsageForTransaction(..., "deduct")` | Orthogonal Array, Regression, Pattern |
| Void transaksi mengembalikan stok | `applyInventoryUsageForTransaction(..., "restore")`, `transactions/delete.php` | Regression, Pattern |
| Stok masuk tercatat sebagai mutasi | `stock_movements/create.php`, `recordStockMovement()` | Regression, Pattern |

## Kriteria Keberhasilan Umum

1. transaksi hanya berhasil jika produk valid, cabang sesuai, stok cukup, dan pembayaran memenuhi total;
2. stok bahan baku hanya berubah pada kondisi yang seharusnya;
3. mutasi stok keluar tercatat saat transaksi sukses;
4. mutasi stok masuk tercatat saat penambahan stok atau restore void;
5. void transaksi tidak boleh mengembalikan stok lebih dari satu kali;
6. data yang ditampilkan setelah refresh tetap konsisten dengan kondisi backend.

## Daftar Dokumen Lanjutan

| No | Dokumen | Keterangan |
| --- | --- | --- |
| 1 | `gray-box-01-orthogonal-array-testing-bahan-baku-lanjutan.md` | Pengujian kombinasi faktor dengan array ortogonal |
| 2 | `gray-box-02-matrix-testing-bahan-baku-lanjutan.md` | Pengujian kombinasi kondisi bisnis dalam matriks keputusan |
| 3 | `gray-box-03-regression-testing-bahan-baku-lanjutan.md` | Pengujian regresi pada alur inti bahan baku |
| 4 | `gray-box-04-pattern-testing-bahan-baku-lanjutan.md` | Pengujian eksploratif berbasis pola penggunaan |

## Kesimpulan

Fitur bahan baku pada LocalesPro merupakan area integrasi yang kritis karena menghubungkan konfigurasi menu, penjualan, stok, mutasi, dan void transaksi. Oleh sebab itu, gray box testing menjadi pendekatan yang tepat untuk memeriksa perilaku sistem secara lebih mendalam tanpa harus melakukan analisis source code secara penuh seperti white box.

Laporan induk ini menjadi dasar bagi empat dokumen metodologi lanjutan yang lebih rinci. Masing-masing dokumen berikutnya memeriksa sistem dari sudut yang berbeda, namun tetap mengacu pada tujuan yang sama, yaitu menjaga akurasi stok bahan baku dan kestabilan alur transaksi pada LocalesPro.
