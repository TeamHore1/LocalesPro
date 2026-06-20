# Ringkasan Pengujian Grey Box Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Dokumen ini merupakan ringkasan pengujian grey box untuk fitur bahan baku pada aplikasi LocalesPro. Grey box testing digunakan karena pengujian dilakukan dengan menggabungkan sudut pandang black box dan white box. Tester tetap menguji aplikasi dari sisi input-output, tetapi juga menggunakan pengetahuan tentang struktur internal sistem, endpoint API, tabel database, dan alur kode backend.

Fitur yang diuji adalah proses produk dengan resep bahan baku yang mempengaruhi stok ketika terjadi transaksi POS. Pada aplikasi LocalesPro, admin membuat bahan baku dan produk beserta resepnya. Kasir kemudian menjual produk melalui POS. Jika transaksi berhasil, sistem mengurangi stok bahan baku sesuai resep dan mencatat mutasi stok.

## 2. Tujuan Dokumen

1. Menjelaskan rencana pengujian grey box fitur bahan baku LocalesPro.
2. Menggunakan metode grey box sesuai materi dosen, yaitu Orthogonal Array Testing, Matrix Testing, Regression Testing, dan Pattern Testing.
3. Menghubungkan skenario input-output dengan struktur internal aplikasi seperti API, database, dan helper backend.
4. Menyediakan test case yang dapat digunakan untuk memverifikasi fitur stok bahan baku secara lebih menyeluruh.
5. Menjadi penghubung antara dokumen black box dan white box yang sudah dibuat sebelumnya.

## 3. Definisi Grey Box Testing

Grey Box Testing adalah metode pengujian perangkat lunak yang menggabungkan pendekatan black box dan white box. Tester tidak sepenuhnya melihat seluruh detail implementasi seperti white box, tetapi memiliki pengetahuan terbatas tentang struktur internal sistem. Pengetahuan tersebut digunakan untuk membuat test case yang lebih efektif.

Pada LocalesPro, grey box testing dilakukan dengan:

1. Menguji input dan output aplikasi seperti transaksi POS, stok bahan, dan status transaksi.
2. Menggunakan pengetahuan internal tentang file backend, endpoint API, tabel database, dan proses pengurangan stok.
3. Memeriksa dampak input terhadap data internal seperti `ingredients.stock_quantity`, `transactions`, `transaction_items`, dan `stock_movements`.

## 4. Posisi Grey Box terhadap Black Box dan White Box

| Jenis Pengujian | Fokus | Penerapan pada LocalesPro |
| --- | --- | --- |
| Black Box | Input dan output sistem dari sudut pandang pengguna | Menguji apakah transaksi berhasil/gagal dan stok berubah/tetap |
| White Box | Struktur kode, percabangan, variabel, dan jalur eksekusi | Menguji fungsi validasi stok, pengurangan stok, dan Cyclomatic Complexity |
| Grey Box | Input-output dengan pengetahuan sebagian struktur internal | Menguji skenario POS sambil memverifikasi API, tabel database, dan helper backend |

Dengan posisi tersebut, grey box testing menjadi lapisan pengujian yang menghubungkan hasil black box dengan bukti internal dari white box.

## 5. Ruang Lingkup

Ruang lingkup pengujian mencakup:

| Area | Keterangan |
| --- | --- |
| Produk dan Resep | Produk wajib memiliki resep bahan baku yang valid |
| POS | Kasir menjual produk dan sistem memproses transaksi tunai |
| Stok Bahan | Stok berkurang sesuai resep ketika transaksi berhasil |
| Mutasi Stok | Sistem mencatat stok keluar karena penjualan dan stok masuk karena void |
| Void Transaksi | Transaksi paid dapat di-void dan stok dikembalikan |
| Database | Verifikasi efek transaksi terhadap tabel internal |

Di luar ruang lingkup:

1. Pengujian keamanan token secara mendalam.
2. Pengujian performa server skala besar.
3. Pengujian visual UI secara detail.
4. Pengujian deployment hosting.

## 6. Kondisi Awal Pengujian

| Kondisi | Keterangan |
| --- | --- |
| Aplikasi | LocalesPro berjalan dengan frontend, backend PHP, dan database MySQL |
| User admin | Dapat mengakses Bahan Baku, Menu & Resep, Stok, dan Laporan Transaksi |
| User kasir | Dapat mengakses POS dan melakukan transaksi tunai |
| Cabang aktif | Produk, bahan, transaksi, dan stok berada pada cabang yang sama untuk skenario valid |
| Produk uji | Kopisusu |
| Resep uji | Sedotan 1 pcs, Keju 100 gr, Sirup Gula Aren 10 ml per porsi |
| Verifikasi internal | Dapat melihat database atau hasil API untuk tabel transaksi, stok, dan mutasi |

## 7. Source Code dan Struktur Internal yang Digunakan

| Komponen Internal | Lokasi | Fungsi |
| --- | --- | --- |
| API produk | `backend/api/products/create.php` dan `update.php` | Menyimpan produk dan resep bahan baku |
| API transaksi | `backend/api/transactions/create.php` | Memproses transaksi POS |
| API void | `backend/api/transactions/delete.php` | Mengubah transaksi menjadi void |
| Helper stok | `backend/config/payment_helpers.php` | Validasi stok, pengurangan stok, pengembalian stok |
| Helper mutasi | `backend/config/inventory_helpers.php` | Mencatat mutasi stok |
| Tabel bahan | `ingredients` | Menyimpan stok bahan baku |
| Tabel resep | `product_ingredients` | Menyimpan komposisi bahan per produk |
| Tabel transaksi | `transactions` dan `transaction_items` | Menyimpan transaksi POS |
| Tabel mutasi | `stock_movements` | Menyimpan riwayat perubahan stok |

