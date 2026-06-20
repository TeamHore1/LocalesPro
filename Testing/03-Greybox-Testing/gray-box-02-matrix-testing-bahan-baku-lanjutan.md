# Gray Box Testing Matrix Fitur Bahan Baku LocalesPro

## Pendahuluan

Matrix Testing digunakan untuk memetakan kombinasi kondisi bisnis yang memengaruhi keputusan sistem. Pada fitur bahan baku LocalesPro, metode ini sesuai karena keberhasilan transaksi bergantung pada lebih dari satu syarat, antara lain status produk, cabang aktif, validitas resep, kecukupan stok, dan pembayaran tunai.

Metode ini membantu penguji menilai apakah keputusan sistem sudah konsisten pada setiap kombinasi kondisi yang mungkin muncul saat aplikasi digunakan.

## Tujuan

1. memetakan hubungan antara kondisi bisnis dan hasil transaksi;
2. memastikan setiap kondisi penting diuji secara sistematis;
3. memverifikasi bahwa stok hanya berubah pada kombinasi yang valid;
4. menyediakan dokumen pengujian yang mudah digunakan saat eksekusi.

## Parameter Pengujian

| Parameter | Nilai |
| --- | --- |
| Produk aktif | Ya / Tidak |
| Cabang sesuai | Ya / Tidak |
| Resep valid | Ya / Tidak |
| Stok cukup | Ya / Tidak |
| Tunai cukup | Ya / Tidak |

## Dasar Logika Sistem

Berdasarkan analisis terhadap alur transaksi, keputusan sistem yang diharapkan adalah:

1. produk nonaktif harus ditolak;
2. produk lintas cabang harus ditolak;
3. resep tidak valid tidak boleh menghasilkan transaksi sukses;
4. stok tidak cukup harus menghentikan transaksi;
5. tunai kurang harus menolak transaksi cash;
6. jika semua syarat valid, transaksi berhasil dan stok berkurang.

## Matriks Keputusan

| ID | Produk Aktif | Cabang Sesuai | Resep Valid | Stok Cukup | Tunai Cukup | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MX-01 | Ya | Ya | Ya | Ya | Ya | Transaksi berhasil, stok berkurang, mutasi sale tercatat |  | Not Run |  |
| MX-02 | Tidak | Ya | Ya | Ya | Ya | Transaksi ditolak karena produk nonaktif |  | Not Run |  |
| MX-03 | Ya | Tidak | Ya | Ya | Ya | Transaksi ditolak karena cabang tidak sesuai |  | Not Run |  |
| MX-04 | Ya | Ya | Tidak | Ya | Ya | Transaksi ditolak karena resep tidak valid |  | Not Run |  |
| MX-05 | Ya | Ya | Ya | Tidak | Ya | Transaksi ditolak karena stok tidak cukup |  | Not Run |  |
| MX-06 | Ya | Ya | Ya | Ya | Tidak | Transaksi ditolak karena tunai kurang |  | Not Run |  |
| MX-07 | Tidak | Tidak | Ya | Ya | Ya | Transaksi ditolak, stok tetap |  | Not Run |  |
| MX-08 | Ya | Tidak | Ya | Tidak | Ya | Transaksi ditolak, stok tetap |  | Not Run |  |
| MX-09 | Ya | Ya | Tidak | Tidak | Ya | Transaksi ditolak, stok tetap |  | Not Run |  |
| MX-10 | Ya | Ya | Ya | Tidak | Tidak | Transaksi ditolak, stok tetap |  | Not Run |  |

## Skenario Uji Turunan

| ID | Deskripsi Eksekusi | Expected Result |
| --- | --- | --- |
| MX-01A | Jual `Kopisusu` qty 3 dengan stok cukup dan tunai Rp 50.000 | Status `Paid`, stok berkurang, kembalian benar |
| MX-02A | Ubah status produk menjadi `inactive`, lalu lakukan transaksi | Sistem menolak transaksi |
| MX-03A | Coba jual produk dari cabang berbeda | Sistem menolak karena produk tidak tersedia untuk cabang aktif |
| MX-04A | Simulasikan produk dengan resep yang tidak layak dipakai | Transaksi tidak berhasil dan stok tidak berubah |
| MX-05A | Atur stok bahan di bawah kebutuhan qty | Transaksi ditolak karena stok tidak cukup |
| MX-06A | Total Rp 30.000, uang diterima Rp 20.000 | Transaksi cash ditolak |

## Langkah Pelaksanaan

1. siapkan data bahan baku, produk, dan resep;
2. pilih cabang aktif yang sesuai dengan skenario;
3. atur status produk, kecukupan stok, dan pembayaran sesuai matriks;
4. jalankan transaksi;
5. bandingkan hasil aktual dengan expected result.

## Titik Pemeriksaan

| Objek | Pemeriksaan |
| --- | --- |
| UI POS | Pesan berhasil atau gagal sesuai kondisi |
| Tabel transactions | Adanya atau tidak adanya transaksi `Paid` |
| Tabel ingredients | Perubahan stok sesuai kondisi |
| Tabel stock_movements | Mutasi muncul hanya jika transaksi valid |

## Kesimpulan

Matrix Testing membantu memastikan bahwa LocalesPro mengambil keputusan yang konsisten pada kombinasi kondisi bisnis yang berbeda. Dengan metode ini, pengujian tidak hanya memeriksa satu jalur sukses, tetapi juga seluruh kombinasi kondisi penting yang dapat memengaruhi akurasi stok bahan baku.
