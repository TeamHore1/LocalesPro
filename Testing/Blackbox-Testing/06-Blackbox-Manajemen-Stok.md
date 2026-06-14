# BlackBox Testing — Modul Manajemen Stok

**Endpoint:** `POST /api/stock_movements/create.php`, `GET /api/stock_movements/list.php`  
**Role:** Admin, Cashier (create/list)  
**Model:** Equivalence Partitioning, Boundary Value Analysis, Decision Table

---

## 1. Equivalence Partitioning

### Domain Input — ingredient_id

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| ID valid (bahan tersedia) | `2` | Sukses |
| ID = 0 | `0` | Gagal — 400 |
| ID negatif | `-1` | Gagal — 400 |
| ID tidak ada di database | `999` | Gagal — 404, "Bahan baku tidak ditemukan." |
| ID tidak dikirim | (tidak ada key `ingredient_id`) | Gagal — 400 |
| ID non-numeric | `"abc"` | Gagal — 500 |

### Domain Input — quantity

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Quantity > 0 | `500` | Sukses |
| Quantity = 0 | `0` | Gagal — 400 |
| Quantity negatif | `-100` | Gagal — 400 |
| Quantity tidak dikirim | (tidak ada key `quantity`) | Gagal — 400 |
| Quantity non-numeric | `"abc"` | Gagal — 500 |
| Quantity desimal | `250.50` | Sukses (dibulatkan 2 desimal) |

### Domain Input — branch_id (Opsional)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Branch ID sesuai user (cashier) | — | Otomatis pakai branch user |
| Branch ID dikirim = cabang berbeda (cashier) | `2` padahal user di branch 1 | Gagal — 403 |
| Branch ID dikirim valid (admin) | `1` | Sukses |
| Branch ID tidak dikirim (admin tanpa branch default) | — | Gagal — 403 |

### Domain Input — notes (Opsional)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Notes diisi | `"Stok tambahan untuk promo"` | Sukses |
| Notes kosong | `""` | Sukses — pakai default note |
| Notes tidak dikirim | — | Sukses — pakai default note |

### Domain Input — Otorisasi

| Role | Ekspektasi Create | Ekspektasi List |
|------|-------------------|-----------------|
| Admin | ✅ Sukses (bisa pilih cabang) | ✅ Semua cabang |
| Cashier | ✅ Sukses (cabang sendiri) | ✅ Hanya cabang sendiri |
| Unauthenticated | ❌ 401 | ❌ 401 |

---

## 2. Boundary Value Analysis

### Quantity

| Batas | Nilai | Ekspektasi |
|-------|-------|------------|
| Minimum quantity | 0.01 (pembulatan) | Sukses |
| Tepat 0 | 0 | Gagal — 400 |
| Quantity besar (1000000) | 1000000 | Sukses (tergantung kapasitas kolom) |

### ingredient_id

| Batas | Nilai | Ekspektasi |
|-------|-------|------------|
| Minimum valid | 1 | Sukses |
| Tepat 0 | 0 | Gagal — 400 |

---

## 3. Decision Table — Create Stock Movement (Stock In)

### Kondisi (Causes)

| Kode | Kondisi |
|------|---------|
| C1 | ingredient_id > 0 |
| C2 | quantity > 0 |
| C3 | Bahan ditemukan di database |
| C4 | Bahan milik cabang yang diotorisasi user |
| C5 | User memiliki akses ke cabang (admin/cashier sesuai) |

### Tabel Keputusan

| Kondisi | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 | TC8 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| C1 (ingredient_id > 0) | Y | N | Y | Y | Y | Y | Y | Y |
| C2 (quantity > 0) | Y | — | N | Y | Y | Y | Y | Y |
| C3 (bahan ditemukan) | Y | — | — | N | Y | Y | Y | Y |
| C4 (bahan sesuai cabang) | Y | — | — | — | N | Y | Y | Y |
| C5 (user punya akses) | Y | Y | Y | Y | Y | N | Y | Y |
| **Efek** | 201 | 400 | 400 | 404 | 403 | 403 | 401 | — |

### Efek

| Kode | Efek |
|------|------|
| E1 | HTTP 201 — stok masuk tercatat |
| E2 | HTTP 400 — input tidak valid |
| E3 | HTTP 404 — bahan tidak ditemukan |
| E4 | HTTP 403 — bahan/user tidak sesuai cabang |
| E5 | HTTP 401 — tidak terautentikasi |

---

## 4. Skenario Uji — Stok Masuk (Stock In)

