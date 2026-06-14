# BlackBox Testing — Modul Manajemen Pengguna (Kasir)

**Endpoint:** `POST /api/auth/register_cashier.php`, `GET /api/users/registrations.php`, `POST /api/users/review.php`  
**Role:** Public (register), Admin (list/review)  
**Model:** Equivalence Partitioning, Boundary Value Analysis, Decision Table, Sample Testing

---

## 1. Equivalence Partitioning

### Domain Input — Registrasi Kasir (Public)

#### full_name

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Nama valid (3-100 karakter) | `Budi Santoso` | Sukses |
| Nama < 3 karakter | `Ab` | Gagal — 422 |
| Nama > 100 karakter | (101 karakter) | Gagal — 422 |
| Nama kosong | `""` | Gagal — 422 |
| Nama tidak dikirim | — | Gagal — 422 |

#### email

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Email valid | `budi@example.com` | Sukses |
| Email invalid (tanpa @) | `budiexample.com` | Gagal — 422 |
| Email tanpa domain | `budi@` | Gagal — 422 |
| Email kosong | `""` | Gagal — 422 |
| Email duplikat | `kasir@locales.test` | Gagal — 409 |

#### phone

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Phone valid (10-16 digit) | `081234567890` | Sukses |
| Phone < 10 digit | `08123` | Gagal — 422 |
| Phone > 16 digit | `08123456789012345` | Gagal — 422 |
| Phone dengan `+` | `+6281234567890` | Sukses (13 digit) |
| Phone kosong | `""` | Gagal — 422 |

#### username

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Username valid (4-30 char, alfanumerik ._-) | `budi_kasir` | Sukses |
| Username < 4 karakter | `ab` | Gagal — 422 |
| Username > 30 karakter | (31 karakter) | Gagal — 422 |
| Username karakter khusus | `admin!@#` | Gagal — 422 |
| Username duplikat | `kasir_local` | Gagal — 409 |

#### password

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Password kuat (≥ 8, huruf besar, kecil, angka) | `Budi1234` | Sukses |
| Password < 8 karakter | `Ab1` | Gagal — 422 |
| Password tanpa huruf besar | `budi1234` | Gagal — 422 |
| Password tanpa huruf kecil | `BUDI1234` | Gagal — 422 |
| Password tanpa angka | `Budiabcd` | Gagal — 422 |

#### branch_id

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Branch ID valid dan active | `1` | Sukses |
| Branch ID = 0 | `0` | Gagal — 422 |
| Branch ID tidak ada | `999` | Gagal — 422, "Cabang tidak tersedia" |
| Branch ID tidak dikirim | — | Gagal — 422 |
| Branch ID cabang inactive | `2` (jika inactive) | Gagal — 422 |

#### registration_note

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Note ≤ 500 karakter | `"Kasir baru cabang Cipanas"` | Sukses |
| Note > 500 karakter | (501 karakter) | Gagal — 422 |
| Note kosong | `""` | Sukses (nullable) |
| Note tidak dikirim | — | Sukses (nullable) |

### Domain Input — Review Kasir (Admin)

#### action

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Approve | `approve` | Sukses — status jadi `active` |
| Reject | `reject` | Sukses — status jadi `rejected` |
| Activate | `activate` | Sukses — status jadi `active` |
| Deactivate | `deactivate` | Sukses — status jadi `inactive` |
| Action tidak valid | `delete` | Gagal — 422 |
| Action tidak dikirim | — | Gagal — 422 |

#### review_note

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Note ≤ 500 karakter | `"Kasir diterima untuk cabang Cipanas"` | Sukses |
| Note > 500 karakter | (501 karakter) | Gagal — 422 |
| Note kosong | `""` | Sukses (nullable) |

#### branch_id (untuk approve/activate)

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Branch ID dikirim valid | `1` | Sukses — kasir ditempatkan di branch tsb |
| Branch ID tidak dikirim (user sudah punya branch) | — | Sukses — pakai branch lama |
| Branch ID = 0 | `0` | Gagal — 422 |
| Branch ID tidak ada | `999` | Gagal — 422, "Cabang tidak ditemukan" |
| Branch ID inactive | `2` (jika inactive) | Gagal — 422 |

### Domain Input — List Pendaftaran (Admin)

#### status filter

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Semua status | `all` | Semua kasir |
| Pending saja | `pending` | Hanya kasir pending |
| Active saja | `active` | Hanya kasir active |
| Rejected saja | `rejected` | Hanya kasir rejected |
| Inactive saja | `inactive` | Hanya kasir inactive |
| Status tidak valid | `unknown` | Default `all` |
| Tidak dikirim | — | Default `all` |

