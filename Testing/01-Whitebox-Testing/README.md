# White Box Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Dokumen ini merupakan pengantar untuk paket white box testing fitur bahan baku pada aplikasi LocalesPro. Pengujian difokuskan pada source code yang mengatur hubungan antara produk, resep bahan baku, transaksi POS, pengurangan stok otomatis, pencatatan mutasi stok, dan void transaksi.

White box testing dilakukan dengan melihat struktur internal kode program. Oleh karena itu, setiap dokumen metode menyertakan file kode yang diuji, potongan source code penting, analisis logika, serta panduan screenshot manual yang dapat ditambahkan sebagai bukti pengujian.

## 2. Fitur yang Diuji

Fitur utama yang diuji adalah proses berikut:

1. Admin membuat produk dengan resep bahan baku.
2. Kasir menjual produk melalui POS.
3. Backend membaca resep produk.
4. Backend menghitung kebutuhan bahan berdasarkan qty produk.
5. Backend memvalidasi stok bahan.
6. Jika stok cukup, transaksi disimpan dan stok bahan berkurang.
7. Mutasi stok dicatat sebagai riwayat stok keluar.
8. Jika transaksi di-void, stok bahan dikembalikan.

## 3. Source Code Utama

| File | Fungsi dalam Pengujian |
| --- | --- |
| `backend/api/products/create.php` | Membuat produk dan menyimpan resep bahan baku |
| `backend/api/products/update.php` | Mengubah produk dan memperbarui resep bahan baku |
| `backend/api/transactions/create.php` | Membuat transaksi POS dan memanggil validasi stok |
| `backend/api/transactions/delete.php` | Melakukan void transaksi dan mengembalikan stok |
| `backend/config/payment_helpers.php` | Validasi stok, perhitungan kebutuhan bahan, pengurangan dan pengembalian stok |
| `backend/config/inventory_helpers.php` | Mencatat riwayat mutasi stok |

## 4. Metode White Box yang Digunakan

Metode mengikuti struktur folder yang sudah disiapkan pada repository:

| No | Folder | Metode | Fokus |
| --- | --- | --- | --- |
| 1 | `01-Desk-Checking` | Desk Checking | Pemeriksaan manual nilai variabel dan logika perhitungan stok |
| 2 | `02-Code-Walkthrough` | Code Walkthrough | Review source code untuk memahami alur dan potensi risiko |
| 3 | `03-Control-Flow-Testing` | Control Flow Testing | Pemetaan percabangan dan jalur eksekusi transaksi |
| 4 | `04-Data-Flow-Testing` | Data Flow Testing | Pelacakan data dari input POS sampai stok berubah |
| 5 | `05-Basic-Path-Testing` | Basic Path Testing | Flow graph, Cyclomatic Complexity, dan independent path |

## 5. Data Uji Global

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

## 6. Panduan Umum Screenshot

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

## 7. Kesimpulan

Paket white box testing ini dirancang agar sesuai dengan definisi white box testing, yaitu pengujian yang melihat isi kode dan struktur internal sistem. Dengan lima metode yang digunakan, pengujian tidak hanya membahas output aplikasi, tetapi juga logika kode, percabangan, aliran data, jalur independen, dan nilai variabel yang mempengaruhi stok bahan baku.
