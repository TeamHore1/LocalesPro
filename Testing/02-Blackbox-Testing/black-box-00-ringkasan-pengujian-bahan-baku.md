# Ringkasan Pengujian Black Box Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Dokumen ini merupakan ringkasan induk dari pengujian black box fitur bahan baku pada aplikasi LocalesPro. Pengujian difokuskan pada proses bisnis utama, yaitu produk/menu memiliki resep bahan baku, kemudian saat produk dijual melalui POS, stok bahan baku otomatis berkurang sesuai resep dan jumlah pembelian.

Fitur ini dipilih karena berhubungan langsung dengan akurasi stok, transaksi penjualan, dan kontrol operasional cafe. Jika fitur ini tidak berjalan dengan benar, sistem dapat mencatat transaksi yang berhasil tetapi stok tidak berkurang, atau sebaliknya stok berkurang walaupun transaksi gagal. Oleh karena itu, pengujian perlu dilakukan secara sistematis menggunakan beberapa metode black box.

## 2. Tujuan Dokumen

1. Menjelaskan gambaran umum pengujian black box fitur bahan baku LocalesPro.
2. Menjelaskan metode pengujian yang dipilih dan alasan pemilihannya.
3. Menentukan kondisi awal, data uji, dan kriteria keberhasilan pengujian.
4. Menjadi penghubung antara dokumen black box per metode dan pengujian white box berikutnya.
5. Menunjukkan bahwa pengujian tidak hanya memeriksa input-output sederhana, tetapi juga dampak transaksi terhadap stok bahan baku.

## 3. Fitur yang Menjadi Objek Pengujian

Fitur yang diuji adalah integrasi antara:

| Modul | Peran dalam Pengujian |
| --- | --- |
| Bahan Baku | Menyimpan data bahan, satuan, stok awal, dan batas minimum stok |
| Menu & Resep | Menyimpan produk/menu beserta komposisi bahan per porsi |
| POS | Memproses transaksi penjualan produk oleh kasir |
| Stok | Menampilkan stok bahan setelah transaksi atau penambahan stok |
| Mutasi Stok | Menampilkan riwayat stok masuk, stok keluar karena penjualan, dan stok masuk karena void |
| Laporan Transaksi | Menampilkan transaksi paid dan void serta menjadi tempat void transaksi |

## 4. Alur Bisnis yang Diuji

1. Admin login ke aplikasi.
2. Admin membuat data bahan baku, misalnya Sedotan, Keju, dan Sirup Gula Aren.
3. Admin membuat produk/menu, misalnya Kopisusu.
4. Admin menambahkan resep bahan baku pada produk Kopisusu.
5. Kasir login dan membuka halaman POS.
6. Kasir memilih produk Kopisusu dan menentukan jumlah pembelian.
7. Sistem menghitung total pembayaran.
8. Kasir memasukkan uang tunai dan memproses transaksi.
9. Jika stok bahan cukup dan pembayaran valid, transaksi berhasil.
10. Sistem mengurangi stok bahan baku sesuai resep dikalikan qty pembelian.
11. Sistem mencatat riwayat mutasi stok keluar.
12. Jika transaksi di-void, stok bahan baku dikembalikan.

## 5. Metode Black Box yang Digunakan

Dari daftar metode yang tersedia, dipilih lima metode yang paling sesuai dengan fitur bahan baku:

| No | Metode | Alasan Dipilih |
| --- | --- | --- |
| 1 | Equivalence Partitioning | Cocok untuk membagi input valid dan tidak valid seperti stok, qty, resep, dan pembayaran |
| 2 | Boundary Value Analysis | Cocok untuk menguji nilai batas seperti stok sama dengan kebutuhan, qty minimum, dan pembayaran pas total |
| 3 | Decision Table Testing | Cocok karena transaksi dipengaruhi kombinasi kondisi produk, resep, stok, cabang, qty, dan pembayaran |
| 4 | Cause-Effect Relationship Testing | Cocok untuk membuktikan hubungan sebab-akibat antara transaksi berhasil, stok berkurang, dan void mengembalikan stok |
| 5 | Robustness Testing | Cocok untuk menguji ketahanan sistem terhadap input ekstrem, tidak normal, atau aksi berulang |

Metode seperti Performance Testing dan Endurance Testing tidak dipilih sebagai metode utama karena fokus tugas diarahkan pada validasi fungsional bahan baku, bukan pengujian beban jangka panjang. Namun, beberapa aspek stabilitas tetap disentuh melalui Robustness Testing.

## 6. Kondisi Awal Pengujian

Kondisi awal berikut digunakan agar test case pada semua dokumen konsisten:

| Kondisi | Keterangan |
| --- | --- |
| Akun admin | Admin dapat mengakses menu Bahan Baku, Menu & Resep, Stok, dan Laporan Transaksi |
| Akun kasir | Kasir dapat mengakses POS, Stok, dan Laporan Transaksi sesuai cabang |
| Cabang aktif | Cabang sudah tersedia dan aktif |
| Produk utama | Kopisusu |
| Metode pembayaran | Cash / Tunai |
| Status produk valid | Active / Aktif |
| Status transaksi berhasil | Paid |
| Status transaksi dibatalkan | Voided |