### Domain Input — Otorisasi

| Role | Ekspektasi Register | Ekspektasi List | Ekspektasi Review |
|------|---------------------|-----------------|-------------------|
| Public (unauthenticated) | ✅ Sukses | ❌ 401 | ❌ 401 |
| Cashier | ❌ 403 | ❌ 403 | ❌ 403 |
| Admin | ✅ (via endpoint terpisah) | ✅ Sukses | ✅ Sukses |

---

## 2. Boundary Value Analysis

### Batas Panjang Field — Registrasi

| Field | Min | Max | Test Min-1 | Test Min | Test Max | Test Max+1 |
|-------|-----|-----|-----------|---------|---------|-----------|
| `full_name` | 3 | 100 | 2 char | 3 char | 100 char | 101 char |
| `phone` | 10 | 16 | 9 digit | 10 digit | 16 digit | 17 digit |
| `username` | 4 | 30 | 3 char | 4 char | 30 char | 31 char |
| `password` | 8 | — | 7 char | 8 char | — | — |
| `registration_note` | 0 | 500 | — | — | 500 char | 501 char |
| `review_note` | 0 | 500 | — | — | 500 char | 501 char |

---

## 3. Decision Table — Review Kasir

### Kondisi (Causes)

| Kode | Kondisi |
|------|---------|
| C1 | User ID > 0 |
| C2 | User ditemukan dengan role = cashier |
| C3 | `action` valid (approve/reject/activate/deactivate) |
| C4 | Untuk approve/activate: branch_id valid dan active |
| C5 | `review_note` ≤ 500 karakter |
| C6 | User yang melakukan review adalah Admin |

### Tabel Keputusan

| Kondisi | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 | TC8 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| C1 (user_id > 0) | Y | N | Y | Y | Y | Y | Y | Y |
| C2 (cashier ditemukan) | Y | — | N | Y | Y | Y | Y | Y |
| C3 (action valid) | Y | — | — | N | Y | Y | Y | Y |
| C4 (branch valid untuk approve) | Y | — | — | — | N | Y | Y | Y |
| C5 (review_note ≤ 500) | Y | — | — | — | — | N | Y | Y |
| C6 (reviewer adalah Admin) | Y | Y | Y | Y | Y | Y | N | Y |
| **Efek** | 200 | 422 | 404 | 422 | 422 | 422 | 403 | — |

### Efek

| Kode | Efek |
|------|------|
| E1 | HTTP 200 — review berhasil, status berubah |
| E2 | HTTP 422 — input tidak valid |
| E3 | HTTP 404 — cashier tidak ditemukan |
| E4 | HTTP 403 — bukan admin |

---

## 4. Skenario Uji — Registrasi Kasir

### TC-USER-001: Registrasi Kasir Berhasil
- **Endpoint:** `POST /api/auth/register_cashier.php`
- **Auth:** Public (tanpa token)
- **Body:**
  ```json
  {
    "full_name": "Budi Santoso",
    "email": "budi@locales.test",
    "phone": "081234567890",
    "username": "budi_kasir",
    "password": "Budi1234",
    "branch_id": 1,
    "registration_note": "Kasir baru cabang Cipanas"
  }
  ```
- **Ekspektasi:** HTTP 200, `status: "success"`, `"Tunggu persetujuan admin"`

### TC-USER-002: Registrasi — Username Duplikat
- **Body:** `{ "username": "kasir_local", ... }` (sudah ada)
- **Ekspektasi:** HTTP 409, `"Username sudah dipakai."`

### TC-USER-003: Registrasi — Email Duplikat
- **Body:** `{ "email": "kasir@locales.test", ... }` (sudah ada)
- **Ekspektasi:** HTTP 409, `"Email sudah terdaftar."`

### TC-USER-004: Registrasi — Nama Terlalu Pendek
- **Body:** `{ "full_name": "Ab", ... }`
- **Ekspektasi:** HTTP 422, `"Nama lengkap harus diisi 3 sampai 100 karakter."`

### TC-USER-005: Registrasi — Nama Terlalu Panjang
- **Body:** `{ "full_name": "A" x 101, ... }`
- **Ekspektasi:** HTTP 422

### TC-USER-006: Registrasi — Email Invalid
- **Body:** `{ "email": "budi", ... }`
- **Ekspektasi:** HTTP 422, `"Email tidak valid."`

### TC-USER-007: Registrasi — Phone Terlalu Pendek
- **Body:** `{ "phone": "08123", ... }`
- **Ekspektasi:** HTTP 422, `"Nomor HP harus diisi 10 sampai 16 digit."`

