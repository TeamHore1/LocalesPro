# Panduan Screenshot Grey Box Testing Bahan Baku

## 1. Tujuan Dokumen

Dokumen ini adalah panduan sementara untuk membantu pengambilan screenshot atau bukti pengujian grey box fitur bahan baku LocalesPro. Setelah bukti selesai ditambahkan ke repository atau laporan, file ini boleh dihapus agar dokumen final tetap bersih.

## 2. Prinsip Bukti Grey Box

Grey box testing membutuhkan dua jenis bukti:

| Jenis Bukti | Contoh |
| --- | --- |
| Bukti eksternal | Tampilan POS, stok, laporan transaksi, pesan error |
| Bukti internal | Query database, response API, struktur tabel, potongan endpoint/helper backend |

Idealnya, satu skenario penting memiliki bukti dari sisi aplikasi dan bukti dari sisi internal.

## 3. Screenshot Umum yang Disarankan

| No | Screenshot / Bukti | Tujuan |
| --- | --- | --- |
| 1 | Halaman produk Kopisusu dan resep bahan | Bukti produk memiliki resep |
| 2 | Halaman POS sebelum transaksi | Bukti input transaksi |
| 3 | Modal pembayaran tunai | Bukti pembayaran |
| 4 | Halaman Stok setelah transaksi | Bukti stok berkurang |
| 5 | Riwayat Mutasi Stok | Bukti mutasi `sale` tercatat |
| 6 | Laporan Transaksi status Paid | Bukti transaksi berhasil |
| 7 | Laporan Transaksi status Voided | Bukti void transaksi |
| 8 | Query database `ingredients` | Bukti internal stok |
| 9 | Query database `stock_movements` | Bukti internal mutasi |

## 4. Bukti untuk Orthogonal Array Testing

| File Bukti | Isi Bukti |
| --- | --- |
| `screenshot-oat-01-array-l9.png` | Tabel kombinasi Orthogonal Array L9 |
| `screenshot-oat-02-transaksi-valid.png` | Transaksi valid dari kombinasi OAT |
| `screenshot-oat-03-stok-kurang.png` | Kombinasi stok kurang ditolak |
| `screenshot-oat-04-cabang-berbeda.png` | Kombinasi cabang berbeda ditolak |
| `screenshot-oat-05-query-mutasi.png` | Query mutasi stok untuk kombinasi valid |

## 5. Bukti untuk Matrix Testing

| File Bukti | Isi Bukti |
| --- | --- |
| `screenshot-matrix-01-matrix-modul.png` | Matriks hubungan modul dan tabel |
| `screenshot-matrix-02-query-products.png` | Query produk dan resep |
| `screenshot-matrix-03-query-ingredients.png` | Query stok bahan |
| `screenshot-matrix-04-query-transactions.png` | Query transaksi |
| `screenshot-matrix-05-query-stock-movements.png` | Query mutasi stok |

## 6. Bukti untuk Regression Testing

| File Bukti | Isi Bukti |
| --- | --- |
| `screenshot-regression-01-login-admin.png` | Admin tetap dapat login |
| `screenshot-regression-02-produk-resep.png` | Produk dan resep tetap berjalan |
| `screenshot-regression-03-pos-paid.png` | POS transaksi paid berhasil |
| `screenshot-regression-04-stok-mutasi.png` | Stok dan mutasi tetap konsisten |
| `screenshot-regression-05-void-restore.png` | Void transaksi mengembalikan stok |

## 7. Bukti untuk Pattern Testing

| File Bukti | Isi Bukti |
| --- | --- |
| `screenshot-pattern-01-stok-habis.png` | Produk dengan stok habis ditolak / ditandai habis |
| `screenshot-pattern-02-bayar-kurang.png` | Pembayaran kurang ditolak |
| `screenshot-pattern-03-void-ulang.png` | Void ulang ditolak |
| `screenshot-pattern-04-banyak-item.png` | Cart dengan beberapa item diproses benar |
| `screenshot-pattern-05-mutasi-audit.png` | Audit mutasi stok dapat ditelusuri |

## 8. Query yang Bisa Dijadikan Bukti

```sql
SELECT id, name, stock_quantity, unit, branch_id
FROM ingredients
WHERE name IN ('Sedotan', 'Keju', 'Sirup Gula Aren');
```

```sql
SELECT id, transaction_code, total_price, payment_status, amount_paid, change_amount
FROM transactions
ORDER BY id DESC
LIMIT 5;
```

```sql
SELECT ingredient_id, movement_type, direction, quantity, stock_before, stock_after, reference_type, reference_id
FROM stock_movements
ORDER BY id DESC
LIMIT 10;
```

## 9. Catatan Penghapusan

File ini hanya panduan sementara. Setelah screenshot dan bukti selesai ditambahkan, file ini dapat dihapus:

```text
docs/grey-box-panduan-screenshot-bahan-baku.md
```
