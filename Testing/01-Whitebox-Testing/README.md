# White Box Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Dokumen ini merupakan pengantar untuk paket white box testing fitur bahan baku pada aplikasi LocalesPro. Pengujian difokuskan pada source code yang mengatur hubungan antara produk, resep bahan baku, transaksi POS, pengurangan stok otomatis, pencatatan mutasi stok, dan void transaksi.

White box testing dilakukan dengan melihat struktur internal kode program. Oleh karena itu, setiap dokumen metode menyertakan file kode yang diuji, potongan source code penting, analisis logika, serta panduan screenshot manual yang dapat ditambahkan sebagai bukti pengujian.

## 2. Tujuan Dokumen

1. Menjelaskan rancangan white box testing fitur bahan baku LocalesPro berdasarkan source code aplikasi.
2. Menentukan file, fungsi, variabel, percabangan, loop, dan jalur eksekusi yang diuji.
3. Menyediakan dokumen pengujian untuk setiap metode white box yang digunakan.
4. Membuktikan bahwa proses pengurangan stok bahan baku tidak hanya berjalan dari sisi tampilan, tetapi juga sesuai logika internal backend.
5. Menjadi dasar untuk eksekusi pengujian, dokumentasi bukti screenshot, dan pembahasan hasil pengujian.

## 3. Ruang Lingkup

Ruang lingkup white box testing ini dibatasi pada fitur bahan baku yang terhubung dengan produk, resep, transaksi POS, pengurangan stok, mutasi stok, dan void transaksi. Pengujian dilakukan dengan membaca kode backend karena logika utama stok berada pada API PHP dan helper inventory/payment.

Dokumen ini tidak membahas pengujian tampilan UI secara visual, performa server, keamanan token, atau deployment hosting. Fokusnya adalah struktur internal program yang memproses stok bahan baku.

## 4. Definisi White Box Testing

White box testing adalah metode pengujian perangkat lunak yang memeriksa struktur internal, logika program, alur kontrol, alur data, dan source code aplikasi. Berbeda dengan black box testing yang hanya melihat input dan output, white box testing menganalisis bagaimana sistem memproses input tersebut di dalam kode program.

Pada LocalesPro, white box testing digunakan untuk memastikan bahwa transaksi POS benar-benar memanggil fungsi validasi stok, menghitung kebutuhan bahan dari resep, mengurangi stok setelah transaksi berhasil, mencatat mutasi stok, dan mengembalikan stok saat transaksi di-void.

## 5. Fitur yang Diuji

Fitur utama yang diuji adalah proses berikut:

1. Admin membuat produk dengan resep bahan baku.
2. Kasir menjual produk melalui POS.
3. Backend membaca resep produk.
4. Backend menghitung kebutuhan bahan berdasarkan qty produk.
5. Backend memvalidasi stok bahan.
6. Jika stok cukup, transaksi disimpan dan stok bahan berkurang.
7. Mutasi stok dicatat sebagai riwayat stok keluar.
8. Jika transaksi di-void, stok bahan dikembalikan.

## 6. Source Code Utama

| File | Fungsi dalam Pengujian |
| --- | --- |
| `backend/api/products/create.php` | Membuat produk dan menyimpan resep bahan baku |
| `backend/api/products/update.php` | Mengubah produk dan memperbarui resep bahan baku |
| `backend/api/transactions/create.php` | Membuat transaksi POS dan memanggil validasi stok |
| `backend/api/transactions/delete.php` | Melakukan void transaksi dan mengembalikan stok |
| `backend/config/payment_helpers.php` | Validasi stok, perhitungan kebutuhan bahan, pengurangan dan pengembalian stok |
| `backend/config/inventory_helpers.php` | Mencatat riwayat mutasi stok |

## 7. Metode White Box yang Digunakan

Metode mengikuti struktur folder yang sudah disiapkan pada repository:

| No | Folder | Metode | Fokus |
| --- | --- | --- | --- |
| 1 | `01-Desk-Checking` | Desk Checking | Pemeriksaan manual nilai variabel dan logika perhitungan stok |
| 2 | `02-Code-Walkthrough` | Code Walkthrough | Review source code untuk memahami alur dan potensi risiko |
| 3 | `03-Control-Flow-Testing` | Control Flow Testing | Pemetaan percabangan dan jalur eksekusi transaksi |
| 4 | `04-Data-Flow-Testing` | Data Flow Testing | Pelacakan data dari input POS sampai stok berubah |
| 5 | `05-Basic-Path-Testing` | Basic Path Testing | Flow graph, Cyclomatic Complexity, dan independent path |

