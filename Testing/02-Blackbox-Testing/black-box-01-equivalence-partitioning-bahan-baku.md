# Black Box Testing - Equivalence Partitioning Fitur Bahan Baku LocalesPro

## Pendahuluan

Dokumen ini berisi rancangan pengujian black box untuk fitur bahan baku pada aplikasi LocalesPro. Fokus pengujian adalah memastikan bahwa setiap produk/menu yang memiliki resep bahan baku dapat mempengaruhi stok secara otomatis ketika produk tersebut dijual melalui POS. Pengujian dilakukan dari sudut pandang pengguna, yaitu admin dan kasir, tanpa melihat struktur kode program.

Pada aplikasi LocalesPro, admin membuat bahan baku, menentukan stok awal, lalu membuat produk dengan resep bahan baku tertentu. Setelah itu, kasir menjual produk melalui halaman POS. Sistem harus menghitung kebutuhan bahan berdasarkan resep dan jumlah produk yang dibeli. Jika transaksi berhasil, stok bahan baku harus berkurang sesuai pemakaian.

## Tujuan Dokumen

1. Menjelaskan rancangan pengujian black box menggunakan metode Equivalence Partitioning.
2. Menentukan kelompok data valid dan tidak valid pada fitur bahan baku, resep produk, dan transaksi POS.
3. Menyediakan test case yang dapat digunakan untuk membuktikan pengurangan stok bahan baku otomatis.
4. Menjadi acuan pelaksanaan pengujian agar hasil testing lebih terarah dan terdokumentasi.
5. Membantu memastikan transaksi gagal tidak mengubah stok bahan baku.

## Ruang Lingkup

Ruang lingkup dokumen ini mencakup pengujian fitur bahan baku yang berhubungan langsung dengan resep produk dan transaksi POS. Modul yang termasuk dalam pengujian adalah manajemen bahan baku, manajemen menu dan resep, transaksi POS tunai, pengurangan stok otomatis, dan riwayat mutasi stok.

Dokumen ini tidak membahas pengujian tampilan secara visual, keamanan kode internal, struktur database secara mendalam, atau pengujian white box. Pengujian dibatasi pada input yang diberikan pengguna dan output yang ditampilkan atau dihasilkan sistem.

## Definisi Metode

Equivalence Partitioning adalah metode black box yang membagi input ke dalam beberapa kelompok data atau partisi. Setiap partisi mewakili kondisi tertentu, misalnya data valid dan data tidak valid. Tester cukup memilih beberapa contoh input dari setiap partisi karena data dalam partisi yang sama diasumsikan menghasilkan perilaku sistem yang serupa.

Pada fitur bahan baku LocalesPro, metode ini digunakan untuk mengelompokkan input seperti nama bahan, stok bahan, jumlah resep, qty produk, stok tersedia, dan pembayaran. Contohnya, qty produk lebih dari 0 termasuk partisi valid, sedangkan qty 0 atau negatif termasuk partisi tidak valid.

## Prosedur Penerapan

1. Menentukan fitur yang diuji, yaitu produk dengan resep bahan baku yang mengurangi stok saat transaksi POS berhasil.
2. Mengidentifikasi input utama seperti data bahan baku, data produk, resep, qty transaksi, stok tersedia, dan uang tunai.
3. Membagi setiap input ke dalam partisi valid dan tidak valid.
4. Menentukan data uji yang mewakili setiap partisi.
5. Menjalankan skenario pengujian melalui aplikasi LocalesPro.
6. Membandingkan hasil aktual dengan expected result pada tabel test case.
7. Memastikan stok bahan hanya berkurang pada transaksi yang berhasil.

## Kondisi Awal Pengujian

