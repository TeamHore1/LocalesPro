# Gray Box Testing Regression Fitur Bahan Baku LocalesPro

## Pendahuluan

Regression Testing digunakan untuk memastikan bahwa perubahan pada aplikasi tidak merusak fungsi yang sebelumnya telah berjalan dengan benar. Pada LocalesPro, fitur bahan baku merupakan area berisiko tinggi karena perubahan kecil pada modul resep, transaksi, stok, atau konfigurasi API dapat menimbulkan dampak langsung pada akurasi operasional.

Dalam pendekatan gray box, pemilihan area regresi dilakukan dengan memanfaatkan pengetahuan terbatas terhadap struktur modul yang saling terhubung, tanpa harus melakukan analisis internal secara penuh.

## Tujuan

1. memastikan fitur bahan baku tetap stabil setelah perubahan sistem;
2. menentukan test suite minimum yang wajib dijalankan ulang;
3. mengidentifikasi area yang paling rawan terkena dampak perubahan;
4. menyediakan template regresi yang siap dipakai pada setiap iterasi pengembangan.

## Area Regresi Kritis

| Area | File Terkait | Risiko |
| --- | --- | --- |
| Pembuatan dan perubahan resep | `ProductList.jsx`, `products/create.php`, `products/update.php` | Produk tersimpan dengan resep tidak valid |
| Proses transaksi | `POS.jsx`, `AppContext.jsx`, `transactions/create.php` | Transaksi gagal atau stok tidak sinkron |
| Validasi stok | `payment_helpers.php` | Sistem meloloskan stok kurang atau salah menghitung kebutuhan |
| Void transaksi | `transactions/delete.php` | Stok tidak kembali atau kembali ganda |
| Mutasi stok | `stock_movements/create.php`, `inventory_helpers.php` | Audit stok tidak tercatat |
| Konfigurasi cabang dan API | `AppContext.jsx`, `api.js` | Data yang diambil tidak sesuai cabang atau frontend gagal terhubung |

## Kategori Regresi

| Kategori | Adaptasi pada LocalesPro |
| --- | --- |
| Penambahan fitur baru | Catatan pembayaran, customer name, stok masuk, mutasi tambahan |
| Perbaikan bug | Validasi stok, pembatasan cabang, logic void |
| Perubahan infrastruktur | Base URL API, hosting, server database, environment production |

## Test Suite Regresi

| ID | Kasus Uji | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| RG-01 | Tambah bahan baku baru | Data tersimpan dan tampil di daftar bahan |  | Not Run |  |
| RG-02 | Tambah menu dengan resep valid | Produk berhasil disimpan dan resep terbaca |  | Not Run |  |
| RG-03 | Edit resep menu yang sudah ada | Resep berubah sesuai input tanpa kerusakan data |  | Not Run |  |
| RG-04 | Transaksi normal dengan stok cukup | Status `Paid`, stok berkurang, mutasi sale tercatat |  | Not Run |  |
| RG-05 | Transaksi saat stok tidak cukup | Transaksi ditolak, stok tetap |  | Not Run |  |
| RG-06 | Transaksi dengan tunai kurang | Transaksi ditolak, stok tetap |  | Not Run |  |
| RG-07 | Void transaksi `Paid` | Status `Voided`, stok kembali, mutasi restore tercatat |  | Not Run |  |
| RG-08 | Tambah stok masuk | Stok bertambah dan mutasi `stock_in` tercatat |  | Not Run |  |
| RG-09 | Refresh data setelah transaksi | Data frontend konsisten dengan backend |  | Not Run |  |
| RG-10 | Uji setelah perubahan environment / deploy | Data tetap termuat dan alur transaksi tetap normal |  | Not Run |  |

## Prioritas Eksekusi

| Prioritas | Test Case |
| --- | --- |
| Tinggi | `RG-04`, `RG-05`, `RG-06`, `RG-07` |
| Sedang | `RG-02`, `RG-03`, `RG-08`, `RG-09` |
| Pendukung | `RG-01`, `RG-10` |

## Skenario Re-run Berdasarkan Jenis Perubahan

### Setelah penambahan fitur

Jika ada penambahan fitur yang masih berkaitan dengan transaksi atau stok, minimal jalankan ulang:

1. `RG-04`
2. `RG-05`
3. `RG-07`
4. `RG-08`

### Setelah perbaikan bug

Jika bug berada pada area validasi stok, pembayaran, atau cabang, jalankan:

1. test case yang terkait langsung dengan bug;
2. satu jalur sukses normal;
3. satu jalur gagal normal;
4. satu skenario void jika transaksi ikut terdampak.

### Setelah perubahan infrastruktur

Setelah deploy atau perubahan environment, minimal verifikasi:

1. data cabang berhasil dimuat;
2. bahan dan produk sesuai cabang aktif;
3. transaksi berhasil berjalan;
4. transaksi gagal karena stok kurang tetap ditolak;
5. void transaksi tetap mengembalikan stok.

## Titik Validasi

| Komponen | Yang Diverifikasi |
| --- | --- |
| UI | Tidak ada error tak terduga saat operasi utama |
| Backend transaksi | Validasi dan commit berjalan sesuai kondisi |
| Data stok | Nilai sebelum dan sesudah perubahan konsisten |
| Mutasi stok | Audit perubahan terekam lengkap |

## Kesimpulan

Regression Testing pada fitur bahan baku LocalesPro diperlukan untuk menjaga kestabilan sistem selama pengembangan berlangsung. Dengan dokumen ini, penguji memiliki daftar uji minimum yang dapat dijalankan ulang secara konsisten setiap kali ada perubahan pada fitur yang berhubungan dengan stok, resep, transaksi, atau deployment.
