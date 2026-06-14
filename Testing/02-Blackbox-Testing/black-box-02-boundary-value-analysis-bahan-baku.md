# Black Box Testing - Boundary Value Analysis Fitur Bahan Baku LocalesPro

## Pendahuluan

Dokumen ini berisi rancangan pengujian black box untuk fitur bahan baku pada aplikasi LocalesPro menggunakan metode Boundary Value Analysis. Fitur yang diuji adalah proses pembuatan produk dengan resep bahan baku dan pengurangan stok bahan secara otomatis ketika produk berhasil dijual melalui POS.

Pada fitur ini, nilai batas sangat penting karena sistem harus membedakan kondisi yang hampir sama, misalnya stok tersedia 2 pcs untuk kebutuhan 3 pcs, stok tersedia tepat 3 pcs, dan stok tersedia 4 pcs. Kesalahan pada nilai batas dapat menyebabkan transaksi diterima padahal stok tidak cukup, atau sebaliknya transaksi ditolak padahal stok cukup.

## Tujuan Dokumen

1. Menjelaskan rancangan pengujian menggunakan metode Boundary Value Analysis.
2. Menentukan nilai batas pada fitur bahan baku, resep produk, qty POS, stok, dan pembayaran.
3. Membuktikan bahwa transaksi hanya berhasil jika nilai input berada pada batas valid.
4. Memastikan stok bahan baku tidak menjadi salah ketika input berada di sekitar batas minimum.
5. Menjadi acuan pengujian nilai kritis pada fitur pengurangan stok otomatis.

## Ruang Lingkup

Ruang lingkup dokumen ini meliputi pengujian nilai batas pada jumlah bahan dalam resep, jumlah kebutuhan bahan, qty produk di POS, stok bahan dibanding kebutuhan, pembayaran tunai, dan alasan void transaksi. Pengujian dilakukan pada alur produk yang memiliki resep bahan baku dan dijual melalui POS.

Dokumen ini tidak menguji performa sistem, keamanan kode, atau tampilan UI secara detail. Fokus pengujian adalah perilaku sistem saat menerima nilai tepat di bawah batas, tepat pada batas, dan di atas batas.

## Definisi Metode

Boundary Value Analysis adalah metode black box yang menguji nilai-nilai di sekitar batas input. Metode ini digunakan karena banyak kesalahan sistem terjadi pada nilai minimum, maksimum, atau nilai yang berada tepat di sekitar batas validasi.

Pada fitur bahan baku LocalesPro, metode ini diterapkan untuk menguji batas seperti qty produk minimum 1, resep minimal 1 bahan, stok sama dengan kebutuhan, stok kurang dari kebutuhan, dan pembayaran tunai yang harus sama atau lebih besar dari total tagihan.

## Prosedur Penerapan

1. Menentukan input yang memiliki batas validasi pada fitur bahan baku dan POS.
2. Menentukan nilai tepat di bawah batas, tepat pada batas, dan tepat di atas batas.
3. Membuat data uji berdasarkan nilai batas tersebut.
4. Menjalankan transaksi POS dan aksi terkait melalui aplikasi.
5. Mengamati apakah sistem menerima atau menolak input sesuai aturan.
6. Memverifikasi stok akhir setelah transaksi berhasil atau gagal.
7. Mencatat hasil pengujian dan membandingkannya dengan expected result.

## Kondisi Awal Pengujian

| Kondisi | Keterangan |
| --- | --- |
| Akun admin | Dapat membuat bahan baku dan produk dengan resep |
| Akun kasir | Dapat melakukan transaksi POS tunai |
| Cabang aktif | Cabang yang digunakan untuk bahan, produk, dan transaksi sama |
| Produk utama | Kopisusu dengan harga Rp 10.000 |
| Resep utama | Sedotan 1 pcs, Keju 100 gr, Sirup Gula Aren 10 ml per porsi |
| Stok awal normal | Sedotan 10 pcs, Keju 1.000 gr, Sirup Gula Aren 1.500 ml |
| Verifikasi hasil | Dilakukan melalui halaman Stok, Mutasi Stok, dan Laporan Transaksi |

## Format Pencatatan Hasil

Hasil pengujian nilai batas dicatat menggunakan kolom tambahan berikut ketika test case dijalankan:

| Kolom | Keterangan |
| --- | --- |
| Actual Result | Hasil aktual pada aplikasi setelah input nilai batas diuji |
| Status | `Pass`, `Fail`, `Blocked`, atau `Not Run` |
| Bukti / Catatan | Nilai stok sebelum dan sesudah, pesan validasi, atau screenshot hasil |

## Catatan Kesesuaian Implementasi

Boundary Value Analysis pada dokumen ini menggambarkan perilaku yang diharapkan. Jika aplikasi menerima nilai yang seharusnya berada di bawah batas valid, maka hasil tersebut dicatat sebagai Fail dan menjadi catatan perbaikan validasi.

## Keterkaitan dengan Aplikasi

