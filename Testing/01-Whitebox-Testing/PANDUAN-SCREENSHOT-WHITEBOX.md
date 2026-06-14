# Panduan Screenshot White Box Testing Bahan Baku

## 1. Tujuan Dokumen

Dokumen ini adalah panduan sementara untuk membantu pengambilan screenshot bukti white box testing fitur bahan baku LocalesPro. Setelah screenshot selesai ditambahkan ke GitHub, dokumen ini boleh dihapus agar folder pengujian hanya berisi laporan final.

## 2. Aturan Umum Screenshot

1. Screenshot harus menunjukkan bagian kode atau aplikasi yang relevan dengan metode pengujian.
2. Jika screenshot berupa source code, pastikan nama file dan potongan fungsi terlihat.
3. Jika screenshot berupa aplikasi, pastikan halaman, data produk, stok, atau mutasi terlihat jelas.
4. Simpan screenshot di folder metode yang sesuai.
5. Gunakan nama file yang rapi dan konsisten.

## 3. Screenshot untuk README White Box

| No | Screenshot | Lokasi Simpan | Tujuan Bukti |
| --- | --- | --- | --- |
| 1 | Folder `Testing/01-Whitebox-Testing` di GitHub | `Testing/01-Whitebox-Testing/` | Membuktikan struktur metode white box |
| 2 | Folder `Source_Code` atau file backend di GitHub | `Testing/01-Whitebox-Testing/` | Membuktikan source code aplikasi tersedia |

Rekomendasi nama file:

```text
screenshot-whitebox-00-struktur-folder.png
screenshot-whitebox-00-source-code.png
```

## 4. Screenshot Desk Checking

Folder tujuan:

```text
Testing/01-Whitebox-Testing/01-Desk-Checking/
```

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Potongan kode `transactions/create.php` bagian validasi item dan pembayaran | Membuktikan desk checking memakai source code |
| 2 | Potongan kode `validateInventoryAvailabilityForCart()` | Membuktikan perhitungan kebutuhan bahan dibaca dari kode |
| 3 | Potongan kode `applyInventoryUsageForTransaction()` | Membuktikan stok berkurang melalui `delta` |
| 4 | Halaman POS saat transaksi Kopisusu qty 3 berhasil | Bukti input transaksi |
| 5 | Halaman Stok setelah transaksi | Bukti hasil pengurangan stok |

Nama file:

```text
screenshot-desk-01-validasi-item.png
screenshot-desk-02-validasi-stok.png
screenshot-desk-03-pengurangan-stok.png
screenshot-desk-04-pos-berhasil.png
screenshot-desk-05-stok-akhir.png
```

## 5. Screenshot Code Walkthrough

Folder tujuan:

```text
Testing/01-Whitebox-Testing/02-Code-Walkthrough/
```

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode `products/create.php` bagian validasi resep | Membuktikan produk wajib punya resep |
| 2 | Kode `transactions/create.php` bagian validasi item, produk, cabang, pembayaran | Membuktikan walkthrough alur transaksi |
| 3 | Kode `payment_helpers.php` bagian validasi stok | Membuktikan stok dicek sebelum transaksi selesai |
| 4 | Kode `transactions/delete.php` bagian void | Membuktikan stok dapat dikembalikan saat transaksi void |
| 5 | Halaman GitHub folder source code | Bukti file yang direview berasal dari repository aplikasi |

Nama file:

```text
screenshot-walkthrough-01-validasi-resep.png
screenshot-walkthrough-02-validasi-transaksi.png
screenshot-walkthrough-03-validasi-stok.png
screenshot-walkthrough-04-void-transaksi.png
screenshot-walkthrough-05-folder-source-code.png
```

## 6. Screenshot Control Flow Testing

Folder tujuan:

```text
Testing/01-Whitebox-Testing/03-Control-Flow-Testing/
```

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Potongan kode percabangan `items` kosong | Bukti node N2 |
| 2 | Potongan kode loop item dan validasi produk | Bukti node N5-N9 |
| 3 | Potongan kode validasi pembayaran | Bukti node N12 |
| 4 | Potongan kode validasi stok | Bukti node N13 |
| 5 | Diagram control flow yang dibuat manual | Bukti visual alur node dan edge |

Nama file:

```text
screenshot-control-01-items-kosong.png
screenshot-control-02-loop-produk.png
screenshot-control-03-pembayaran.png
screenshot-control-04-validasi-stok.png
screenshot-control-05-flowgraph.png
```

## 7. Screenshot Data Flow Testing

Folder tujuan:

```text
Testing/01-Whitebox-Testing/04-Data-Flow-Testing/
```

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode pembentukan `$normalizedItems` | Bukti data POS dibersihkan sebelum diproses |
| 2 | Kode perhitungan `$usageByIngredient` | Bukti resep dikalikan qty |
| 3 | Kode validasi `$required > $available` | Bukti stok dicek sebelum transaksi berhasil |
| 4 | Kode `$delta` dan `$stockAfter` | Bukti aliran data perubahan stok |
| 5 | Screenshot halaman Stok setelah transaksi | Bukti output data flow |

Nama file:

```text
screenshot-dataflow-01-normalized-items.png
screenshot-dataflow-02-usage-by-ingredient.png
screenshot-dataflow-03-validasi-required-available.png
screenshot-dataflow-04-delta-stockafter.png
screenshot-dataflow-05-output-stok.png
```

## 8. Screenshot Basic Path Testing

Folder tujuan:

```text
Testing/01-Whitebox-Testing/05-Basic-Path-Testing/
```

| No | Screenshot | Tujuan Bukti |
| --- | --- | --- |
| 1 | Kode fungsi `validateInventoryAvailabilityForCart()` | Bukti fungsi utama basic path |
| 2 | Potongan kode predicate node | Bukti percabangan yang dihitung |
| 3 | Diagram flow graph node N1-N20 | Bukti visual jalur eksekusi |
| 4 | Tabel Cyclomatic Complexity | Bukti perhitungan V(G) |
| 5 | Hasil uji jalur stok cukup / stok kurang | Bukti path berhasil dan gagal |

Nama file:

```text
screenshot-basicpath-01-fungsi-validasi.png
screenshot-basicpath-02-predicate-node.png
screenshot-basicpath-03-flowgraph.png
screenshot-basicpath-04-cyclomatic-complexity.png
screenshot-basicpath-05-hasil-uji-path.png
```

## 9. Screenshot Minimal Jika Waktu Terbatas

Jika waktu terbatas, minimal ambil screenshot berikut:

| Prioritas | Screenshot |
| --- | --- |
| 1 | Kode `validateInventoryAvailabilityForCart()` |
| 2 | Kode `applyInventoryUsageForTransaction()` |
| 3 | Kode `transactions/create.php` bagian validasi item, produk, pembayaran, dan stok |
| 4 | Flow graph Basic Path |
| 5 | Halaman Stok setelah transaksi berhasil |

## 10. Catatan Penghapusan

Setelah seluruh screenshot sudah ditambahkan ke folder masing-masing, file ini dapat dihapus dari repository:

```text
Testing/01-Whitebox-Testing/PANDUAN-SCREENSHOT-WHITEBOX.md
```