| Kondisi | Keterangan |
| --- | --- |
| Akun admin | Sudah tersedia dan dapat mengakses menu Bahan Baku serta Menu & Resep |
| Akun kasir | Sudah tersedia dan dapat mengakses halaman POS |
| Cabang aktif | Cabang pengujian sudah aktif dan dipilih oleh user |
| Data bahan baku | Sedotan, Keju, dan Sirup Gula Aren tersedia pada cabang aktif |
| Data produk | Produk Kopisusu digunakan sebagai produk utama pengujian |
| Metode pembayaran | Cash / Tunai |
| Halaman verifikasi | Stok dan Riwayat Mutasi Stok digunakan untuk mengecek perubahan stok |

## Format Pencatatan Hasil

Saat test case dijalankan, hasil aktual perlu dicatat agar dokumen dapat menjadi laporan eksekusi pengujian, bukan hanya rancangan. Format pencatatan yang digunakan adalah:

| Kolom | Keterangan |
| --- | --- |
| Actual Result | Hasil nyata yang muncul setelah pengujian dilakukan |
| Status | `Pass` jika sesuai expected result, `Fail` jika tidak sesuai, `Blocked` jika belum dapat diuji |
| Bukti / Catatan | Screenshot, catatan halaman, pesan error, atau nilai stok akhir |

## Catatan Kesesuaian Implementasi

Dokumen ini berisi expected behavior. Jika saat pengujian ditemukan sistem masih menerima data yang seharusnya ditolak, hasil tersebut tetap dicatat sebagai temuan. Temuan tersebut dapat dipakai sebagai bahan pembahasan pada white box testing atau rekomendasi perbaikan validasi.

## Keterkaitan dengan Aplikasi

| Aktivitas Pengujian | Bagian Aplikasi | Output yang Diverifikasi |
| --- | --- | --- |
| Menambahkan bahan baku | Halaman Bahan Baku | Data bahan muncul dengan nama, stok, satuan, dan batas minimum |
| Membuat produk dengan resep | Halaman Menu & Resep | Produk tersimpan dan daftar resep dapat dilihat |
| Menjual produk | Halaman POS | Transaksi berhasil jika input valid dan stok cukup |
| Mengecek pengurangan stok | Halaman Stok | Stok bahan berkurang sesuai resep produk |
| Mengecek audit stok | Riwayat Mutasi Stok | Mutasi stok keluar karena penjualan tercatat |
| Mengecek transaksi gagal | POS dan Stok | Transaksi ditolak dan stok tetap |

## Tabel Eksekusi Pengujian

Tabel berikut digunakan saat pengujian benar-benar dijalankan. Kolom `Actual Result`, `Status`, dan `Bukti / Catatan` diisi setelah tester melakukan pengujian pada aplikasi.

| ID | Langkah Uji | Data Uji | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| EP-01 | Login sebagai admin, buka Bahan Baku, tambah bahan valid | Keju, 1000 gr, min 100 | Bahan berhasil tersimpan | Belum diuji | Not Run | Screenshot daftar bahan |
| EP-03 | Buka Menu & Resep, tambah produk dengan resep valid | Kopisusu, harga 10000, resep Keju 100 gr | Produk dan resep berhasil tersimpan | Belum diuji | Not Run | Screenshot detail resep |
| EP-04 | Tambah produk tanpa memasukkan resep | Kopisusu tanpa resep | Sistem menolak produk | Belum diuji | Not Run | Pesan validasi resep wajib |
| EP-06 | Login sebagai kasir, jual Kopisusu qty 3 dengan stok cukup | Kopisusu qty 3, bayar 50000 | Transaksi paid, stok bahan berkurang sesuai resep | Belum diuji | Not Run | Screenshot POS, stok akhir, mutasi |
| EP-07 | Jual produk dengan qty melebihi stok bahan | Kopisusu qty 11, Sedotan 10 pcs | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Screenshot pesan stok kurang |
| EP-10 | Proses pembayaran tunai kurang dari total | Total 30000, bayar 20000 | Transaksi ditolak dan stok tidak berubah | Belum diuji | Not Run | Screenshot pesan uang kurang |

## 1. Identitas Pengujian

