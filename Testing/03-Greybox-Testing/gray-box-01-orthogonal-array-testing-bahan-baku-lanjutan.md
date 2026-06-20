# Gray Box Testing Orthogonal Array Fitur Bahan Baku LocalesPro

## Pendahuluan

Orthogonal Array Testing digunakan ketika sistem memiliki beberapa faktor yang masing-masing memiliki beberapa level, sehingga jumlah kombinasi pengujian penuh menjadi terlalu besar. Pada fitur bahan baku LocalesPro, keberhasilan transaksi ditentukan oleh kombinasi beberapa faktor penting, yaitu jumlah pembelian, ketersediaan stok, status produk dan cabang, serta kecukupan pembayaran tunai.

Metode ini dipilih agar kombinasi faktor yang relevan tetap terwakili secara efisien. Dalam pendekatan gray box, faktor yang dipilih bukan sekadar faktor antarmuka, tetapi faktor yang diketahui berpengaruh langsung terhadap keputusan backend.

## Tujuan

1. menyederhanakan kombinasi pengujian tanpa kehilangan cakupan faktor penting;
2. memeriksa interaksi antar kondisi yang paling memengaruhi transaksi bahan baku;
3. mendeteksi kombinasi faktor yang berpotensi menimbulkan kegagalan logika;
4. menyediakan set test case yang efisien untuk eksekusi manual.

## Faktor dan Level

| Kode | Faktor | Level 1 | Level 2 | Level 3 |
| --- | --- | --- | --- | --- |
| A | Qty pembelian | 1 porsi | 3 porsi | 5 porsi |
| B | Kondisi stok | Lebih dari cukup | Pas kebutuhan | Kurang dari kebutuhan |
| C | Status produk dan cabang | Aktif, cabang sesuai | Nonaktif | Aktif, cabang berbeda |
| D | Pembayaran tunai | Pas total | Lebih dari total | Kurang dari total |

## Dasar Pemilihan Faktor

| Faktor | Acuan Sistem | Alasan |
| --- | --- | --- |
| Qty | `POS.jsx`, `transactions/create.php` | Menentukan subtotal dan kebutuhan bahan |
| Kondisi stok | `payment_helpers.php` | Menentukan apakah transaksi dapat dilanjutkan |
| Status produk dan cabang | `transactions/create.php` | Menentukan validitas item yang dijual |
| Pembayaran tunai | `POS.jsx`, `transactions/create.php` | Menentukan validitas pembayaran |

## Rancangan Array

Digunakan pola `L9 (3^4)` untuk mewakili empat faktor dengan tiga level.

| ID | A | B | C | D |
| --- | --- | --- | --- | --- |
| OA-01 | 1 | 1 | 1 | 1 |
| OA-02 | 1 | 2 | 2 | 2 |
| OA-03 | 1 | 3 | 3 | 3 |
| OA-04 | 2 | 1 | 2 | 3 |
| OA-05 | 2 | 2 | 3 | 1 |
| OA-06 | 2 | 3 | 1 | 2 |
| OA-07 | 3 | 1 | 3 | 2 |
| OA-08 | 3 | 2 | 1 | 3 |
| OA-09 | 3 | 3 | 2 | 1 |

## Pemetaan Test Case

| ID | Kombinasi Aktual | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| OA-01 | Qty 1, stok lebih dari cukup, produk aktif cabang sesuai, pembayaran pas | Transaksi berhasil, stok berkurang, mutasi sale tercatat |  | Not Run |  |
| OA-02 | Qty 1, stok pas, produk nonaktif, pembayaran lebih | Transaksi ditolak, stok tetap |  | Not Run |  |
| OA-03 | Qty 1, stok kurang, produk aktif cabang berbeda, pembayaran kurang | Transaksi ditolak, stok tetap |  | Not Run |  |
| OA-04 | Qty 3, stok lebih dari cukup, produk nonaktif, pembayaran kurang | Transaksi ditolak sebelum perubahan data |  | Not Run |  |
| OA-05 | Qty 3, stok pas, produk aktif cabang berbeda, pembayaran pas | Transaksi ditolak karena cabang tidak sesuai |  | Not Run |  |
| OA-06 | Qty 3, stok kurang, produk aktif cabang sesuai, pembayaran lebih | Transaksi ditolak karena stok bahan tidak cukup |  | Not Run |  |
| OA-07 | Qty 5, stok lebih dari cukup, produk aktif cabang berbeda, pembayaran lebih | Transaksi ditolak karena validasi cabang |  | Not Run |  |
| OA-08 | Qty 5, stok pas, produk aktif cabang sesuai, pembayaran kurang | Transaksi ditolak karena uang tunai kurang |  | Not Run |  |
| OA-09 | Qty 5, stok kurang, produk nonaktif, pembayaran pas | Transaksi ditolak, tidak ada perubahan stok |  | Not Run |  |

## Langkah Eksekusi

1. siapkan data bahan baku, resep, dan cabang sesuai kondisi uji;
2. atur stok bahan pembatas mengikuti level pada faktor `B`;
3. atur status produk atau konteks cabang mengikuti faktor `C`;
4. masukkan item ke cart sesuai qty pada faktor `A`;
5. lakukan pembayaran tunai sesuai faktor `D`;
6. amati hasil pada UI, database transaksi, stok bahan, dan mutasi stok.

## Titik Verifikasi

| Titik Verifikasi | Pemeriksaan |
| --- | --- |
| Respons POS | Berhasil atau gagal sesuai kombinasi |
| Data transaksi | Hanya kasus valid yang menghasilkan transaksi `Paid` |
| Data ingredients | Stok berubah hanya pada kasus valid |
| Data stock movements | Mutasi keluar muncul hanya jika transaksi sukses |

## Analisis yang Diharapkan

Hasil yang paling penting dari metode ini bukan hanya jumlah kasus yang lulus, tetapi pola keputusan sistem terhadap kombinasi faktor. Jika sistem memperbolehkan transaksi pada kombinasi yang seharusnya gagal, maka terdapat kelemahan logika pada validasi transaksi atau sinkronisasi antara frontend dan backend.

## Kesimpulan

Orthogonal Array Testing memberikan kombinasi pengujian yang ringkas namun tetap representatif untuk fitur bahan baku LocalesPro. Metode ini tepat dipakai pada tahap awal evaluasi gray box untuk memastikan bahwa interaksi faktor utama telah diuji dengan biaya pengujian yang tetap efisien.
