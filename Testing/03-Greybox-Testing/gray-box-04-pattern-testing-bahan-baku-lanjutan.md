# Gray Box Testing Pattern Fitur Bahan Baku LocalesPro

## Pendahuluan

Pattern Testing merupakan pendekatan pengujian eksploratif yang bertujuan menemukan pola kegagalan yang tidak selalu muncul dalam test case formal. Pada LocalesPro, metode ini penting karena fitur bahan baku melibatkan interaksi antar halaman, state frontend, endpoint backend, dan perubahan data stok yang sensitif terhadap urutan tindakan pengguna.

Pattern Testing tetap menggunakan dasar gray box karena eksplorasi dilakukan dengan memanfaatkan pengetahuan parsial tentang struktur dan aturan sistem.

## Tujuan

1. menemukan pola masalah yang mungkin tidak tertangkap oleh test case terstruktur;
2. mengevaluasi perilaku sistem pada skenario nyata dan tidak terduga;
3. menilai kestabilan alur bahan baku ketika aplikasi dipakai secara dinamis;
4. mendokumentasikan temuan eksploratif yang relevan untuk perbaikan sistem.

## Kelompok Pengujian

Metode ini dibagi menjadi empat kelompok:

1. pengujian fungsional dasar;
2. pengujian batasan dan skenario tidak terduga;
3. pengujian performa dan stabilitas ringan;
4. pengujian kegunaan dan pengalaman pengguna.

## Fungsional Dasar

| ID | Skenario | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| PT-01 | Tambah bahan baku dengan data normal | Bahan tersimpan dan tampil |  | Not Run |  |
| PT-02 | Tambah menu dengan resep valid | Produk tersimpan dan resep terbaca |  | Not Run |  |
| PT-03 | Transaksi normal qty 1 | Transaksi sukses dan stok berkurang |  | Not Run |  |
| PT-04 | Cek mutasi setelah transaksi | Mutasi stok keluar tercatat |  | Not Run |  |
| PT-05 | Void transaksi sukses | Stok kembali dan status berubah `Voided` |  | Not Run |  |

## Batasan dan Skenario Tidak Terduga

| ID | Skenario | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| PT-06 | Nama bahan sangat panjang | Sistem tetap stabil atau menolak dengan pesan jelas |  | Not Run |  |
| PT-07 | Input stok desimal dan minimum stok besar | Data tetap konsisten |  | Not Run |  |
| PT-08 | Tambah bahan resep yang sama berulang di UI | Sistem menggabungkan atau tetap konsisten |  | Not Run |  |
| PT-09 | Naikkan qty cart melebihi stok yang tersedia | UI menolak penambahan qty |  | Not Run |  |
| PT-10 | Jual produk saat stok tepat sama dengan kebutuhan | Transaksi hanya berhasil jika stok benar-benar cukup |  | Not Run |  |
| PT-11 | Coba transaksi pada produk nonaktif yang masih terlihat di UI | Backend tetap menolak |  | Not Run |  |
| PT-12 | Void transaksi dua kali | Void kedua ditolak, stok tidak berubah lagi |  | Not Run |  |

## Performa dan Stabilitas Ringan

| ID | Skenario | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| PT-13 | Tambah item ke cart dengan klik cepat berulang | Qty tetap terkendali dan tidak melebihi stok |  | Not Run |  |
| PT-14 | Lakukan transaksi berurutan pada produk yang sama | Stok berubah konsisten pada setiap transaksi |  | Not Run |  |
| PT-15 | Tambah stok masuk lalu langsung lakukan transaksi | Data sinkron setelah refresh |  | Not Run |  |
| PT-16 | Refresh halaman setelah transaksi dan void | Data frontend sesuai data backend |  | Not Run |  |
| PT-17 | Ganti cabang aktif lalu cek bahan, produk, dan transaksi | Data tetap sesuai konteks cabang |  | Not Run |  |

## Kegunaan dan Pengalaman Pengguna

| ID | Skenario | Expected Result | Actual Result | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- |
| PT-18 | Pengguna baru menambah bahan baku | Form mudah dipahami dan field cukup jelas |  | Not Run |  |
| PT-19 | Kasir menyelesaikan alur pembayaran | Langkah pembayaran jelas dan error mudah dipahami |  | Not Run |  |
| PT-20 | Admin memantau stok menipis | Indikator stok aman dan menipis mudah dibedakan |  | Not Run |  |
| PT-21 | Gunakan fitur pencarian bahan atau produk | Hasil pencarian membantu menemukan data |  | Not Run |  |
| PT-22 | Baca riwayat mutasi stok | Informasi perubahan stok mudah dipahami untuk audit |  | Not Run |  |

## Panduan Pencatatan Temuan

Saat Pattern Testing dijalankan, penguji disarankan mencatat:

1. urutan langkah yang memunculkan anomali;
2. apakah anomali hanya muncul di UI atau juga mengubah data;
3. apakah kejadian dapat diulang;
4. modul mana yang paling mungkin terkait;
5. dampak anomali terhadap transaksi dan stok.

## Area Temuan Potensial

| Area | Potensi Masalah |
| --- | --- |
| Sinkronisasi cart dan stok | UI menghitung stok dari data lokal, backend memvalidasi ulang |
| Perubahan resep produk | Kebutuhan bahan dapat berubah dan memengaruhi stok |
| Void transaksi | Risiko restore stok ganda |
| Perpindahan cabang aktif | Risiko data antar cabang tercampur |

## Kesimpulan

Pattern Testing melengkapi metode gray box lain dengan cara mengeksplorasi LocalesPro secara lebih bebas namun tetap terarah. Metode ini efektif untuk menemukan masalah perilaku sistem yang sering muncul dari pola penggunaan nyata, terutama pada area stok, transaksi, mutasi, dan perpindahan konteks cabang.