### TC-USER-008: Registrasi — Phone Terlalu Panjang
- **Body:** `{ "phone": "08123456789012345", ... }`
- **Ekspektasi:** HTTP 422

### TC-USER-009: Registrasi — Username Terlalu Pendek
- **Body:** `{ "username": "ab", ... }`
- **Ekspektasi:** HTTP 422, `"Username harus 4-30 karakter"`

### TC-USER-010: Registrasi — Username Karakter Khusus
- **Body:** `{ "username": "budi@!", ... }`
- **Ekspektasi:** HTTP 422

### TC-USER-011: Registrasi — Password Lemah (< 8 Karakter)
- **Body:** `{ "password": "Ab1", ... }`
- **Ekspektasi:** HTTP 422, `"Password minimal 8 karakter."`

### TC-USER-012: Registrasi — Password Tanpa Huruf Besar
- **Body:** `{ "password": "budi1234", ... }`
- **Ekspektasi:** HTTP 422, `"Password harus mengandung minimal 1 huruf besar."`

### TC-USER-013: Registrasi — Password Tanpa Angka
- **Body:** `{ "password": "Budiabcd", ... }`
- **Ekspektasi:** HTTP 422

### TC-USER-014: Registrasi — Branch ID Tidak Valid
- **Body:** `{ "branch_id": 999, ... }`
- **Ekspektasi:** HTTP 422, `"Cabang tujuan tidak tersedia atau sedang nonaktif."`

### TC-USER-015: Registrasi — Branch ID Kosong
- **Body:** `{ "branch_id": 0, ... }`
- **Ekspektasi:** HTTP 422, `"Cabang tujuan wajib dipilih."`

### TC-USER-016: Registrasi — Registration Note Terlalu Panjang
- **Body:** `{ "registration_note": "A" x 501, ... }`
- **Ekspektasi:** HTTP 422, `"Catatan pendaftaran maksimal 500 karakter."`

---

## 5. Skenario Uji — Review Kasir (Admin)

### TC-USER-017: Approve Kasir Berhasil
- **Endpoint:** `POST /api/users/review.php`
- **Auth:** Admin
- **Body:**
  ```json
  {
    "id": 10,
    "action": "approve",
    "review_note": "Kasir diterima untuk Cabang Cipanas",
    "branch_id": 1
  }
  ```
- **Ekspektasi:** HTTP 200, `"Akun kasir berhasil disetujui."`, status jadi `active`

### TC-USER-018: Approve — User ID Tidak Ada
- **Body:** `{ "id": 999, "action": "approve", "branch_id": 1 }`
- **Ekspektasi:** HTTP 404, `"Akun kasir tidak ditemukan."`

### TC-USER-019: Approve — Branch Tidak Aktif
- **Body:** `{ "id": 10, "action": "approve", "branch_id": 999 }`
- **Ekspektasi:** HTTP 422, `"Cabang penempatan tidak ditemukan atau sedang nonaktif."`

### TC-USER-020: Reject Kasir Berhasil
- **Body:** `{ "id": 11, "action": "reject", "review_note": "Data tidak lengkap" }`
- **Ekspektasi:** HTTP 200, status jadi `rejected`

### TC-USER-021: Deactivate Kasir Berhasil
- **Body:** `{ "id": 1, "action": "deactivate", "review_note": "Kasir cuti panjang" }`
- **Ekspektasi:** HTTP 200, status jadi `inactive`

### TC-USER-022: Activate Kasir Kembali
- **Body:** `{ "id": 1, "action": "activate", "review_note": "Kasir kembali aktif", "branch_id": 1 }`
- **Ekspektasi:** HTTP 200, status jadi `active`

### TC-USER-023: Review — Action Tidak Valid
- **Body:** `{ "id": 10, "action": "delete" }`
- **Ekspektasi:** HTTP 422, `"Aksi review tidak valid."`

### TC-USER-024: Review — Cashier (Bukan Admin)
- **Auth:** Cashier token
- **Body:** `{ "id": 10, "action": "approve", "branch_id": 1 }`
- **Ekspektasi:** HTTP 403

### TC-USER-025: Review — Tanpa Token
- **Auth:** None
- **Ekspektasi:** HTTP 401

### TC-USER-026: Review — Review Note Terlalu Panjang
- **Auth:** Admin
- **Body:** `{ "id": 10, "action": "approve", "review_note": "A" x 501, "branch_id": 1 }`
- **Ekspektasi:** HTTP 422, `"Catatan review maksimal 500 karakter."`

