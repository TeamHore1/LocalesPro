# Locales Pro

Locales Pro adalah aplikasi Point of Sale untuk operasional minuman/cafe. Project ini memakai frontend React, backend PHP, database MySQL, dan biasanya dijalankan lewat XAMPP.

## Fitur Utama

- Login multi role: admin dan kasir.
- Dashboard ringkasan penjualan, transaksi hari ini, produk terlaris, dan stok menipis.
- POS kasir dengan keranjang, pembayaran tunai, kembalian otomatis, dan cetak struk.
- Manajemen cabang.
- Manajemen produk/menu dan resep bahan baku.
- Manajemen bahan baku dan stok.
- Riwayat mutasi stok.
- Laporan transaksi dengan filter tanggal/metode dan void transaksi tunai.
- Review pendaftaran akun kasir oleh admin.

## Struktur Folder Penting

- `frontend/`: aplikasi React/Vite.
- `backend/`: API PHP untuk auth, produk, bahan, transaksi, stok, cabang, user, dan pembayaran.
- `DB/locales_db.sql`: dump database utama yang disarankan untuk import awal.
- `backend/database/`: SQL upgrade fitur tambahan.
- `backend/config/payment.local.example.php`: contoh config pembayaran lokal.
- `SKPL- LocalPro - lengkap.md`: dokumen SKPL lengkap (Markdown).
- `BlackBox/`: pengujian blackbox **fitur pembayaran** (BVA, EP, use case).
- `SKPL-assets/`: diagram use case, arsitektur, sequence, ERD.
## Menjalankan Aplikasi

1. Jalankan Apache dan MySQL dari XAMPP.
2. Import database dari `DB/locales_db.sql` ke MySQL.
3. Jika fitur upgrade belum ada, import file SQL di `backend/database/`.
4. Masuk ke folder frontend:

```bash
cd frontend
npm install
npm run dev
```

5. Buka URL Vite yang muncul di terminal.

Default API frontend mengarah ke:

```text
http://localhost/LocalesPro-v1-main/backend/api
```

Jika lokasi folder berubah, atur `VITE_API_BASE_URL` di environment frontend.

## Build Produksi

```bash
cd frontend
npm run build
```

Output build akan muncul di `frontend/dist/`. Folder ini generated, jadi aman dibuat ulang kapan saja.

## Deploy ke Hosting (Production)

Aplikasi sudah disiapkan untuk hosting shared (cPanel / Apache + PHP + MySQL).

### Paket deploy otomatis

```powershell
cd scripts
.\prepare-hosting.ps1
```

Hasil upload-ready ada di folder **`hosting-package/`**. Panduan lengkap ada di **[HOSTING.md](HOSTING.md)**.

### Checklist singkat

1. Upload isi `hosting-package/` ke `public_html`
2. Buat `backend/.env` dari `backend/.env.example` (DB + JWT secret)
3. Import `locales_db.sql` via phpMyAdmin
4. Cek `https://domainanda.com/backend/api/public/health.php`
5. Ganti password admin default setelah live

### Konfigurasi production

| File | Fungsi |
| --- | --- |
| `backend/.env` | Database, JWT secret, CORS origins |
| `frontend/.env.production` | Base path & URL API untuk build |
| `hosting/.htaccess` | SPA routing + cache asset |

## Akun dan Akses

- Admin: dashboard, cabang, akun kasir, produk, bahan, stok, laporan, POS.
- Kasir: POS, laporan, dan stok sesuai cabang yang ditetapkan.

## Status

Project sudah dirapikan agar folder lebih mudah dibaca. File generated, laporan duplikat, cache, log, dan package root yang tidak dipakai tidak perlu diedit untuk pengembangan harian.
