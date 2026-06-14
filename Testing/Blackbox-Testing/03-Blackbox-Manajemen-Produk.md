# BlackBox Testing — Modul Manajemen Produk

**Endpoint:** `POST /api/products/create.php`, `POST /api/products/update.php`, `POST /api/products/delete.php`, `GET /api/products/read.php`  
**Role:** Admin (create/update/delete), Authenticated (read)  
**Model:** Equivalence Partitioning, Boundary Value Analysis, Decision Table

---

## 1. Equivalence Partitioning

### Domain Input — Nama Produk

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Nama valid (1-100 karakter) | `Brown Sugar Fresh Milk` | Sukses |
| Nama kosong | `""` | Gagal — 400 |
| Nama null | (tidak dikirim) | Gagal — 400 |

### Domain Input — Harga

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Harga valid (> 0) | `15000` | Sukses |
| Harga = 0 | `0` | Gagal — tergantung validasi (numeric = true, tapi boleh) |
| Harga negatif | `-1000` | Gagal — 400 |
| Harga non-numeric | `"abc"` | Gagal — 400 |
| Harga tidak dikirim | — | Gagal — 400 |

### Domain Input — Resep (Recipe)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Resep valid (≥ 1 bahan) | `[{ ingredientId: 2, amount: 250 }]` | Sukses |
| Resep kosong | `[]` | Gagal — 400 |
| Resep tidak dikirim | — | Gagal — 400 |
| Resep dengan ingredientId = 0 | `[{ ingredientId: 0, amount: 250 }]` | Gagal — 400 |
| Resep dengan amount ≤ 0 | `[{ ingredientId: 2, amount: 0 }]` | Gagal — 400 |

### Domain Input — Otorisasi

| Role | Ekspektasi Create/Update/Delete | Ekspektasi Read |
|------|-------------------------------|-----------------|
| Admin | ✅ Sukses | ✅ Semua produk |
| Cashier | ❌ 403 | ✅ Produk sesuai cabang |
| Unauthenticated | ❌ 401 | ❌ 401 |

---

## 2. Boundary Value Analysis

### Harga

| Batas | Nilai | Ekspektasi |
|-------|-------|------------|
| Harga minimum | 1 | Sukses |
| Harga = 0 (tepat di batas bawah) | 0 | ⚠️ Bisa sukses (tidak ada validasi > 0 di backend selain is_numeric) |

### Panjang Nama

| Field | Max | Test Min | Test Max | Test Max+1 |
|-------|-----|----------|----------|------------|
| `name` | 100 | 1 char | 100 char | 101 char |

---

## 3. Decision Table — Create Product

### Kondisi (Causes)

| Kode | Kondisi |
|------|---------|
| C1 | `name` diisi dan tidak kosong |
| C2 | `price` numeric dan terisi |
| C3 | `recipe` adalah array dengan ≥ 1 item |
| C4 | Setiap item recipe punya `ingredientId` > 0 |
| C5 | Setiap item recipe punya `amount` > 0 |
| C6 | User adalah Admin |

### Tabel Keputusan

| Kondisi | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 |
|---------|-----|-----|-----|-----|-----|-----|-----|
| C1 (name valid) | Y | N | Y | Y | Y | Y | Y |
| C2 (price numeric) | Y | Y | N | Y | Y | Y | Y |
| C3 (recipe ≥ 1) | Y | Y | Y | N | Y | Y | Y |
| C4 (ingredientId > 0) | Y | — | — | — | N | Y | Y |
| C5 (amount > 0) | Y | — | — | — | — | N | Y |
| C6 (role admin) | Y | Y | Y | Y | Y | Y | N |
| **Efek** | 201 | 400 | 400 | 400 | 400 | 400 | 403 |

---

## 4. Skenario Uji

