# Black Box Testing - Cause-Effect Relationship Testing Fitur Bahan Baku LocalesPro

## Pendahuluan

Dokumen ini berisi rancangan pengujian black box untuk fitur bahan baku LocalesPro menggunakan metode Cause-Effect Relationship Testing. Pengujian difokuskan pada hubungan sebab-akibat antara input pengguna dan hasil yang diberikan sistem.

Pada fitur bahan baku, terdapat hubungan yang jelas antara sebab dan akibat. Jika produk memiliki resep valid, stok cukup, qty valid, dan pembayaran cukup, maka transaksi berhasil dan stok bahan berkurang. Jika salah satu penyebab tidak terpenuhi, transaksi ditolak dan stok tidak berubah. Jika transaksi paid di-void, stok bahan dikembalikan.

## Tujuan Dokumen

1. Menjelaskan rancangan pengujian menggunakan metode Cause-Effect Relationship Testing.
2. Mengidentifikasi cause atau penyebab pada fitur resep produk dan transaksi POS.
3. Mengidentifikasi effect atau akibat yang muncul dari setiap kondisi input.
4. Membuktikan bahwa pengurangan stok terjadi karena transaksi berhasil.
5. Membuktikan bahwa transaksi gagal dan void transaksi menghasilkan efek yang sesuai.

## Ruang Lingkup

Ruang lingkup dokumen ini mencakup hubungan sebab-akibat pada pembuatan produk dengan resep, transaksi POS, pembayaran tunai, validasi stok bahan, mutasi stok, dan void transaksi. Pengujian dilakukan pada fitur yang berhubungan langsung dengan perubahan stok bahan baku.

Dokumen ini tidak membahas struktur kode internal atau detail teknis database secara mendalam. Pengujian dilakukan berdasarkan input yang dimasukkan pengguna dan output yang terlihat pada aplikasi.

## Definisi Metode

Cause-Effect Relationship Testing adalah metode black box yang memetakan penyebab input atau kondisi sistem dengan akibat yang seharusnya muncul. Metode ini membantu tester memastikan bahwa setiap kondisi memiliki respons yang sesuai.

Pada fitur bahan baku LocalesPro, contoh cause adalah produk dijual dengan stok cukup. Effect yang diharapkan adalah transaksi berhasil, stok bahan berkurang, dan mutasi stok tercatat. Contoh cause lain adalah stok tidak cukup, dengan effect transaksi ditolak dan stok tetap.

## Prosedur Penerapan

1. Menentukan cause utama pada fitur bahan baku dan POS.
2. Menentukan effect yang diharapkan dari setiap cause.
3. Menyusun hubungan cause dan effect dalam bentuk aturan.
4. Membuat test case berdasarkan aturan sebab-akibat.
5. Menjalankan skenario pada aplikasi LocalesPro.
6. Memverifikasi apakah effect yang muncul sesuai dengan cause yang diuji.
7. Memastikan stok bahan baku berubah hanya pada cause yang memang menghasilkan transaksi berhasil atau void transaksi.

## Kondisi Awal Pengujian

| Kondisi | Keterangan |
| --- | --- |
| Akun admin | Dapat membuat bahan, produk, resep, dan melakukan void transaksi melalui laporan |
| Akun kasir | Dapat melakukan transaksi POS |
| Produk utama | Kopisusu aktif dengan resep valid |
| Resep utama | Sedotan 1 pcs, Keju 100 gr, Sirup Gula Aren 10 ml |
| Transaksi valid | Kopisusu qty 3 dengan pembayaran tunai cukup |
| Transaksi void | Transaksi valid yang sudah berstatus Paid kemudian dibatalkan |
| Verifikasi efek | Dilakukan melalui stok akhir, mutasi stok, dan status transaksi |

## Format Pencatatan Hasil

Hasil pengujian cause-effect dicatat dengan memperhatikan apakah akibat yang muncul benar-benar sesuai dengan penyebab yang diberikan.

| Kolom | Keterangan |
| --- | --- |
| Actual Effect | Efek aktual yang muncul pada sistem |
| Status | `Pass` jika actual effect sama dengan expected effect |
| Bukti / Catatan | Perubahan stok, status transaksi, pesan error, atau mutasi stok |

## Catatan Kesesuaian Implementasi

Jika suatu cause menghasilkan effect yang tidak sesuai, misalnya transaksi gagal tetapi stok tetap berkurang, maka temuan tersebut termasuk masalah serius karena berdampak pada integritas stok. Temuan seperti ini perlu diprioritaskan saat masuk ke tahap white box testing.

## Keterkaitan dengan Aplikasi