## 7. Data Uji Global

| Data | Nilai |
| --- | --- |
| Produk | Kopisusu |
| Harga | Rp 10.000 |
| Qty transaksi normal | 3 porsi |
| Total pembayaran normal | Rp 30.000 |
| Uang diterima normal | Rp 50.000 |
| Kembalian normal | Rp 20.000 |

Resep produk Kopisusu:

| Bahan | Stok Awal | Kebutuhan per Porsi | Satuan |
| --- | ---: | ---: | --- |
| Sedotan | 10 | 1 | pcs |
| Keju | 1.000 | 100 | gr |
| Sirup Gula Aren | 1.500 | 10 | ml |

Expected stok setelah transaksi Kopisusu qty 3:

| Bahan | Stok Awal | Total Terpakai | Stok Akhir |
| --- | ---: | ---: | ---: |
| Sedotan | 10 pcs | 3 pcs | 7 pcs |
| Keju | 1.000 gr | 300 gr | 700 gr |
| Sirup Gula Aren | 1.500 ml | 30 ml | 1.470 ml |

## 8. Kriteria Keberhasilan Umum

1. Produk tidak dapat dibuat tanpa resep bahan baku.
2. Resep produk hanya menerima bahan dan jumlah kebutuhan yang valid.
3. Transaksi POS berhasil jika produk aktif, qty valid, stok cukup, cabang sesuai, dan pembayaran cukup.
4. Stok bahan baku berkurang sesuai resep saat transaksi berhasil.
5. Transaksi gagal tidak mengurangi stok bahan baku.
6. Riwayat mutasi stok tercatat saat stok berkurang karena penjualan.
7. Void transaksi paid mengembalikan stok bahan baku.
8. Sistem menolak input ekstrem atau tidak valid tanpa merusak data stok.

## 9. Format Pencatatan Hasil Pengujian

Saat pengujian dijalankan, hasil dapat dicatat menggunakan format berikut:

| ID Test Case | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- |
| EP-01 | Bahan berhasil disimpan | Diisi setelah pengujian | Pass / Fail | Screenshot atau catatan hasil |

Keterangan status:

| Status | Arti |
| --- | --- |
| Pass | Hasil aktual sesuai expected result |
| Fail | Hasil aktual tidak sesuai expected result |
| Blocked | Test case belum dapat dijalankan karena data, akses, atau environment belum siap |
| Not Run | Test case belum dijalankan |

## 10. Catatan Kesesuaian dengan Implementasi

Dokumen black box ini memuat expected behavior atau perilaku yang diharapkan dari sistem. Beberapa test case juga dapat berfungsi sebagai dasar menemukan kekurangan validasi pada implementasi saat ini. Jika saat pengujian ditemukan bahwa sistem masih menerima input yang seharusnya ditolak, maka hasil tersebut dicatat sebagai Fail dan dapat dijadikan bahan pembahasan pada pengujian white box atau rekomendasi perbaikan.

Contoh area yang perlu diperhatikan saat eksekusi pengujian:

1. Validasi stok bahan baku negatif.
2. Validasi satuan bahan baku kosong.
3. Validasi harga produk nol atau negatif.
4. Validasi klik tombol pembayaran berulang.
5. Validasi produk lama yang mungkin belum memiliki resep.

## 11. Daftar Dokumen Pengujian

| No | Dokumen | Metode |
| --- | --- | --- |
| 1 | `black-box-01-equivalence-partitioning-bahan-baku.md` | Equivalence Partitioning |
| 2 | `black-box-02-boundary-value-analysis-bahan-baku.md` | Boundary Value Analysis |
| 3 | `black-box-03-decision-table-testing-bahan-baku.md` | Decision Table Testing |
| 4 | `black-box-04-cause-effect-relationship-testing-bahan-baku.md` | Cause-Effect Relationship Testing |
| 5 | `black-box-05-robustness-testing-bahan-baku.md` | Robustness Testing |

## 12. Kesimpulan

Pengujian black box fitur bahan baku LocalesPro dirancang untuk membuktikan bahwa proses penjualan produk memiliki dampak yang benar terhadap stok bahan baku. Dengan lima metode pengujian yang dipilih, dokumen ini tidak hanya menguji input valid dan tidak valid, tetapi juga nilai batas, kombinasi kondisi, hubungan sebab-akibat, dan ketahanan sistem terhadap input tidak normal.

Hasil pengujian black box ini dapat digunakan sebagai dasar untuk melanjutkan ke white box testing, terutama pada bagian validasi resep, validasi stok, transaksi database, pengurangan stok otomatis, pencatatan mutasi stok, dan pengembalian stok saat void transaksi.
