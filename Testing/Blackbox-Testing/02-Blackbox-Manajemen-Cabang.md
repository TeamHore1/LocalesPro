# BlackBox Testing — Modul Manajemen Cabang

**Endpoint:** `POST /api/branches/create.php`, `POST /api/branches/update.php`, `POST /api/branches/delete.php`, `GET /api/branches/list.php`  
**Role:** Admin (create/update/delete), Authenticated (list)  
**Model:** Equivalence Partitioning, Boundary Value Analysis

---

## 1. Equivalence Partitioning

### Domain Input — Nama Cabang

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Nama valid (string 1-100 karakter) | `Locales - Cipanas` | Sukses |
| Nama kosong | `""` | Gagal — 422 |
| Nama null / tidak dikirim | (tidak ada key `name`) | Gagal — 422 |

### Domain Input — Alamat

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Alamat valid | `Jl. Nasional III Cianjur` | Sukses |
| Alamat kosong | `""` | Gagal — 422 |

### Domain Input — Status

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Status valid — active | `active` | Sukses |
| Status valid — inactive | `inactive` | Sukses |
| Status tidak dikirim | (tidak ada key `status`) | Default `active` — Sukses |

### Domain Input — Otorisasi

| Role | Ekspektasi Create/Update/Delete | Ekspektasi List |
|------|-------------------------------|-----------------|
| Admin | ✅ Sukses | ✅ Semua cabang |
| Cashier | ❌ 403 | ✅ Hanya cabang sendiri |
| Unauthenticated | ❌ 401 | ❌ 401 |

---

## 2. Boundary Value Analysis

### Batas Panjang Field

| Field | Min | Max | Test Min | Test Max | Test Max+1 |
|-------|-----|-----|----------|----------|------------|
| `name` | 1 | 100 | 1 char | 100 char | 101 char |
| `phone` | 0 | 15 | 0 (kosong) | 15 char | 16 char |

---

## 3. Skenario Uji

### TC-BRANCH-001: Tambah Cabang Berhasil
- **Endpoint:** `POST /api/branches/create.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "name": "Locales - Cipanas",
    "address": "Jl. Nasional III, Cianjur",
    "phone": "081234567890",
    "status": "active"
  }
  ```
- **Ekspektasi:** HTTP 200, `status: "success"`

### TC-BRANCH-002: Tambah Cabang — Data Tidak Lengkap
- **Body:**
  ```json
  { "name": "", "address": "" }
  ```
- **Ekspektasi:** HTTP 422, `message: "Data tidak lengkap"`

### TC-BRANCH-003: Tambah Cabang — Role Cashier
- **Auth:** Cashier token
- **Body:** `{ "name": "Cabang Baru", "address": "Alamat" }`
- **Ekspektasi:** HTTP 403

### TC-BRANCH-004: Tambah Cabang — Tanpa Token
- **Auth:** None
- **Ekspektasi:** HTTP 401

### TC-BRANCH-005: Update Cabang Berhasil
- **Endpoint:** `POST /api/branches/update.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "id": 1,
    "name": "Locales - Cipanas Updated",
    "address": "Alamat baru",
    "phone": "081234567890",
    "status": "active"
  }
  ```
- **Ekspektasi:** HTTP 200

### TC-BRANCH-006: Update Cabang — ID Tidak Ada
- **Body:** `{ "id": 999, "name": "Test", "address": "Alamat" }`
- **Ekspektasi:** HTTP 200 (tidak error, 0 row affected)

### TC-BRANCH-007: Hapus Cabang Berhasil
- **Endpoint:** `POST /api/branches/delete.php`
- **Auth:** Admin
- **Body:** `{ "id": 2 }`
- **Ekspektasi:** HTTP 200

### TC-BRANCH-008: Hapus Cabang — ID Tidak Ada
- **Body:** `{ "id": 999 }`
- **Ekspektasi:** HTTP 200 (0 row affected — warning)

### TC-BRANCH-009: List Semua Cabang (Admin)
- **Endpoint:** `GET /api/branches/list.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, array data mencakup semua cabang

### TC-BRANCH-010: List Cabang (Cashier — filter sendiri)
- **Auth:** Cashier yang terdaftar di branch_id = 1
- **Ekspektasi:** HTTP 200, data hanya cabang dengan id = 1

### TC-BRANCH-011: List Cabang (Cashier tanpa branch)
- **Auth:** Cashier tanpa branch_id
- **Ekspektasi:** HTTP 403, `"Akun kasir belum terhubung ke cabang."`

---

## 4. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-BRANCH-001 | Tambah Cabang Berhasil | 200 | ✅ | — |
| TC-BRANCH-002 | Data Tidak Lengkap | 422 | ✅ | — |
| TC-BRANCH-003 | Role Cashier | 403 | ✅ | — |
| TC-BRANCH-004 | Tanpa Token | 401 | ✅ | — |
| TC-BRANCH-005 | Update Berhasil | 200 | ✅ | — |
| TC-BRANCH-006 | Update ID Tidak Ada | 200 | ⚠️ | Tidak error, tapi 0 row affected |
| TC-BRANCH-007 | Hapus Berhasil | 200 | ✅ | — |
| TC-BRANCH-008 | Hapus ID Tidak Ada | 200 | ⚠️ | Tidak error, tapi 0 row affected |
| TC-BRANCH-009 | List Semua (Admin) | 200 | ✅ | — |
| TC-BRANCH-010 | List Filter Cashier | 200 | ✅ | — |
| TC-BRANCH-011 | Cashier Tanpa Branch | 403 | ✅ | — |
