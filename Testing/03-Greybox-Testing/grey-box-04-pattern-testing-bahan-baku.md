# Grey Box Testing - Pattern Testing Fitur Bahan Baku LocalesPro

## 1. Pendahuluan

Pattern Testing adalah pendekatan grey box yang berfokus pada pencarian pola bug berdasarkan eksplorasi, intuisi, dan pengalaman tester. Metode ini tidak hanya mengikuti test case formal, tetapi juga mencoba skenario yang sering menjadi sumber error pada aplikasi nyata.

Pada LocalesPro, Pattern Testing digunakan untuk mencari pola kesalahan pada fitur bahan baku, terutama pola yang berhubungan dengan resep produk, stok, transaksi POS, pembayaran, mutasi stok, dan void transaksi.

## 2. Tujuan Pengujian

1. Mengidentifikasi pola bug umum pada fitur bahan baku.
2. Menguji skenario tidak terduga yang mungkin tidak tercakup oleh metode formal.
3. Memastikan aplikasi tetap stabil saat pengguna melakukan aksi berulang atau input tidak normal.
4. Menggabungkan pengetahuan internal sistem dengan eksplorasi perilaku aplikasi.

## 3. Ruang Lingkup

Pattern Testing pada dokumen ini mencakup eksplorasi pola bug pada fitur bahan baku, transaksi POS, stok, mutasi stok, dan void transaksi. Pengujian dilakukan berdasarkan pola risiko yang diketahui dari struktur internal sistem dan perilaku aplikasi.

## 4. Definisi Metode

Pattern Testing adalah pendekatan pengujian yang menekankan eksplorasi dan penemuan bug secara kreatif. Berdasarkan materi dosen, tahapan Pattern Testing meliputi:

1. Menguji fungsional dasar.
2. Menguji batasan dan skenario tidak terduga.
3. Menguji performa dan stabilitas.
4. Menguji kegunaan dan pengalaman pengguna.

## 5. Prosedur Penerapan pada LocalesPro

1. Menentukan pola bug yang sering muncul pada sistem stok.
2. Menentukan skenario eksploratif berdasarkan pola tersebut.
3. Menjalankan skenario melalui UI atau API.
4. Memverifikasi hasil melalui data internal.
5. Mencatat pola yang menghasilkan bug atau perilaku mencurigakan.

## 6. Informasi Internal yang Digunakan

| Informasi Internal | Kegunaan dalam Pattern Testing |
| --- | --- |
| Produk wajib punya resep | Mencoba pola produk tanpa resep atau resep rusak |
| Stok dicek sebelum transaksi commit | Mencoba pola stok kurang, stok pas, stok habis |
| Stok berubah lewat `applyInventoryUsageForTransaction()` | Mencoba pola transaksi berhasil dan void |
| Mutasi stok dicatat melalui `recordStockMovement()` | Mencoba pola stok berubah tetapi audit tidak tercatat |
| Transaksi memakai branch_id | Mencoba pola data lintas cabang |

## 7. Pattern 1 - Fungsional Dasar

| ID | Pola Pengujian | Skenario | Expected Result |
| --- | --- | --- | --- |
| PT-FD-01 | Tambah bahan normal | Tambah Sedotan, Keju, Sirup | Bahan tersimpan dan tampil di daftar |
| PT-FD-02 | Tambah produk normal | Buat Kopisusu dengan resep valid | Produk tersimpan dengan resep |
| PT-FD-03 | Transaksi normal | Jual Kopisusu qty 3 | Transaksi paid dan stok berkurang |
| PT-FD-04 | Mutasi normal | Cek riwayat stok setelah transaksi | Mutasi `sale` tercatat |
| PT-FD-05 | Void normal | Void transaksi paid | Stok kembali dan mutasi `void_restore` tercatat |

## 8. Pattern 2 - Batasan dan Skenario Tidak Terduga

| ID | Pola Bug yang Dicari | Skenario | Expected Result |
| --- | --- | --- | --- |
| PT-BT-01 | Produk tanpa resep | Simpan produk tanpa bahan | Sistem menolak produk |
| PT-BT-02 | Resep nol | Masukkan kebutuhan bahan `0` | Sistem menolak resep |
| PT-BT-03 | Qty POS nol | Kirim item qty `0` | Transaksi ditolak |
| PT-BT-04 | Stok habis | Jual produk dengan salah satu bahan stok 0 | Transaksi ditolak |
| PT-BT-05 | Stok pas kebutuhan | Stok sama dengan kebutuhan transaksi | Transaksi berhasil dan stok menjadi 0 |
| PT-BT-06 | Bayar kurang | Uang tunai kurang dari total | Transaksi ditolak dan stok tetap |
| PT-BT-07 | Produk beda cabang | Produk/bahan cabang lain dipakai | Transaksi ditolak |
| PT-BT-08 | Void dua kali | Void transaksi yang sudah void | Sistem menolak void ulang |