## 8. Metode Grey Box yang Digunakan

| No | Metode | Fokus |
| --- | --- | --- |
| 1 | Orthogonal Array Testing | Menguji kombinasi faktor penting dengan jumlah test case yang efisien |
| 2 | Matrix Testing | Menguji hubungan antar parameter/kondisi aplikasi dalam bentuk matriks |
| 3 | Regression Testing | Memastikan perubahan fitur stok tidak merusak fungsi yang sudah ada |
| 4 | Pattern Testing | Mengeksplorasi pola bug umum berdasarkan pengalaman dan perilaku sistem |

## 9. Strategi Verifikasi Grey Box

Pengujian grey box pada fitur bahan baku menggunakan dua bentuk verifikasi:

| Jenis Verifikasi | Yang Dicek | Contoh |
| --- | --- | --- |
| Verifikasi eksternal | Tampilan dan response aplikasi | POS berhasil, pesan stok kurang, status void |
| Verifikasi internal | Data backend dan database | `stock_quantity`, `payment_status`, `stock_movements` |

Contoh strategi verifikasi transaksi berhasil:

1. Dari sisi aplikasi, transaksi POS menampilkan berhasil.
2. Dari sisi database, transaksi muncul di tabel `transactions` dengan status `Paid`.
3. Item transaksi muncul di `transaction_items`.
4. Stok bahan pada `ingredients` berkurang sesuai resep.
5. Mutasi stok keluar tercatat di `stock_movements`.

## 10. Data Uji Global

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Harga Produk | Rp 10.000 |
| Qty Transaksi Normal | 3 |
| Total Tagihan Normal | Rp 30.000 |
| Pembayaran Normal | Rp 50.000 |
| Kembalian Normal | Rp 20.000 |

Resep produk:

| Bahan | Stok Awal | Kebutuhan per Produk | Stok Setelah Qty 3 |
| --- | ---: | ---: | ---: |
| Sedotan | 10 pcs | 1 pcs | 7 pcs |
| Keju | 1.000 gr | 100 gr | 700 gr |
| Sirup Gula Aren | 1.500 ml | 10 ml | 1.470 ml |

## 11. Traceability Fitur, Input, dan Data Internal

| Fitur | Input Pengujian | Output Aplikasi | Data Internal yang Dicek |
| --- | --- | --- | --- |
| Membuat produk resep | Nama, harga, resep bahan | Produk tersimpan | `products`, `product_ingredients` |
| POS transaksi berhasil | Produk, qty, uang tunai | Transaksi paid | `transactions`, `transaction_items` |
| Validasi stok kurang | Produk dengan bahan kurang | Transaksi ditolak | `ingredients.stock_quantity` tetap |
| Mutasi stok sale | Transaksi paid | Riwayat stok keluar | `stock_movements.direction = out` |
| Void transaksi | ID transaksi paid | Status void | `transactions.payment_status = Voided` |
| Restore stok | Void transaksi | Stok kembali | `stock_movements.movement_type = void_restore` |

## 12. Kriteria Keberhasilan Umum

1. Produk dengan resep valid dapat diproses melalui POS.
2. Transaksi berhasil mengurangi stok bahan baku sesuai resep.
3. Transaksi gagal tidak mengubah stok bahan baku.
4. Mutasi stok tercatat saat stok berubah.
5. Void transaksi mengembalikan stok bahan baku.
6. Kombinasi input yang diuji menghasilkan output sesuai aturan sistem.
7. Perubahan fitur tidak merusak fitur lain seperti produk, POS, stok, laporan, dan void.

## 13. Format Pencatatan Hasil Pengujian

| ID Test Case | Expected Result | Actual Result | Status | Verifikasi Internal | Bukti |
| --- | --- | --- | --- | --- | --- |
| GB-01 | Transaksi paid dan stok berkurang | Diisi saat pengujian | Pass / Fail | Query tabel stok dan mutasi | Screenshot / catatan query |

Keterangan status:

| Status | Arti |
| --- | --- |
| Pass | Hasil aplikasi dan data internal sesuai expected result |
| Fail | Output aplikasi atau data internal tidak sesuai |
| Blocked | Test case belum dapat dijalankan karena data/environment belum siap |
| Not Run | Test case belum dijalankan |

## 14. Daftar Dokumen Grey Box

| No | Dokumen | Metode |
| --- | --- | --- |
| 1 | `grey-box-01-orthogonal-array-bahan-baku.md` | Orthogonal Array Testing |
| 2 | `grey-box-02-matrix-testing-bahan-baku.md` | Matrix Testing |
| 3 | `grey-box-03-regression-testing-bahan-baku.md` | Regression Testing |
| 4 | `grey-box-04-pattern-testing-bahan-baku.md` | Pattern Testing |
| 5 | `grey-box-panduan-screenshot-bahan-baku.md` | Panduan bukti/screenshot sementara |

## 15. Kesimpulan

Grey box testing pada fitur bahan baku LocalesPro diperlukan karena proses bisnisnya tidak hanya dapat dilihat dari tampilan aplikasi, tetapi juga perlu diverifikasi melalui struktur internal seperti API, database, dan helper backend. Dengan empat metode grey box, pengujian dapat mencakup kombinasi input, hubungan antar kondisi, dampak perubahan fitur, dan pola bug yang mungkin muncul pada proses stok bahan baku.