| Cause | Bagian Aplikasi | Effect yang Dicek |
| --- | --- | --- |
| Produk dibuat dengan resep valid | Menu & Resep | Produk siap dijual dan memiliki komposisi bahan |
| Produk dijual dengan stok cukup | POS | Transaksi berhasil dan stok berkurang |
| Produk dijual dengan stok kurang | POS dan Stok | Transaksi ditolak dan stok tetap |
| Pembayaran kurang | Modal Pembayaran POS | Transaksi ditolak sebelum stok berubah |
| Transaksi paid di-void | Laporan Transaksi dan Stok | Status menjadi void dan stok dikembalikan |
| Keranjang kosong diproses | POS | Transaksi ditolak |

## Tabel Eksekusi Pengujian

Tabel ini digunakan untuk membuktikan bahwa setiap cause menghasilkan effect yang tepat pada aplikasi.

Test case prioritas untuk waktu terbatas adalah `CE-01`, `CE-03`, `CE-04`, dan `CE-07` karena membuktikan hubungan utama antara transaksi berhasil, stok kurang, pembayaran kurang, dan void transaksi terhadap perubahan stok.

| ID | Cause | Langkah Uji | Expected Effect | Actual Effect | Status | Bukti / Catatan |
| --- | --- | --- | --- | --- | --- | --- |
| CE-01 | Produk aktif, resep valid, stok cukup, pembayaran cukup | Jual Kopisusu qty 3 dan bayar 50000 | Transaksi paid, stok berkurang, mutasi keluar tercatat | Belum diuji | Not Run | Screenshot laporan dan stok |
| CE-03 | Stok bahan kurang | Atur Sedotan 2 pcs lalu jual kebutuhan 3 pcs | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Screenshot pesan stok kurang |
| CE-04 | Pembayaran kurang | Total 30000, bayar 20000 | Transaksi ditolak dan stok tetap | Belum diuji | Not Run | Screenshot modal pembayaran |
| CE-07 | Transaksi paid di-void | Void transaksi Kopisusu qty 3 dengan alasan valid | Status void, stok bahan kembali sesuai pemakaian | Belum diuji | Not Run | Screenshot laporan dan mutasi |
| CE-08 | Keranjang kosong | Klik proses pembayaran tanpa item | Transaksi ditolak dan tidak ada stok berubah | Belum diuji | Not Run | Screenshot POS |
| CE-10 | Dua produk memakai bahan sama | Jual dua produk yang sama-sama memakai Keju | Stok Keju berkurang sesuai total akumulasi | Belum diuji | Not Run | Screenshot stok Keju |

## 1. Identitas Pengujian

| Komponen | Keterangan |
| --- | --- |
| Nama Aplikasi | LocalesPro |
| Jenis Pengujian | Black Box Testing |
| Metode | Cause-Effect Relationship Testing |
| Fitur Utama | Hubungan sebab-akibat antara input transaksi POS dan perubahan stok bahan baku |
| Aktor | Admin dan Kasir |
| Modul Terkait | Bahan Baku, Menu & Resep, POS, Stok, Mutasi Stok, Laporan Transaksi |

## 2. Deskripsi Fitur yang Diuji

Fitur bahan baku LocalesPro memiliki hubungan sebab-akibat yang kuat. Ketika admin membuat resep produk, resep tersebut menjadi dasar perhitungan stok. Ketika kasir menjual produk, sistem menghitung kebutuhan bahan dari resep. Jika transaksi berhasil, stok bahan berkurang. Jika transaksi gagal, stok tidak berubah. Jika transaksi yang sudah paid di-void, stok bahan dikembalikan.

Metode Cause-Effect Relationship Testing digunakan untuk memetakan penyebab berupa input atau kondisi sistem dengan akibat berupa output sistem.

## 3. Tujuan Pengujian

1. Memastikan setiap penyebab menghasilkan akibat yang benar.
2. Memastikan transaksi berhasil menyebabkan stok bahan berkurang.
3. Memastikan transaksi gagal tidak menyebabkan perubahan stok.
4. Memastikan void transaksi menyebabkan stok bahan kembali.
5. Memastikan error input menghasilkan pesan penolakan yang sesuai.

## 4. Daftar Cause dan Effect

### 4.1 Cause

| Kode | Cause / Penyebab |
| --- | --- |
| C1 | Produk memiliki resep bahan baku valid |
| C2 | Qty produk di POS lebih dari 0 |
| C3 | Stok bahan baku mencukupi kebutuhan resep |
| C4 | Pembayaran tunai cukup |
| C5 | Produk berstatus aktif |
| C6 | Produk dan bahan sesuai cabang aktif |
| C7 | Transaksi paid diproses void |
| C8 | Keranjang POS kosong |

### 4.2 Effect

| Kode | Effect / Akibat |
| --- | --- |
| E1 | Transaksi berhasil dibuat |
| E2 | Stok bahan baku berkurang sesuai resep |
| E3 | Riwayat mutasi stok penjualan tercatat |
| E4 | Transaksi ditolak |
| E5 | Stok bahan baku tetap |
| E6 | Stok bahan baku dikembalikan |
| E7 | Status transaksi menjadi void |