## 9. Pattern 3 - Performa dan Stabilitas Ringan

| ID | Pola Stabilitas | Skenario | Expected Result |
| --- | --- | --- | --- |
| PT-ST-01 | Transaksi berulang | Lakukan beberapa transaksi valid berturut-turut | Stok berkurang konsisten, mutasi tercatat semua |
| PT-ST-02 | Banyak item dalam cart | Cart berisi beberapa produk | Total harga dan kebutuhan bahan akurat |
| PT-ST-03 | Produk berbagi bahan sama | Dua produk memakai Keju | Kebutuhan Keju terakumulasi |
| PT-ST-04 | Klik pembayaran cepat | Konfirmasi pembayaran ditekan cepat/berulang | Tidak boleh membuat transaksi ganda |
| PT-ST-05 | Refresh data setelah transaksi | Buka ulang halaman Stok | Stok tetap sesuai database |

## 10. Pattern 4 - Kegunaan dan Pengalaman Pengguna

| ID | Pola UX | Skenario | Expected Result |
| --- | --- | --- | --- |
| PT-UX-01 | Produk habis | Bahan tidak cukup untuk produk | Produk ditandai habis atau tidak bisa diproses |
| PT-UX-02 | Pesan stok kurang | Transaksi stok kurang | Pesan menjelaskan bahan yang kurang |
| PT-UX-03 | Pesan uang kurang | Pembayaran kurang | Pesan jelas dan transaksi tidak lanjut |
| PT-UX-04 | Stok setelah void | User cek stok setelah void | Stok terlihat kembali sesuai mutasi |
| PT-UX-05 | Mutasi mudah diaudit | User cek riwayat stok | Jenis mutasi dan jumlah terlihat jelas |

## 11. Pattern Bug yang Perlu Diwaspadai

| Pola Bug | Indikasi | Dampak |
| --- | --- | --- |
| Silent stock error | Transaksi paid tetapi stok tidak berubah | Stok tidak akurat |
| Missing stock movement | Stok berubah tetapi mutasi tidak tercatat | Audit stok lemah |
| Double deduction | Satu transaksi mengurangi stok dua kali | Stok terlalu kecil |
| Double restore | Void ulang mengembalikan stok dua kali | Stok terlalu besar |
| Branch leakage | Transaksi cabang A mengubah stok cabang B | Data cabang rusak |
| Recipe mismatch | Resep yang tampil berbeda dari resep yang dipakai hitung stok | Perhitungan stok tidak dipercaya |

## 12. Pattern Internal dan Cara Verifikasi

| Pattern Internal | Cara Memancing Bug | Cara Verifikasi |
| --- | --- | --- |
| Double deduction | Klik bayar cepat atau kirim request transaksi berulang | Bandingkan jumlah transaksi dan jumlah mutasi `sale` |
| Missing movement | Jalankan transaksi valid | Cek stok berubah dan `stock_movements` bertambah |
| Branch leakage | Uji produk/bahan cabang berbeda | Cek stok cabang lain tidak berubah |
| Broken recipe | Ubah resep lalu transaksi | Cek kebutuhan bahan sesuai resep terbaru |
| Failed rollback | Paksa transaksi gagal setelah validasi | Cek transaksi tidak tersimpan dan stok tetap |

## 13. Format Pencatatan Hasil

| ID | Pattern | Expected Result | Actual Result | Status | Catatan |
| --- | --- | --- | --- | --- | --- |
| PT-FD-03 | Transaksi normal | Transaksi paid dan stok berkurang | Diisi saat pengujian | Pass / Fail | Cek UI dan database |

## 14. Kriteria Keberhasilan

1. Pola fungsional dasar berjalan sesuai kebutuhan.
2. Pola batas dan tidak terduga tidak merusak data stok.
3. Pola stabilitas tidak menyebabkan transaksi atau mutasi ganda.
4. Pola UX memberikan pesan yang jelas bagi user.
5. Pola internal yang berisiko dapat diverifikasi melalui database.

## 15. Kesimpulan

Pattern Testing membantu menemukan pola kesalahan yang mungkin terlewat oleh test case formal. Pada fitur bahan baku LocalesPro, pola paling penting adalah transaksi berhasil tetapi stok tidak berubah, stok berubah tanpa mutasi, pengurangan stok ganda, pengembalian stok ganda, dan kesalahan cabang. Dengan metode ini, tester dapat mengeksplorasi aplikasi secara lebih kritis sambil tetap menggunakan pengetahuan internal sistem.
