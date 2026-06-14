# Black Box Testing - Decision Table Testing Fitur Bahan Baku LocalesPro

## Pendahuluan

Dokumen ini berisi rancangan pengujian black box untuk fitur bahan baku LocalesPro menggunakan metode Decision Table Testing. Pengujian difokuskan pada keputusan sistem saat kasir melakukan transaksi POS untuk produk yang memiliki resep bahan baku.

Pada LocalesPro, transaksi POS dapat berhasil atau gagal berdasarkan beberapa kondisi sekaligus. Produk harus aktif, memiliki resep, qty harus valid, stok bahan harus cukup, cabang harus sesuai, dan pembayaran tunai harus cukup. Karena keputusan sistem dipengaruhi oleh kombinasi banyak kondisi, metode decision table cocok digunakan.

## Tujuan Dokumen

1. Menjelaskan rancangan pengujian menggunakan metode Decision Table Testing.
2. Mengidentifikasi kondisi yang menentukan keberhasilan transaksi POS.
3. Menentukan aksi sistem untuk setiap kombinasi kondisi.
4. Memastikan pengurangan stok hanya terjadi pada kombinasi kondisi yang valid.
5. Menjadi acuan pengujian aturan bisnis pada fitur resep dan bahan baku.

## Ruang Lingkup

Ruang lingkup dokumen ini mencakup kombinasi kondisi pada transaksi POS yang berkaitan dengan produk, resep bahan baku, stok, cabang aktif, qty produk, dan pembayaran tunai. Pengujian juga mencakup dampak keputusan sistem terhadap stok bahan dan riwayat mutasi stok.

Dokumen ini tidak membahas detail implementasi kode, query database internal, atau pengujian antarmuka secara visual. Fokusnya adalah hubungan antara kombinasi kondisi input dengan keputusan sistem.

## Definisi Metode

Decision Table Testing adalah metode black box yang menyusun kondisi dan aksi dalam bentuk tabel keputusan. Setiap baris atau rule menunjukkan kombinasi kondisi tertentu dan output yang seharusnya dihasilkan oleh sistem.

Pada fitur bahan baku LocalesPro, metode ini digunakan untuk memastikan transaksi hanya berhasil jika semua kondisi utama terpenuhi. Jika salah satu kondisi penting gagal, sistem harus menolak transaksi dan stok bahan tidak boleh berkurang.

## Prosedur Penerapan

1. Menentukan kondisi utama yang mempengaruhi transaksi POS.
2. Menentukan aksi atau output yang mungkin terjadi, seperti transaksi berhasil, transaksi ditolak, stok berkurang, atau stok tetap.
3. Menyusun kombinasi kondisi dalam tabel keputusan.
4. Membuat test case berdasarkan setiap rule pada decision table.
5. Menjalankan setiap skenario melalui aplikasi LocalesPro.
6. Memverifikasi status transaksi, stok akhir, dan mutasi stok.
7. Membandingkan hasil aktual dengan expected action pada tabel keputusan.

## Kondisi Awal Pengujian

| Kondisi | Keterangan |
| --- | --- |
| Akun admin | Dapat mengatur status produk aktif/nonaktif dan resep produk |
| Akun kasir | Dapat memproses transaksi POS pada cabang aktif |
| Cabang aktif | Cabang bahan, produk, dan transaksi harus sama untuk skenario valid |
| Produk valid | Kopisusu berstatus aktif dan memiliki resep lengkap |
| Produk tidak valid | Produk nonaktif, produk tanpa resep, atau produk dari cabang berbeda |
| Stok valid | Semua bahan resep tersedia minimal sama dengan kebutuhan transaksi |
| Stok tidak valid | Minimal satu bahan lebih kecil dari kebutuhan transaksi |

## Format Pencatatan Hasil

Setiap rule pada decision table sebaiknya dicatat sebagai hasil eksekusi pengujian dengan format berikut:

| Kolom | Keterangan |
| --- | --- |
| Actual Result | Keputusan aktual sistem, misalnya transaksi berhasil atau ditolak |
| Status | `Pass` jika keputusan aktual sesuai expected action |
| Bukti / Catatan | Status transaksi, stok akhir, pesan error, atau riwayat mutasi stok |

## Catatan Kesesuaian Implementasi

Decision table ini dibuat berdasarkan aturan bisnis yang diharapkan dari aplikasi. Untuk produk tanpa resep, skenario utama yang diuji adalah pembuatan produk ditolak. Jika terdapat data lama yang tidak memiliki resep, hasil pengujian pada POS perlu dicatat sebagai temuan khusus karena dapat mempengaruhi akurasi stok.

## Keterkaitan dengan Aplikasi