### TC-STOCK-001: Stok Masuk Berhasil (Admin)
- **Endpoint:** `POST /api/stock_movements/create.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "ingredient_id": 2,
    "quantity": 500,
    "notes": "Stok tambahan untuk promo akhir pekan",
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 201, `status: "success"`, `data.stock_after` = stock_before + 500

### TC-STOCK-002: Stok Masuk Berhasil (Cashier)
- **Auth:** Cashier (branch_id = 1)
- **Body:**
  ```json
  {
    "ingredient_id": 2,
    "quantity": 200
  }
  ```
- **Ekspektasi:** HTTP 201, stok bertambah 200

### TC-STOCK-003: Stok Masuk — ingredient_id = 0
- **Body:** `{ "ingredient_id": 0, "quantity": 100 }`
- **Ekspektasi:** HTTP 400, `"Pilih bahan dan masukkan jumlah stok masuk yang valid."`

### TC-STOCK-004: Stok Masuk — quantity = 0
- **Body:** `{ "ingredient_id": 2, "quantity": 0 }`
- **Ekspektasi:** HTTP 400

### TC-STOCK-005: Stok Masuk — quantity Negatif
- **Body:** `{ "ingredient_id": 2, "quantity": -50 }`
- **Ekspektasi:** HTTP 400

### TC-STOCK-006: Stok Masuk — Bahan Tidak Ditemukan
- **Body:** `{ "ingredient_id": 999, "quantity": 100 }`
- **Ekspektasi:** HTTP 404, `"Bahan baku tidak ditemukan."`

### TC-STOCK-007: Stok Masuk — Bahan dari Cabang Berbeda (Admin)
- **Auth:** Admin
- **Body:** `{ "ingredient_id": 2, "quantity": 100, "branch_id": 5 }` (bahan id=2 milik branch 1)
- **Ekspektasi:** HTTP 403, `"Bahan baku tidak tersedia untuk cabang aktif."`

### TC-STOCK-008: Stok Masuk — Cashier Cabang Lain
- **Auth:** Cashier (branch_id = 5)
- **Body:** `{ "ingredient_id": 2, "quantity": 100, "branch_id": 1 }`
- **Ekspektasi:** HTTP 403, `"Kasir hanya boleh mengakses cabangnya sendiri."`

### TC-STOCK-009: Stok Masuk — Tanpa Token
- **Auth:** None
- **Ekspektasi:** HTTP 401

---

## 5. Skenario Uji — Riwayat Mutasi Stok (List)

### TC-STOCK-010: List Riwayat (Admin — Semua Cabang)
- **Endpoint:** `GET /api/stock_movements/list.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, data mencakup semua cabang

### TC-STOCK-011: List Riwayat (Cashier — Filter Cabang Sendiri)
- **Auth:** Cashier (branch_id = 1)
- **Ekspektasi:** HTTP 200, data hanya cabang id = 1

### TC-STOCK-012: List Riwayat — Filter ingredient_id
- **Auth:** Admin
- **Query:** `?ingredient_id=2`
- **Ekspektasi:** HTTP 200, hanya mutasi untuk ingredient_id = 2

### TC-STOCK-013: List Riwayat — Filter branch_id (Admin)
- **Auth:** Admin
- **Query:** `?branch_id=1`
- **Ekspektasi:** HTTP 200, hanya mutasi branch id = 1

### TC-STOCK-014: List Riwayat — Cashier Cabang Lain via Parameter
- **Auth:** Cashier (branch_id = 1)
- **Query:** `?branch_id=2`
- **Ekspektasi:** HTTP 403, `"Kasir hanya boleh mengakses cabangnya sendiri."`

### TC-STOCK-015: List Riwayat — Tanpa Token
- **Ekspektasi:** HTTP 401

### TC-STOCK-016: List Riwayat — Limit Parameter
- **Auth:** Admin
- **Query:** `?limit=5`
- **Ekspektasi:** HTTP 200, maksimal 5 record

### TC-STOCK-017: List Riwayat — Limit Melebihi Maks
- **Auth:** Admin
- **Query:** `?limit=999`
- **Ekspektasi:** HTTP 200, terbatas 200 record (maks)

---

## 6. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-STOCK-001 | Stok Masuk Admin Berhasil | 201 | 🟡 | — |
| TC-STOCK-002 | Stok Masuk Cashier Berhasil | 201 | 🟡 | — |
| TC-STOCK-003 | ingredient_id = 0 | 400 | 🟡 | — |
| TC-STOCK-004 | quantity = 0 | 400 | 🟡 | — |
| TC-STOCK-005 | quantity Negatif | 400 | 🟡 | — |
| TC-STOCK-006 | Bahan Tidak Ditemukan | 404 | 🟡 | — |
| TC-STOCK-007 | Bahan Cabang Berbeda | 403 | 🟡 | — |
| TC-STOCK-008 | Cashier Cabang Lain | 403 | 🟡 | — |
| TC-STOCK-009 | Tanpa Token | 401 | 🟡 | — |
| TC-STOCK-010 | List (Admin) | 200 | 🟡 | — |
| TC-STOCK-011 | List (Cashier) | 200 | 🟡 | — |
| TC-STOCK-012 | List Filter ingredient_id | 200 | 🟡 | — |
| TC-STOCK-013 | List Filter branch_id | 200 | 🟡 | — |
| TC-STOCK-014 | Cashier Cabang Lain (List) | 403 | 🟡 | — |
| TC-STOCK-015 | List Tanpa Token | 401 | 🟡 | — |
| TC-STOCK-016 | List Limit 5 | 200 | 🟡 | — |
| TC-STOCK-017 | List Limit 999 | 200 | 🟡 | — |
