# BlackBox Testing — Modul Transaksi Penjualan

**Endpoint:** `POST /api/transactions/create.php`, `GET /api/transactions/history.php`, `POST /api/transactions/delete.php`  
**Role:** Authenticated (cashier/admin)  
**Model:** Boundary Value Analysis, Decision Table, Cause-Effect

---

## 1. Equivalence Partitioning

### Domain Input — Items (Array Produk)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Items valid (≥ 1 item) | `[{ "id": 6, "qty": 2 }]` | Sukses |
| Items kosong | `[]` | Gagal — 422 |
| Items null / tidak dikirim | — | Gagal — 422 |
| Item dengan id = 0 | `[{ "id": 0, "qty": 1 }]` | Gagal — 422 |
| Item dengan qty = 0 | `[{ "id": 6, "qty": 0 }]` | Gagal — 422 |
| Item dengan qty negatif | `[{ "id": 6, "qty": -1 }]` | Gagal — 422 |

### Domain Input — Metode Pembayaran

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Cash | `Cash` | Sukses |
| Tidak dikirim | — | Default `Cash` — Sukses |

### Domain Input — Jumlah Dibayar (amount_paid)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| amount_paid = 0 (tidak dikirim) | `0` | Default = total_price — Sukses |
| amount_paid ≥ total_price | `50000` (total 30000) | Sukses |
| amount_paid < total_price (Cash) | `20000` (total 30000) | Gagal — 422 |

### Domain Input — Ketersediaan Stok Bahan

| Kelas | Ekspektasi |
|-------|------------|
| Stok bahan cukup untuk semua item | Sukses |
| Stok bahan tidak cukup untuk salah satu item | Gagal — 422, pesan stok tidak cukup |

---

## 2. Boundary Value Analysis

### Jumlah Item

| Batas | Nilai | Ekspektasi |
|-------|-------|------------|
| Minimum item | 1 | Sukses |
| 0 item | 0 | Gagal — 422 |

### Jumlah Dibayar (Cash)

| Kondisi | amount_paid | total_price | Ekspektasi |
|---------|-------------|-------------|------------|
| Tepat sama | 30000 | 30000 | Sukses, change = 0 |
| Lebih 1 rupiah | 30001 | 30000 | Sukses, change = 1 |
| Kurang 1 rupiah | 29999 | 30000 | Gagal — 422 |

---

## 3. Decision Table — Create Transaction

### Kondisi (Causes)

| Kode | Kondisi |
|------|---------|
| C1 | Items array tidak kosong |
| C2 | Semua item punya id > 0 |
| C3 | Semua item punya qty > 0 |
| C4 | Semua produk tersedia (status active) |
| C5 | Semua produk sesuai cabang |
| C6 | Stok bahan cukup |
| C7 | amount_paid ≥ total_price (jika Cash) |
| C8 | User terautentikasi |

### Tabel Keputusan

| Kondisi | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 | TC8 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| C1 | Y | N | Y | Y | Y | Y | Y | Y |
| C2 | Y | — | N | Y | Y | Y | Y | Y |
| C3 | Y | — | — | N | Y | Y | Y | Y |
| C4 | Y | — | — | — | N | Y | Y | Y |
| C5 | Y | — | — | — | — | N | Y | Y |
| C6 | Y | — | — | — | — | — | N | Y |
| C7 | Y | — | — | — | — | — | — | Y |
| C8 | Y | Y | Y | Y | Y | Y | Y | N |
| **Efek** | 201 | 422 | 422 | 422 | 422 | 422 | 422 | 401 |

---

## 4. Cause-Effect — Void Transaksi

### Node Sebab (Cause)

| Kode | Kondisi |
|------|---------|
| C1 | Transaction ID valid |
| C2 | Transaksi ditemukan |
| C3 | Transaksi belum di-void |
| C4 | User memiliki akses ke cabang transaksi |
| C5 | Payment status sebelumnya = `Paid` (untuk restore stok) |

### Node Akibat (Effect)