| Kondisi Decision Table | Bagian Aplikasi | Output yang Diverifikasi |
| --- | --- | --- |
| Produk aktif/nonaktif | Halaman Menu & Resep dan POS | Produk aktif dapat dijual, produk nonaktif tidak menjadi transaksi valid |
| Produk memiliki resep | Halaman Menu & Resep | Produk baru wajib memiliki minimal 1 bahan resep |
| Qty valid | Halaman POS | Qty lebih dari 0 dapat diproses, qty 0 ditolak |
| Stok cukup/tidak cukup | POS dan Stok | Transaksi bergantung pada ketersediaan semua bahan resep |
| Cabang sesuai/tidak sesuai | Cabang aktif, Produk, Bahan | Data lintas cabang tidak boleh diproses sebagai transaksi valid |
| Pembayaran cukup/tidak cukup | Modal Pembayaran POS | Uang tunai kurang menyebabkan transaksi ditolak |

## Tabel Eksekusi Pengujian

Setiap rule pada decision table perlu dieksekusi untuk membuktikan keputusan sistem sesuai dengan kombinasi kondisi.

| ID | Rule | Langkah Uji | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| DT-01 | R1 | Jual produk aktif dengan resep valid, qty valid, stok cukup, uang cukup | Transaksi berhasil, stok berkurang, mutasi tercatat | Belum diuji | Not Run | Screenshot transaksi dan stok |
| DT-02 | R2 | Ubah produk menjadi nonaktif lalu coba jual di POS | Transaksi tidak boleh berhasil dan stok tetap | Belum diuji | Not Run | Screenshot status produk / POS |
| DT-03 | R3 | Coba simpan produk tanpa resep | Produk ditolak karena resep wajib | Belum diuji | Not Run | Pesan validasi resep |
| DT-04 | R4 | Kirim transaksi dengan qty 0 | Transaksi ditolak | Belum diuji | Not Run | Pesan item tidak valid |
| DT-05 | R5 | Jual produk dengan salah satu stok bahan kurang | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Pesan stok kurang |
| DT-06 | R6 | Proses produk atau bahan dari cabang berbeda | Transaksi ditolak dan stok tidak berubah | Belum diuji | Not Run | Pesan cabang tidak sesuai |
| DT-07 | R7 | Proses pembayaran tunai kurang | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Pesan uang kurang |

## 1. Identitas Pengujian

| Komponen | Keterangan |
| --- | --- |
| Nama Aplikasi | LocalesPro |
| Jenis Pengujian | Black Box Testing |
| Metode | Decision Table Testing |
| Fitur Utama | Keputusan transaksi POS berdasarkan produk, resep, stok bahan, qty, cabang, dan pembayaran |
| Aktor | Admin dan Kasir |
| Modul Terkait | Menu & Resep, POS, Bahan Baku, Stok, Laporan Transaksi |

## 2. Deskripsi Fitur yang Diuji

Pada LocalesPro, keberhasilan transaksi POS tidak hanya ditentukan oleh produk yang dipilih. Sistem juga harus memeriksa apakah produk aktif, produk memiliki resep, qty valid, stok bahan mencukupi, bahan berasal dari cabang yang sesuai, dan pembayaran tunai cukup. Jika seluruh kondisi terpenuhi, transaksi berhasil dan stok bahan baku otomatis berkurang.

Decision Table Testing digunakan untuk menguji kombinasi kondisi yang menghasilkan keputusan berbeda. Metode ini cocok karena transaksi POS memiliki beberapa aturan bisnis yang saling mempengaruhi.

## 3. Tujuan Pengujian

1. Memastikan transaksi hanya berhasil jika semua kondisi wajib terpenuhi.
2. Memastikan transaksi ditolak jika salah satu kondisi penting tidak terpenuhi.
3. Memastikan stok bahan hanya berkurang pada keputusan transaksi berhasil.
4. Memastikan kombinasi kondisi gagal tidak menghasilkan transaksi parsial.
5. Memastikan pesan error sesuai dengan penyebab kegagalan.

## 4. Kondisi dan Aksi

### 4.1 Kondisi

| Kode | Kondisi |
| --- | --- |
| C1 | Produk berstatus aktif |
| C2 | Produk memiliki resep bahan baku |
| C3 | Qty produk valid, yaitu lebih dari 0 |
| C4 | Stok semua bahan resep mencukupi |
| C5 | Produk dan bahan berada pada cabang aktif yang sesuai |
| C6 | Pembayaran tunai sama atau lebih dari total tagihan |

### 4.2 Aksi