## 5. Hubungan Cause dan Effect

| Aturan | Kombinasi Cause | Effect yang Diharapkan |
| --- | --- | --- |
| CE-Rule-01 | C1 + C2 + C3 + C4 + C5 + C6 | E1 + E2 + E3 |
| CE-Rule-02 | C1 benar, tetapi C2 salah | E4 + E5 |
| CE-Rule-03 | C1 benar, C2 benar, tetapi C3 salah | E4 + E5 |
| CE-Rule-04 | C1 benar, C2 benar, C3 benar, tetapi C4 salah | E4 + E5 |
| CE-Rule-05 | Produk tidak aktif atau cabang tidak sesuai | E4 + E5 |
| CE-Rule-06 | C7 terjadi pada transaksi paid | E6 + E7 |
| CE-Rule-07 | C8 terjadi | E4 + E5 |

## 6. Test Case Cause-Effect Relationship

| ID | Cause yang Diuji | Skenario Pengujian | Input Uji | Expected Effect |
| --- | --- | --- | --- | --- |
| CE-01 | C1 + C2 + C3 + C4 + C5 + C6 | Transaksi POS berhasil | Produk Kopisusu aktif, resep valid, qty `3`, stok cukup, uang Rp 50.000 | Transaksi berhasil, stok bahan berkurang, mutasi stok tercatat |
| CE-02 | C2 salah | Qty produk tidak valid | Produk aktif, qty `0`, uang cukup | Transaksi ditolak, stok tidak berubah |
| CE-03 | C3 salah | Stok bahan kurang | Sedotan tersedia `2 pcs`, kebutuhan `3 pcs` | Transaksi ditolak, stok Sedotan tetap `2 pcs` |
| CE-04 | C4 salah | Pembayaran tunai kurang | Total Rp 30.000, uang Rp 20.000 | Transaksi ditolak, stok tidak berubah |
| CE-05 | C5 salah | Produk nonaktif dijual | Produk status `inactive` | Transaksi ditolak, stok tidak berubah |
| CE-06 | C6 salah | Produk cabang berbeda dijual | Produk cabang A diproses pada cabang B | Transaksi ditolak, stok tidak berubah |
| CE-07 | C7 | Void transaksi paid | Transaksi paid Kopisusu qty `3` di-void dengan alasan valid | Status menjadi void, stok Sedotan +3, Keju +300, Sirup +30 |
| CE-08 | C8 | Kasir memproses pembayaran tanpa item | Keranjang kosong | Transaksi ditolak, stok tidak berubah |
| CE-09 | C1 salah | Admin membuat produk tanpa resep | Produk baru tanpa bahan resep | Produk ditolak, tidak tersedia untuk transaksi valid |
| CE-10 | C1 benar dan dua produk berbagi bahan | Dua produk memakai Keju | Produk A qty `1`, Produk B qty `2` | Stok Keju berkurang berdasarkan total akumulasi kedua produk |

## 7. Contoh Hubungan Sebab-Akibat Utama

Sebab:

```text
Produk Kopisusu memiliki resep:
- Sedotan 1 pcs
- Keju 100 gr
- Sirup Gula Aren 10 ml

Kasir menjual Kopisusu sebanyak 3 porsi.
Pembayaran tunai cukup.
Stok semua bahan cukup.
```

Akibat yang diharapkan:

| Akibat | Detail |
| --- | --- |
| Transaksi berhasil | Status transaksi menjadi `Paid` |
| Stok Sedotan berkurang | Dari 10 pcs menjadi 7 pcs |
| Stok Keju berkurang | Dari 1.000 gr menjadi 700 gr |
| Stok Sirup berkurang | Dari 1.500 ml menjadi 1.470 ml |
| Mutasi stok tercatat | Tipe penjualan, arah keluar |

## 8. Kriteria Keberhasilan

1. Cause valid menghasilkan effect sukses.
2. Cause tidak valid menghasilkan effect gagal.
3. Tidak ada efek pengurangan stok pada transaksi gagal.
4. Void transaksi paid mengembalikan stok sesuai pemakaian awal.
5. Hubungan sebab-akibat dapat diverifikasi melalui halaman stok dan riwayat mutasi stok.

## 9. Kesimpulan

Cause-Effect Relationship Testing cocok untuk fitur bahan baku karena proses bisnisnya berbentuk rangkaian sebab-akibat. Resep produk menjadi penyebab perhitungan bahan, transaksi berhasil menjadi penyebab pengurangan stok, dan void transaksi menjadi penyebab pengembalian stok. Dengan pengujian ini, sistem dapat dibuktikan menghasilkan output yang sesuai dengan kondisi input.
