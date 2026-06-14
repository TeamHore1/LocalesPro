# Black Box Testing - Boundary Value Analysis Fitur Bahan Baku LocalesPro

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