### TC-USER-027: Approve — Cabang Tidak Dikirim (User Belum Punya Branch)
- **Body:** `{ "id": 12, "action": "approve" }` (cashier baru tanpa branch_id)
- **Ekspektasi:** HTTP 422, `"Cabang penempatan kasir wajib dipilih."`

---

## 6. Skenario Uji — List Pendaftaran Kasir

### TC-USER-028: List Pendaftaran (Semua Status)
- **Endpoint:** `GET /api/users/registrations.php`
- **Auth:** Admin
- **Ekspektasi:** HTTP 200, `data.items` berisi semua cashier, `data.counts` berisi breakdown status

### TC-USER-029: List Filter Pending
- **Query:** `?status=pending`
- **Ekspektasi:** HTTP 200, hanya cashier dengan status pending

### TC-USER-030: List Filter Active
- **Query:** `?status=active`
- **Ekspektasi:** HTTP 200, hanya cashier active

### TC-USER-031: List Filter Rejected
- **Query:** `?status=rejected`
- **Ekspektasi:** HTTP 200, hanya cashier rejected

### TC-USER-032: List Filter Inactive
- **Query:** `?status=inactive`
- **Ekspektasi:** HTTP 200, hanya cashier inactive

### TC-USER-033: List — Status Filter Tidak Valid
- **Query:** `?status=unknown`
- **Ekspektasi:** HTTP 200, default `all` — semua status

### TC-USER-034: List — Cashier (Bukan Admin)
- **Auth:** Cashier
- **Ekspektasi:** HTTP 403

### TC-USER-035: List — Tanpa Token
- **Auth:** None
- **Ekspektasi:** HTTP 401

---

## 7. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-USER-001 | Registrasi Berhasil | 200 | 🟡 | — |
| TC-USER-002 | Username Duplikat | 409 | 🟡 | — |
| TC-USER-003 | Email Duplikat | 409 | 🟡 | — |
| TC-USER-004 | Nama Terlalu Pendek | 422 | 🟡 | — |
| TC-USER-005 | Nama Terlalu Panjang | 422 | 🟡 | — |
| TC-USER-006 | Email Invalid | 422 | 🟡 | — |
| TC-USER-007 | Phone Terlalu Pendek | 422 | 🟡 | — |
| TC-USER-008 | Phone Terlalu Panjang | 422 | 🟡 | — |
| TC-USER-009 | Username Terlalu Pendek | 422 | 🟡 | — |
| TC-USER-010 | Username Karakter Khusus | 422 | 🟡 | — |
| TC-USER-011 | Password < 8 Karakter | 422 | 🟡 | — |
| TC-USER-012 | Password Tanpa Huruf Besar | 422 | 🟡 | — |
| TC-USER-013 | Password Tanpa Angka | 422 | 🟡 | — |
| TC-USER-014 | Branch ID Tidak Valid | 422 | 🟡 | — |
| TC-USER-015 | Branch ID Kosong | 422 | 🟡 | — |
| TC-USER-016 | Registration Note Terlalu Panjang | 422 | 🟡 | — |
| TC-USER-017 | Approve Kasir Berhasil | 200 | 🟡 | — |
| TC-USER-018 | Approve User ID Tidak Ada | 404 | 🟡 | — |
| TC-USER-019 | Approve Branch Tidak Aktif | 422 | 🟡 | — |
| TC-USER-020 | Reject Kasir Berhasil | 200 | 🟡 | — |
| TC-USER-021 | Deactivate Kasir Berhasil | 200 | 🟡 | — |
| TC-USER-022 | Activate Kasir Kembali | 200 | 🟡 | — |
| TC-USER-023 | Action Tidak Valid | 422 | 🟡 | — |
| TC-USER-024 | Review oleh Cashier | 403 | 🟡 | — |
| TC-USER-025 | Review Tanpa Token | 401 | 🟡 | — |
| TC-USER-026 | Review Note Terlalu Panjang | 422 | 🟡 | — |
| TC-USER-027 | Approve Tanpa Cabang | 422 | 🟡 | — |
| TC-USER-028 | List Semua Status | 200 | 🟡 | — |
| TC-USER-029 | List Filter Pending | 200 | 🟡 | — |
| TC-USER-030 | List Filter Active | 200 | 🟡 | — |
| TC-USER-031 | List Filter Rejected | 200 | 🟡 | — |
| TC-USER-032 | List Filter Inactive | 200 | 🟡 | — |
| TC-USER-033 | List Filter Tidak Valid | 200 | 🟡 | — |
| TC-USER-034 | List oleh Cashier | 403 | 🟡 | — |
| TC-USER-035 | List Tanpa Token | 401 | 🟡 | — |