| Kode | Efek |
|------|------|
| E1 | Status berubah menjadi `Voided` |
| E2 | Stok bahan dikembalikan |
| E3 | HTTP 422 — transaksi sudah void |
| E4 | HTTP 403 — akses cabang tidak valid |
| E5 | HTTP 404 — transaksi tidak ditemukan |

---

## 5. Skenario Uji

### TC-TRX-001: Transaksi Berhasil (Cash, Stok Cukup)
- **Endpoint:** `POST /api/transactions/create.php`
- **Auth:** Cashier/Admin
- **Body:**
  ```json
  {
    "items": [{ "id": 6, "qty": 1 }],
    "payment_method": "Cash",
    "amount_paid": 10000,
    "customer_name": "Andi",
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 200, `status: "success"`, `data.transaction_code` terisi, stok bahan berkurang

### TC-TRX-002: Transaksi — Items Kosong
- **Body:** `{ "items": [] }`
- **Ekspektasi:** HTTP 422, `"Item transaksi tidak boleh kosong."`

### TC-TRX-003: Transaksi — Produk Tidak Aktif
- **Body:** `{ "items": [{ "id": 21, "qty": 1 }] }` (produk inactive)
- **Ekspektasi:** HTTP 422, `"Produk dengan ID 21 tidak tersedia."`

### TC-TRX-004: Transaksi — Stok Bahan Tidak Cukup
- **Body:** `{ "items": [{ "id": 6, "qty": 999 }] }` (melebihi stok bahan)
- **Ekspektasi:** HTTP 422, pesan stok tidak cukup

### TC-TRX-005: Transaksi — Uang Kurang (Cash)
- **Body:**
  ```json
  {
    "items": [{ "id": 6, "qty": 1 }],
    "amount_paid": 5000
  }
  ```
- **Ekspektasi:** HTTP 422, `"Uang tunai yang diterima kurang dari total tagihan."`

### TC-TRX-006: Transaksi — Tanpa Token
- **Ekspektasi:** HTTP 401

### TC-TRX-007: Riwayat Transaksi (Admin)
- **Endpoint:** `GET /api/transactions/history.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, semua transaksi dari semua cabang

### TC-TRX-008: Riwayat Transaksi (Cashier)
- **Auth:** Cashier (branch_id = 1)
- **Ekspektasi:** HTTP 200, hanya transaksi cabang sendiri

### TC-TRX-009: Void Transaksi Berhasil
- **Endpoint:** `POST /api/transactions/delete.php`
- **Auth:** Cashier/Admin
- **Body:** `{ "id": 13, "void_reason": "Pesanan dibatalkan pelanggan" }`
- **Ekspektasi:** HTTP 200, `payment_status` berubah jadi `Voided`, stok dikembalikan

### TC-TRX-010: Void Transaksi — Sudah Pernah Void
- **Body:** `{ "id": 13 }` (transaksi yang sudah di-void)
- **Ekspektasi:** HTTP 422, `"Transaksi ini sudah berstatus void."`

### TC-TRX-011: Void Transaksi — Cashier dari Cabang Lain
- **Auth:** Cashier branch_id = 12, void transaksi branch_id = 1
- **Body:** `{ "id": 1 }`
- **Ekspektasi:** HTTP 403, `"Akses transaksi lintas cabang tidak diizinkan."`

---

## 6. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-TRX-001 | Transaksi Berhasil | 200 | ✅ | — |
| TC-TRX-002 | Items Kosong | 422 | ✅ | — |
| TC-TRX-003 | Produk Tidak Aktif | 422 | ✅ | — |
| TC-TRX-004 | Stok Tidak Cukup | 422 | ✅ | — |
| TC-TRX-005 | Uang Kurang | 422 | ✅ | — |
| TC-TRX-006 | Tanpa Token | 401 | ✅ | — |
| TC-TRX-007 | Riwayat (Admin) | 200 | ✅ | — |
| TC-TRX-008 | Riwayat (Cashier) | 200 | ✅ | — |
| TC-TRX-009 | Void Berhasil | 200 | ✅ | — |
| TC-TRX-010 | Void Ulang | 422 | ✅ | — |
| TC-TRX-011 | Void Lintas Cabang | 403 | ✅ | — |