| Komponen | Keterangan |
| --- | --- |
| Nama Aplikasi | LocalesPro |
| Jenis Pengujian | Black Box Testing |
| Metode | Equivalence Partitioning |
| Fitur Utama | Pengurangan stok bahan baku otomatis berdasarkan resep produk saat transaksi POS berhasil |
| Aktor | Admin dan Kasir |
| Modul Terkait | Bahan Baku, Menu & Resep, POS, Stok, Laporan Transaksi, Mutasi Stok |

## 2. Deskripsi Fitur yang Diuji

LocalesPro adalah aplikasi Point of Sale untuk operasional minuman/cafe. Pada fitur bahan baku, admin dapat membuat data bahan seperti sedotan, keju, sirup, susu, atau bahan lain. Admin juga dapat membuat produk/menu dan menentukan resep bahan baku per porsi.

Ketika kasir menjual produk melalui halaman POS, sistem menghitung kebutuhan bahan baku dari resep produk dikalikan jumlah produk yang dibeli. Jika stok bahan baku mencukupi, transaksi berhasil dan stok bahan otomatis berkurang. Jika stok tidak mencukupi, transaksi ditolak dan stok tidak berubah.

## 3. Tujuan Pengujian

1. Memastikan sistem menerima input valid untuk bahan baku, resep produk, dan transaksi POS.
2. Memastikan sistem menolak input tidak valid seperti resep kosong, jumlah bahan nol, qty produk nol, dan stok tidak cukup.
3. Memastikan stok bahan baku otomatis berkurang hanya saat transaksi berhasil.
4. Memastikan transaksi gagal tidak mengubah stok bahan baku.
5. Memastikan hasil sistem sesuai dengan kelompok data valid dan tidak valid.

## 4. Alasan Pemilihan Metode

Equivalence Partitioning digunakan karena fitur bahan baku memiliki banyak input yang dapat dikelompokkan menjadi kelas valid dan tidak valid. Contohnya adalah stok bahan, jumlah bahan pada resep, qty produk di POS, dan nominal pembayaran tunai. Dengan metode ini, pengujian tidak perlu mencoba semua kemungkinan nilai, cukup mengambil wakil dari setiap kelompok data.

## 5. Data Uji Dasar

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Harga Produk | Rp 10.000 |
| Resep Produk | Sedotan 1 pcs, Keju 100 gr, Sirup Gula Aren 10 ml |
| Stok Awal Sedotan | 10 pcs |
| Stok Awal Keju | 1.000 gr |
| Stok Awal Sirup Gula Aren | 1.500 ml |
| Metode Pembayaran | Cash |

## 6. Partisi Data Uji

| Objek Input | Partisi Valid | Partisi Tidak Valid |
| --- | --- | --- |
| Nama bahan baku | Terisi, contoh `Keju` | Kosong |
| Stok bahan baku | Angka `>= 0` | Bukan angka atau nilai negatif |
| Satuan bahan | Terisi, contoh `gr`, `ml`, `pcs` | Kosong |
| Nama produk | Terisi, contoh `Kopisusu` | Kosong |
| Harga produk | Angka lebih dari `0` | Kosong, nol, negatif, atau bukan angka |
| Resep produk | Minimal 1 bahan | Resep kosong |
| Jumlah bahan resep | Lebih dari `0` | Nol, negatif, atau kosong |
| Qty produk di POS | Lebih dari `0` | Nol, negatif, atau kosong |
| Stok dibanding kebutuhan | Stok cukup | Stok kurang |
| Uang tunai | Sama atau lebih dari total tagihan | Kurang dari total tagihan |

## 7. Test Case Equivalence Partitioning