## 8. Data Uji Global

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Harga Produk | Rp 10.000 |
| Qty Transaksi | 3 |
| Total Harga | Rp 30.000 |
| Pembayaran Tunai | Rp 50.000 |
| Kembalian | Rp 20.000 |

Resep produk:

| Bahan | Stok Awal | Kebutuhan per Produk | Stok Setelah Qty 3 |
| --- | ---: | ---: | ---: |
| Sedotan | 10 pcs | 1 pcs | 7 pcs |
| Keju | 1.000 gr | 100 gr | 700 gr |
| Sirup Gula Aren | 1.500 ml | 10 ml | 1.470 ml |

## 9. Traceability Source Code ke Fitur

| Kebutuhan Fitur | Source Code yang Membuktikan | Metode yang Relevan |
| --- | --- | --- |
| Produk wajib memiliki resep bahan baku | `products/create.php`, `products/update.php` | Desk Checking, Code Walkthrough |
| Transaksi POS tidak boleh kosong | `transactions/create.php` | Control Flow, Basic Path |
| Produk nonaktif tidak boleh dijual | `transactions/create.php` | Code Walkthrough, Control Flow |
| Produk beda cabang tidak boleh diproses | `transactions/create.php`, `payment_helpers.php` | Control Flow, Basic Path |
| Stok bahan harus cukup sebelum transaksi berhasil | `validateInventoryAvailabilityForCart()` | Data Flow, Basic Path |
| Stok berkurang setelah transaksi paid | `applyInventoryUsageForTransaction()` | Desk Checking, Data Flow |
| Mutasi stok tercatat | `recordStockMovement()` | Code Walkthrough, Data Flow |
| Void mengembalikan stok | `transactions/delete.php`, `applyInventoryUsageForTransaction(..., "restore")` | Data Flow, Code Walkthrough |

## 10. Kriteria Keberhasilan Umum

1. Setiap dokumen metode mengacu pada source code asli aplikasi.
2. Setiap alur utama memiliki potongan kode dan analisis logika.
3. Jalur berhasil dan jalur gagal pada transaksi bahan baku dapat dijelaskan dari kode.
4. Variabel penting seperti `qty`, `required`, `available`, `delta`, dan `stockAfter` dapat ditelusuri.
5. Basic Path Testing memiliki node, predicate, Cyclomatic Complexity, dan independent path.
6. Panduan screenshot tersedia untuk membantu penambahan bukti pengujian manual.

## 11. Panduan Umum Screenshot

Screenshot tidak dimasukkan langsung ke dokumen ini agar repository tetap rapi. Screenshot dapat ditambahkan manual ke folder metode masing-masing dengan nama file yang sesuai.

Screenshot yang disarankan:

| No | Screenshot | Lokasi Disarankan |
| --- | --- | --- |
| 1 | Potongan kode validasi resep produk | `01-Desk-Checking` atau `02-Code-Walkthrough` |
| 2 | Potongan kode validasi transaksi POS | `02-Code-Walkthrough` atau `03-Control-Flow-Testing` |
| 3 | Potongan kode validasi stok bahan | `03-Control-Flow-Testing` atau `05-Basic-Path-Testing` |
| 4 | Potongan kode pengurangan stok | `04-Data-Flow-Testing` |
| 5 | Flow graph basic path | `05-Basic-Path-Testing` |
| 6 | Halaman POS transaksi berhasil | Folder metode yang membahas jalur berhasil |
| 7 | Halaman stok setelah transaksi | Folder metode yang membahas perubahan stok |
| 8 | Riwayat mutasi stok | Folder metode yang membahas mutasi stok |

## 12. Kesimpulan

Paket white box testing ini dirancang agar sesuai dengan definisi white box testing, yaitu pengujian yang melihat isi kode dan struktur internal sistem. Dengan lima metode yang digunakan, pengujian tidak hanya membahas output aplikasi, tetapi juga logika kode, percabangan, aliran data, jalur independen, dan nilai variabel yang mempengaruhi stok bahan baku.