| Kode | Aksi / Output |
| --- | --- |
| A1 | Transaksi berhasil diproses |
| A2 | Stok bahan baku berkurang sesuai resep |
| A3 | Mutasi stok tipe penjualan tercatat |
| A4 | Transaksi ditolak |
| A5 | Stok bahan baku tidak berubah |

## 5. Decision Table

| Rule | C1 Produk Aktif | C2 Ada Resep | C3 Qty Valid | C4 Stok Cukup | C5 Cabang Sesuai | C6 Uang Cukup | Expected Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Ya | Ya | Ya | Ya | Ya | Ya | A1, A2, A3 |
| R2 | Tidak | Ya | Ya | Ya | Ya | Ya | A4, A5 |
| R3 | Ya | Tidak | Ya | Ya | Ya | Ya | A4, A5 pada proses pembuatan produk karena produk baru wajib memiliki resep |
| R4 | Ya | Ya | Tidak | Ya | Ya | Ya | A4, A5 |
| R5 | Ya | Ya | Ya | Tidak | Ya | Ya | A4, A5 |
| R6 | Ya | Ya | Ya | Ya | Tidak | Ya | A4, A5 |
| R7 | Ya | Ya | Ya | Ya | Ya | Tidak | A4, A5 |
| R8 | Tidak | Tidak | Tidak | Tidak | Tidak | Tidak | A4, A5 |

## 6. Test Case Decision Table

| ID | Rule | Skenario Pengujian | Input Uji | Expected Result |
| --- | --- | --- | --- | --- |
| DT-01 | R1 | Transaksi valid dengan stok cukup | Kopisusu aktif, resep lengkap, qty `3`, uang Rp 50.000 | Transaksi berhasil, stok Sedotan berkurang `3`, Keju `300`, Sirup `30` |
| DT-02 | R2 | Produk nonaktif dicoba dijual | Produk status `inactive`, qty `1`, stok cukup, uang cukup | Transaksi ditolak, stok bahan tidak berubah |
| DT-03 | R3 | Admin membuat produk tanpa resep | Produk valid tetapi resep kosong | Produk ditolak karena resep wajib diisi, sehingga produk tidak dapat menjadi item POS valid |
| DT-04 | R4 | Qty transaksi tidak valid | Produk aktif, qty `0`, stok cukup, uang cukup | Transaksi ditolak karena item transaksi tidak valid |
| DT-05 | R5 | Salah satu bahan stok kurang | Sedotan tersedia `2 pcs`, kebutuhan `3 pcs` | Transaksi ditolak karena stok tidak cukup |
| DT-06 | R6 | Produk atau bahan berasal dari cabang berbeda | Produk cabang A diproses pada cabang B | Transaksi ditolak karena cabang tidak sesuai |
| DT-07 | R7 | Pembayaran tunai kurang | Total Rp 30.000, uang Rp 20.000 | Transaksi ditolak, stok tidak berubah |
| DT-08 | R8 | Semua kondisi tidak valid | Produk nonaktif, resep kosong, qty `0`, stok kurang, uang kurang | Transaksi ditolak dan tidak ada perubahan stok |

## 7. Contoh Detail Rule R1

Input:

```text
Produk: Kopisusu
Status: active
Qty: 3
Total tagihan: Rp 30.000
Uang diterima: Rp 50.000
```

Resep:

| Bahan | Kebutuhan per Produk | Qty Produk | Total Kebutuhan |
| --- | ---: | ---: | ---: |
| Sedotan | 1 pcs | 3 | 3 pcs |
| Keju | 100 gr | 3 | 300 gr |
| Sirup Gula Aren | 10 ml | 3 | 30 ml |

Expected result:

1. Transaksi berstatus `Paid`.
2. Kode transaksi terbentuk.
3. Stok bahan berkurang sesuai total kebutuhan.
4. Riwayat mutasi stok mencatat pengurangan dengan jenis penjualan.
5. Kembalian dihitung Rp 20.000.

## 8. Kriteria Keberhasilan

1. Rule R1 menghasilkan transaksi berhasil.
2. Rule R2 sampai R8 menghasilkan transaksi ditolak atau data tidak tersimpan.
3. Tidak ada stok yang berkurang pada transaksi gagal.
4. Mutasi stok hanya tercatat saat transaksi berhasil atau void transaksi.
5. Output sistem sesuai dengan kombinasi kondisi pada decision table.

## 9. Kesimpulan

Decision Table Testing membuktikan bahwa fitur bahan baku LocalesPro memiliki aturan keputusan yang jelas. Transaksi POS hanya boleh berhasil jika produk aktif, resep valid, qty valid, stok cukup, cabang sesuai, dan pembayaran cukup. Metode ini efektif untuk memastikan kombinasi kondisi bisnis tidak menghasilkan keputusan yang salah.