### TC-PROD-001: Tambah Produk Berhasil
- **Endpoint:** `POST /api/products/create.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "name": "Matcha Latte",
    "price": 15000,
    "category": "Milk Tea",
    "recipe": [
      { "ingredientId": 2, "amount": 250 },
      { "ingredientId": 3, "amount": 50 }
    ],
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 201, `status: "success"`, `data.id` terisi

### TC-PROD-002: Tambah Produk — Nama Kosong
- **Body:** `{ "name": "", "price": 15000, "recipe": [{ "ingredientId": 2, "amount": 250 }] }`
- **Ekspektasi:** HTTP 400

### TC-PROD-003: Tambah Produk — Harga Non-Numeric
- **Body:** `{ "name": "Test", "price": "abc", "recipe": [{ "ingredientId": 2, "amount": 250 }] }`
- **Ekspektasi:** HTTP 400

### TC-PROD-004: Tambah Produk — Resep Kosong
- **Body:** `{ "name": "Test", "price": 10000, "recipe": [] }`
- **Ekspektasi:** HTTP 400, `"Resep produk wajib diisi minimal 1 bahan."`

### TC-PROD-005: Tambah Produk — IngredientId Invalid
- **Body:** `{ "name": "Test", "price": 10000, "recipe": [{ "ingredientId": 0, "amount": 250 }] }`
- **Ekspektasi:** HTTP 400

### TC-PROD-006: Tambah Produk — Cashier
- **Auth:** Cashier
- **Ekspektasi:** HTTP 403

### TC-PROD-007: Read Produk (Admin)
- **Endpoint:** `GET /api/products/read.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, data berisi semua produk aktif

### TC-PROD-008: Read Produk (Cashier — filter cabang)
- **Auth:** Cashier (branch_id = 1)
- **Ekspektasi:** HTTP 200, hanya produk dengan branch_id = 1

### TC-PROD-009: Read Produk (Tanpa Token)
- **Ekspektasi:** HTTP 401

### TC-PROD-010: Update Produk Berhasil
- **Endpoint:** `POST /api/products/update.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "id": 6,
    "name": "Brown Sugar Fresh Milk (Updated)",
    "price": 12000,
    "category": "Milk Tea",
    "recipe": [{ "ingredientId": 2, "amount": 300 }],
    "branch_id": 1,
    "status": "active"
  }
  ```
- **Ekspektasi:** HTTP 200

### TC-PROD-011: Hapus Produk Berhasil
- **Endpoint:** `POST /api/products/delete.php`
- **Auth:** Admin
- **Body:** `{ "id": 21 }`
- **Ekspektasi:** HTTP 200

### TC-PROD-012: Hapus Produk yang Punya Riwayat Transaksi
- **Body:** `{ "id": 6 }` (produk dengan transaction_items)
- **Ekspektasi:** HTTP 409, `"Produk tidak bisa dihapus permanen karena sudah digunakan dalam transaksi."`

### TC-PROD-013: Hapus Produk — ID Tidak Ada
- **Body:** `{ "id": 999 }`
- **Ekspektasi:** HTTP 404

---

## 5. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-PROD-001 | Tambah Produk Berhasil | 201 | ✅ | — |
| TC-PROD-002 | Nama Kosong | 400 | ✅ | — |
| TC-PROD-003 | Harga Non-Numeric | 400 | ✅ | — |
| TC-PROD-004 | Resep Kosong | 400 | ✅ | — |
| TC-PROD-005 | IngredientId Invalid | 400 | ✅ | — |
| TC-PROD-006 | Cashier Create | 403 | ✅ | — |
| TC-PROD-007 | Read (Admin) | 200 | ✅ | — |
| TC-PROD-008 | Read (Cashier) | 200 | ✅ | — |
| TC-PROD-009 | Read Tanpa Token | 401 | ✅ | — |
| TC-PROD-010 | Update Berhasil | 200 | ✅ | — |
| TC-PROD-011 | Hapus Berhasil | 200 | ✅ | — |
| TC-PROD-012 | Hapus Produk Dengan Riwayat | 409 | ✅ | — |
| TC-PROD-013 | Hapus ID Tidak Ada | 404 | ✅ | — |
