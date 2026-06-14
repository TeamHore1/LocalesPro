# Black Box Testing - Robustness Testing Fitur Bahan Baku LocalesPro

## 1. Identitas Pengujian

| Komponen | Keterangan |
| --- | --- |
| Nama Aplikasi | LocalesPro |
| Jenis Pengujian | Black Box Testing |
| Metode | Robustness Testing |
| Fitur Utama | Ketahanan sistem terhadap input ekstrem, tidak lengkap, dan tidak normal pada fitur bahan baku dan POS |
| Aktor | Admin dan Kasir |
| Modul Terkait | Bahan Baku, Menu & Resep, POS, Stok, Laporan Transaksi |

## 2. Deskripsi Fitur yang Diuji

Robustness Testing digunakan untuk menguji kemampuan sistem menangani input yang tidak normal tanpa menyebabkan kerusakan data. Pada LocalesPro, fitur bahan baku harus tetap aman ketika pengguna memasukkan data kosong, angka negatif, qty sangat besar, stok tidak cukup, pembayaran tidak sesuai, atau melakukan aksi berulang.

Fokus pengujian adalah memastikan sistem tetap menolak input bermasalah, tidak membuat transaksi rusak, dan tidak mengurangi stok bahan baku jika transaksi tidak valid.

## 3. Tujuan Pengujian

1. Memastikan sistem tetap stabil ketika menerima input tidak normal.
2. Memastikan input ekstrem tidak menyebabkan stok bahan menjadi salah.
3. Memastikan transaksi gagal tidak meninggalkan data setengah tersimpan.
4. Memastikan sistem memberikan pesan error yang dapat dipahami pengguna.
5. Memastikan fitur pengurangan stok otomatis tetap konsisten pada kondisi tidak ideal.

## 4. Area Robustness yang Diuji

| Area | Risiko yang Diuji |
| --- | --- |
| Form bahan baku | Nama kosong, stok negatif, satuan kosong, minimum stok tidak wajar |
| Form produk dan resep | Resep kosong, bahan tidak dipilih, jumlah bahan nol/negatif, harga tidak valid |
| POS | Keranjang kosong, qty nol, qty sangat besar, stok tidak cukup |
| Pembayaran | Uang kurang, uang nol, uang sangat besar |
| Void transaksi | ID transaksi tidak valid, transaksi sudah void, alasan terlalu pendek pada frontend |
| Cabang | Produk atau bahan dari cabang berbeda |

## 5. Test Case Robustness Testing

| ID | Area | Skenario Tidak Normal | Input Uji | Expected Result |
| --- | --- | --- | --- | --- |
| RB-01 | Bahan baku | Nama bahan kosong | Nama kosong, stok `1000`, satuan `gr` | Sistem menolak input, bahan tidak tersimpan |
| RB-02 | Bahan baku | Stok awal negatif | Nama `Keju`, stok `-100`, satuan `gr` | Sistem menolak atau tidak boleh menghasilkan stok negatif |
| RB-03 | Bahan baku | Satuan kosong | Nama `Sirup`, stok `1000`, satuan kosong | Sistem menolak input atau meminta satuan diisi |
| RB-04 | Produk | Harga produk nol | Produk `Kopisusu`, harga `0`, resep valid | Sistem menolak atau transaksi tidak dapat menghasilkan total nol |
| RB-05 | Produk | Produk dibuat tanpa resep | Produk valid, resep kosong | Sistem menolak produk karena resep wajib diisi |
| RB-06 | Resep | Jumlah bahan negatif | Keju `-100 gr` | Sistem menolak resep tidak valid |
| RB-07 | Resep | Bahan resep tidak dipilih | Amount `100`, ingredient kosong | Sistem menolak atau meminta bahan dipilih |
| RB-08 | POS | Keranjang kosong dibayar | Tidak ada item | Sistem menolak transaksi kosong |
| RB-09 | POS | Qty produk nol | Kopisusu qty `0` | Sistem menolak transaksi |
| RB-10 | POS | Qty sangat besar melebihi stok | Kopisusu qty `9999` | Sistem menolak karena stok bahan tidak cukup |
| RB-11 | POS | Salah satu bahan habis | Sedotan `0 pcs`, bahan lain cukup | Produk ditandai habis atau transaksi ditolak |
| RB-12 | Pembayaran | Uang tunai nol | Total Rp 30.000, bayar Rp 0 | Sistem menolak pembayaran atau tidak memproses transaksi valid |
| RB-13 | Pembayaran | Uang tunai kurang | Total Rp 30.000, bayar Rp 20.000 | Transaksi ditolak, stok tidak berubah |
| RB-14 | Pembayaran | Uang tunai sangat besar | Total Rp 30.000, bayar Rp 1.000.000 | Transaksi berhasil, kembalian dihitung benar |
| RB-15 | Cabang | Produk dari cabang berbeda dijual | Produk cabang A, user cabang B | Transaksi ditolak, stok tidak berubah |
| RB-16 | Void | Void transaksi dengan ID tidak valid | ID transaksi `0` | Sistem menolak ID transaksi tidak valid |
| RB-17 | Void | Void transaksi yang sudah void | Transaksi status `Voided` di-void lagi | Sistem menolak atau memberi pesan transaksi sudah void |
| RB-18 | Aksi berulang | Tombol konfirmasi pembayaran ditekan berulang | Klik konfirmasi beberapa kali saat proses berjalan | Sistem hanya membuat satu transaksi dan stok hanya berkurang satu kali |

## 6. Contoh Verifikasi Robustness pada Stok

Skenario negatif:

```text
Stok awal Sedotan: 10 pcs
Produk Kopisusu membutuhkan Sedotan 1 pcs per porsi
Kasir mencoba menjual Kopisusu qty 9999
```

Expected result:

| Komponen | Expected Result |
| --- | --- |
| Status transaksi | Ditolak |
| Pesan sistem | Stok bahan tidak cukup |
| Stok Sedotan | Tetap 10 pcs |
| Riwayat mutasi stok | Tidak bertambah untuk transaksi gagal |
| Laporan transaksi | Tidak ada transaksi paid baru |

## 7. Risiko yang Dicegah

1. Stok bahan menjadi negatif.
2. Transaksi berhasil walaupun stok bahan tidak cukup.
3. Transaksi ganda karena tombol pembayaran ditekan berulang.
4. Produk tanpa resep dapat dijual tanpa pengurangan stok.
5. Data cabang tercampur antara bahan, produk, dan transaksi.
6. Void transaksi mengembalikan stok lebih dari satu kali.

## 8. Kriteria Keberhasilan

1. Sistem tidak crash saat menerima input tidak normal.
2. Sistem menolak input yang tidak sesuai aturan bisnis.
3. Stok bahan tetap konsisten setelah skenario gagal.
4. Tidak ada transaksi atau mutasi stok ganda akibat aksi berulang.
5. Pesan error membantu pengguna memahami masalah.

## 9. Kesimpulan

Robustness Testing penting untuk fitur bahan baku LocalesPro karena kesalahan input dapat berdampak langsung pada stok. Dengan pengujian ini, sistem diharapkan tetap stabil ketika menghadapi input ekstrem, tidak lengkap, atau tidak normal. Keberhasilan pengujian ditandai dengan stok yang tetap akurat, transaksi gagal yang tidak mengubah data, dan sistem yang tetap memberikan respons jelas kepada pengguna.
