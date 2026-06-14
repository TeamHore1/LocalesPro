# BlackBox Testing — Modul Manajemen Bahan Baku

**Endpoint:** `POST /api/ingredients/create.php`, `POST /api/ingredients/update.php`, `POST /api/ingredients/delete.php`, `GET /api/ingredients/list.php`  
**Role:** Admin (create/update/delete), Authenticated (list)  
**Model:** Equivalence Partitioning, Boundary Value Analysis

---

## 1. Equivalence Partitioning

### Domain Input — Nama Bahan

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Nama valid (1-100 karakter) | `Susu UHT Full Cream` | Sukses |
| Nama kosong | `""` | Gagal — 400 |
| Nama null / tidak dikirim | — | Gagal — 400 |

### Domain Input — Unit

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Unit valid | `ml`, `gr`, `pcs` | Sukses |
| Unit kosong | `""` | Tergantung validasi (NULL allowed) |
| Unit tidak dikirim | — | Tergantung validasi (NULL allowed) |

### Domain Input — Stok & Min Stok

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Stok ≥ 0 | `1000` | Sukses |
| Stok negatif | `-100` | ⚠️ Mungkin sukses (tidak ada validasi negatif) |
| Stok non-numeric | `"abc"` | Gagal — 500 |
| Min stok ≥ 0 | `100` | Sukses |

### Domain Input — Otorisasi

| Role | Ekspektasi Create/Update/Delete | Ekspektasi List |
|------|-------------------------------|-----------------|
| Admin | ✅ Sukses | ✅ Semua bahan |
| Cashier | ❌ 403 | ✅ Bahan sesuai cabang |
| Unauthenticated | ❌ 401 | ❌ 401 |

---

## 2. Boundary Value Analysis

### Stok

| Batas | Nilai | Ekspektasi |
|-------|-------|------------|
| Stok minimum | 0 | Sukses |

---

## 3. Skenario Uji

### TC-INGR-001: Tambah Bahan Berhasil
- **Endpoint:** `POST /api/ingredients/create.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "name": "Gula Pasir Putih",
    "unit": "gr",
    "stock": 1000,
    "minStock": 100,
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 201, `status: "success"`, `data.id` terisi

### TC-INGR-002: Tambah Bahan — Nama Kosong
- **Body:** `{ "name": "", "unit": "gr" }`
- **Ekspektasi:** HTTP 400, `message: "Invalid input"`

### TC-INGR-003: Tambah Bahan — Cashier
- **Auth:** Cashier token
- **Body:** `{ "name": "Test", "unit": "ml" }`
- **Ekspektasi:** HTTP 403

### TC-INGR-004: Update Bahan Berhasil
- **Endpoint:** `POST /api/ingredients/update.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "id": 2,
    "name": "Susu UHT Full Cream (Updated)",
    "unit": "ml",
    "stock": 2500,
    "minStock": 500,
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 200

### TC-INGR-005: Update Bahan — ID Tidak Ada
- **Body:** `{ "id": 999, "name": "Test", "unit": "ml" }`
- **Ekspektasi:** HTTP 404, `"Bahan baku tidak ditemukan."`

### TC-INGR-006: Hapus Bahan Berhasil
- **Endpoint:** `POST /api/ingredients/delete.php`
- **Auth:** Admin
- **Body:** `{ "id": 4 }`
- **Ekspektasi:** HTTP 200

### TC-INGR-007: Hapus Bahan — Masih Dipakai di Resep
- **Body:** `{ "id": 2 }` (bahan yang ada di product_ingredients)
- **Ekspektasi:** HTTP 409, constraint error `"Tidak bisa dihapus! Bahan ini masih digunakan dalam resep menu."`

### TC-INGR-008: Hapus Bahan — ID Tidak Ada
- **Body:** `{ "id": 999 }`
- **Ekspektasi:** HTTP 200 (0 row affected)

### TC-INGR-009: List Bahan (Admin)
- **Endpoint:** `GET /api/ingredients/list.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, data semua bahan

### TC-INGR-010: List Bahan (Cashier — filter cabang)
- **Auth:** Cashier (branch_id = 1)
- **Ekspektasi:** HTTP 200, hanya bahan dengan branch_id = 1

### TC-INGR-011: List Bahan (Tanpa Token)
- **Ekspektasi:** HTTP 401

---

## 4. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-INGR-001 | Tambah Bahan Berhasil | 201 | ✅ | — |
| TC-INGR-002 | Nama Kosong | 400 | ✅ | — |
| TC-INGR-003 | Cashier Create | 403 | ✅ | — |
| TC-INGR-004 | Update Berhasil | 200 | ✅ | — |
| TC-INGR-005 | Update ID Tidak Ada | 404 | ✅ | — |
| TC-INGR-006 | Hapus Berhasil | 200 | ✅ | — |
| TC-INGR-007 | Hapus Bahan Dipakai Resep | 409 | ✅ | — |
| TC-INGR-008 | Hapus ID Tidak Ada | 200 | ⚠️ | 0 row affected |
| TC-INGR-009 | List (Admin) | 200 | ✅ | — |
| TC-INGR-010 | List (Cashier) | 200 | ✅ | — |
| TC-INGR-011 | List Tanpa Token | 401 | ✅ | — |