| Nilai Batas | Bagian Aplikasi | Output yang Diverifikasi |
| --- | --- | --- |
| Resep 0 bahan dan 1 bahan | Halaman Menu & Resep | Produk ditolak jika tanpa resep dan diterima jika minimal 1 bahan |
| Qty 0, 1, dan 2 | Halaman POS | Qty tidak valid ditolak, qty valid dapat diproses |
| Stok kurang, sama, dan lebih dari kebutuhan | POS dan Stok | Transaksi ditolak saat stok kurang dan berhasil saat stok cukup |
| Pembayaran kurang, sama, dan lebih dari total | Modal Pembayaran POS | Pembayaran kurang ditolak, pembayaran cukup berhasil |
| Alasan void kurang dan cukup karakter | Laporan Transaksi | Void hanya diproses jika alasan memenuhi batas minimal |

## Tabel Eksekusi Pengujian

Tabel ini disiapkan untuk mencatat hasil aktual saat pengujian nilai batas dijalankan pada aplikasi.

Test case prioritas untuk waktu terbatas adalah `BVA-01`, `BVA-02`, `BVA-09`, `BVA-10`, `BVA-12`, dan `BVA-13` karena mencakup batas resep, batas stok, dan batas pembayaran tunai.

| ID | Langkah Uji | Data Uji | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| BVA-01 | Tambah produk tanpa resep | Resep 0 bahan | Produk ditolak | Belum diuji | Not Run | Pesan resep wajib |
| BVA-02 | Tambah produk dengan 1 bahan resep | Resep Keju 100 gr | Produk diterima | Belum diuji | Not Run | Screenshot detail resep |
| BVA-06 | Kirim transaksi dengan qty 0 | Kopisusu qty 0 | Transaksi ditolak | Belum diuji | Not Run | Pesan item tidak valid |
| BVA-09 | Jual produk saat stok kurang 1 dari kebutuhan | Sedotan 2 pcs, kebutuhan 3 pcs | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Stok sebelum dan sesudah |
| BVA-10 | Jual produk saat stok sama dengan kebutuhan | Sedotan 3 pcs, kebutuhan 3 pcs | Transaksi berhasil dan stok menjadi 0 | Belum diuji | Not Run | Screenshot stok akhir |
| BVA-12 | Bayar kurang 1 rupiah dari total | Total 30000, bayar 29999 | Transaksi ditolak | Belum diuji | Not Run | Pesan uang kurang |
| BVA-13 | Bayar sama dengan total | Total 30000, bayar 30000 | Transaksi berhasil, kembalian 0 | Belum diuji | Not Run | Screenshot transaksi paid |

## 1. Identitas Pengujian

| Komponen | Keterangan |
| --- | --- |
| Nama Aplikasi | LocalesPro |
| Jenis Pengujian | Black Box Testing |
| Metode | Boundary Value Analysis |
| Fitur Utama | Validasi batas input resep produk, stok bahan baku, qty POS, dan pembayaran tunai |
| Aktor | Admin dan Kasir |
| Modul Terkait | Bahan Baku, Menu & Resep, POS, Stok, Mutasi Stok |

## 2. Deskripsi Fitur yang Diuji

Fitur yang diuji adalah pengurangan stok bahan baku otomatis ketika produk dijual. Setiap produk memiliki resep bahan baku. Pada saat transaksi POS berhasil, sistem mengurangi stok berdasarkan jumlah bahan pada resep dikalikan qty produk yang dibeli.

Boundary Value Analysis digunakan untuk menguji nilai di sekitar batas minimum atau batas kritis. Pada fitur ini, batas penting berada pada jumlah resep minimal, qty transaksi minimal, stok tersedia dibanding kebutuhan bahan, dan uang tunai dibanding total tagihan.

## 3. Tujuan Pengujian

1. Memastikan sistem menangani nilai batas pada resep produk.
2. Memastikan sistem menangani nilai batas pada qty produk di POS.
3. Memastikan sistem menolak transaksi ketika stok kurang sedikit dari kebutuhan.
4. Memastikan sistem menerima transaksi ketika stok sama persis dengan kebutuhan.
5. Memastikan pembayaran tunai ditolak jika kurang dari total tagihan walaupun hanya selisih kecil.

## 4. Alasan Pemilihan Metode

Boundary Value Analysis cocok untuk fitur ini karena kegagalan sistem sering terjadi pada nilai batas, misalnya qty `0`, qty `1`, stok `9` saat kebutuhan `10`, atau pembayaran Rp 29.999 untuk total Rp 30.000. Metode ini membantu memastikan sistem tidak salah menerima atau menolak data pada area batas.

## 5. Data Uji Dasar

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Harga Produk | Rp 10.000 |
| Resep | Sedotan 1 pcs, Keju 100 gr, Sirup Gula Aren 10 ml |
| Total Pembelian Normal | 3 porsi |
| Total Tagihan Normal | Rp 30.000 |

## 6. Nilai Batas yang Diuji