| ID | Kelas Partisi | Skenario Pengujian | Input Uji | Expected Result |
| --- | --- | --- | --- | --- |
| EP-01 | Valid | Admin menambahkan bahan baku valid | Nama `Keju`, stok `1000`, satuan `gr`, minimum `100` | Bahan baku berhasil disimpan dan tampil di daftar bahan |
| EP-02 | Tidak valid | Admin menambahkan bahan tanpa nama | Nama kosong, stok `1000`, satuan `gr` | Sistem menolak input dan bahan tidak tersimpan |
| EP-03 | Valid | Admin membuat produk dengan resep valid | Produk `Kopisusu`, harga `10000`, resep Keju `100 gr` | Produk berhasil disimpan dan resep tampil pada detail produk |
| EP-04 | Tidak valid | Admin membuat produk tanpa resep | Produk `Kopisusu`, harga `10000`, resep kosong | Sistem menolak produk karena resep wajib diisi |
| EP-05 | Tidak valid | Admin memasukkan jumlah bahan resep nol | Resep Keju `0 gr` | Sistem menolak resep karena jumlah bahan tidak valid |
| EP-06 | Valid | Kasir menjual produk dengan stok cukup | Kopisusu qty `3`, stok Keju `1000 gr` | Transaksi berhasil, stok Keju berkurang menjadi `700 gr` |
| EP-07 | Tidak valid | Kasir menjual produk saat stok kurang | Kopisusu qty `11`, stok Sedotan `10 pcs` | Transaksi ditolak, stok Sedotan tetap `10 pcs` |
| EP-08 | Tidak valid | Kasir memproses POS tanpa item | Keranjang kosong | Sistem menolak transaksi karena item transaksi kosong |
| EP-09 | Valid | Kasir membayar tunai sesuai total | Total Rp 30.000, uang diterima Rp 30.000 | Transaksi berhasil, kembalian Rp 0 |
| EP-10 | Tidak valid | Kasir membayar tunai kurang dari total | Total Rp 30.000, uang diterima Rp 20.000 | Transaksi ditolak, stok bahan tidak berkurang |
| EP-11 | Valid | Dua produk memakai bahan yang sama | Produk A dan Produk B sama-sama memakai Keju | Sistem mengakumulasi kebutuhan Keju dan mengurangi stok sesuai total pemakaian |
| EP-12 | Tidak valid | Produk nonaktif dicoba dijual | Produk status `inactive` dipilih pada POS | Produk tidak boleh diproses sebagai transaksi berhasil dan stok bahan tidak berubah |

## 8. Perhitungan Expected Result Stok

Contoh transaksi berhasil:

```text
Produk: Kopisusu
Qty: 3
Resep per porsi:
- Sedotan: 1 pcs
- Keju: 100 gr
- Sirup Gula Aren: 10 ml
```

Perhitungan pemakaian:

| Bahan | Rumus | Total Terpakai |
| --- | --- | ---: |
| Sedotan | 1 pcs x 3 | 3 pcs |
| Keju | 100 gr x 3 | 300 gr |
| Sirup Gula Aren | 10 ml x 3 | 30 ml |

Expected stok akhir:

| Bahan | Stok Awal | Terpakai | Stok Akhir |
| --- | ---: | ---: | ---: |
| Sedotan | 10 pcs | 3 pcs | 7 pcs |
| Keju | 1.000 gr | 300 gr | 700 gr |
| Sirup Gula Aren | 1.500 ml | 30 ml | 1.470 ml |

## 9. Kriteria Keberhasilan

1. Semua partisi valid menghasilkan proses berhasil.
2. Semua partisi tidak valid menghasilkan penolakan sistem.
3. Stok hanya berubah ketika transaksi POS berhasil.
4. Stok tidak berubah jika transaksi ditolak.
5. Pesan error yang muncul sesuai dengan masalah input.

## 10. Kesimpulan

Berdasarkan rancangan Equivalence Partitioning, fitur bahan baku LocalesPro dapat diuji melalui pembagian input valid dan tidak valid. Metode ini cocok karena fitur pengurangan stok otomatis sangat bergantung pada validitas produk, resep, jumlah pembelian, stok tersedia, dan pembayaran. Jika seluruh test case berjalan sesuai expected result, maka sistem mampu membedakan data yang boleh diproses dan data yang harus ditolak.