| Objek | Batas Tidak Valid | Batas Valid | Di Atas Batas |
| --- | ---: | ---: | ---: |
| Jumlah bahan dalam resep | 0 bahan | 1 bahan | 2 bahan |
| Jumlah bahan resep | 0 | 0,1 atau 1 sesuai satuan | Lebih dari batas minimal |
| Qty produk POS | 0 | 1 | 2 |
| Stok vs kebutuhan | Kebutuhan - 1 | Sama dengan kebutuhan | Kebutuhan + 1 |
| Pembayaran tunai | Total - 1 | Sama dengan total | Total + 1 |
| Alasan void | 2 karakter | 3 karakter | Lebih dari 3 karakter |

## 7. Test Case Boundary Value Analysis

| ID | Objek Batas | Skenario Pengujian | Input Uji | Expected Result |
| --- | --- | --- | --- | --- |
| BVA-01 | Jumlah bahan resep | Produk dibuat tanpa bahan resep | Resep `0` bahan | Produk ditolak |
| BVA-02 | Jumlah bahan resep | Produk dibuat dengan jumlah resep minimum | Resep berisi `1` bahan | Produk berhasil disimpan |
| BVA-03 | Jumlah bahan resep | Produk dibuat dengan lebih dari satu bahan | Resep berisi `3` bahan | Produk berhasil disimpan |
| BVA-04 | Jumlah kebutuhan bahan | Jumlah bahan resep nol | Keju `0 gr` | Resep ditolak |
| BVA-05 | Jumlah kebutuhan bahan | Jumlah bahan resep minimum valid | Keju `1 gr` | Resep diterima |
| BVA-06 | Qty POS | Qty produk di bawah batas | Kopisusu qty `0` | Transaksi ditolak |
| BVA-07 | Qty POS | Qty produk pada batas minimum | Kopisusu qty `1` | Transaksi dapat diproses jika stok dan pembayaran cukup |
| BVA-08 | Qty POS | Qty produk di atas batas minimum | Kopisusu qty `2` | Transaksi dapat diproses jika stok dan pembayaran cukup |
| BVA-09 | Stok bahan | Stok kurang 1 dari kebutuhan | Sedotan tersedia `2 pcs`, kebutuhan `3 pcs` | Transaksi ditolak, stok tetap `2 pcs` |
| BVA-10 | Stok bahan | Stok sama dengan kebutuhan | Sedotan tersedia `3 pcs`, kebutuhan `3 pcs` | Transaksi berhasil, stok menjadi `0 pcs` |
| BVA-11 | Stok bahan | Stok lebih 1 dari kebutuhan | Sedotan tersedia `4 pcs`, kebutuhan `3 pcs` | Transaksi berhasil, stok menjadi `1 pcs` |
| BVA-12 | Pembayaran tunai | Uang kurang 1 rupiah | Total Rp 30.000, bayar Rp 29.999 | Transaksi ditolak, stok tidak berubah |
| BVA-13 | Pembayaran tunai | Uang sama dengan total | Total Rp 30.000, bayar Rp 30.000 | Transaksi berhasil, kembalian Rp 0 |
| BVA-14 | Pembayaran tunai | Uang lebih 1 rupiah | Total Rp 30.000, bayar Rp 30.001 | Transaksi berhasil, kembalian Rp 1 |
| BVA-15 | Void transaksi | Alasan void kurang dari batas tampilan | Alasan `ok` atau 2 karakter | Sistem frontend menolak konfirmasi void |
| BVA-16 | Void transaksi | Alasan void pada batas minimum | Alasan `btl` atau 3 karakter | Void dapat diproses, stok dikembalikan |

## 8. Contoh Perhitungan Batas Stok

Skenario: produk Kopisusu qty `3` membutuhkan Sedotan `3 pcs`.

| Kondisi | Stok Awal | Kebutuhan | Expected Result | Stok Akhir |
| --- | ---: | ---: | --- | ---: |
| Kurang dari kebutuhan | 2 pcs | 3 pcs | Transaksi ditolak | 2 pcs |
| Sama dengan kebutuhan | 3 pcs | 3 pcs | Transaksi berhasil | 0 pcs |
| Lebih dari kebutuhan | 4 pcs | 3 pcs | Transaksi berhasil | 1 pcs |

## 9. Kriteria Keberhasilan

1. Nilai tepat di bawah batas valid harus ditolak.
2. Nilai tepat pada batas valid harus diterima.
3. Nilai di atas batas valid harus diterima selama tidak melanggar aturan lain.
4. Stok akhir harus sesuai dengan rumus `stok awal - kebutuhan bahan`.
5. Transaksi gagal tidak boleh mengubah stok bahan.

## 10. Kesimpulan

Boundary Value Analysis membantu membuktikan bahwa fitur bahan baku LocalesPro mampu menangani kondisi batas secara benar. Pengujian ini penting karena proses stok otomatis sangat sensitif terhadap batas seperti stok sama dengan kebutuhan, uang tunai sama dengan total tagihan, dan qty minimum transaksi. Jika semua test case berhasil, sistem dapat dianggap stabil pada nilai-nilai kritis.
