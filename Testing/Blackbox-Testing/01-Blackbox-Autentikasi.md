# BlackBox Testing — Modul Autentikasi & Login

**Endpoint:** `POST /api/auth/login.php` & `POST /api/auth/register_cashier.php`  
**Role:** Admin, Cashier (Public untuk register)  
**Model:** Equivalence Partitioning, Boundary Value Analysis, Cause-Effect

---

## 1. Equivalence Partitioning — Login

### Domain Input Username

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Username valid (4-30 karakter, alfanumerik ._-) | `ilham_admin` | Sukses login |
| Username terlalu pendek (< 4) | `ab` | Gagal — validasi frontend |
| Username terlalu panjang (> 30) | `abcdefghijklmnopqrstuvwxyz123456` | Gagal — validasi frontend |
| Username karakter khusus | `admin@!` | Gagal — validasi frontend |
| Username tidak terdaftar | `nonexistent` | Gagal — 401 |
| Username kosong | `""` | Gagal — 422 |

### Domain Input Password

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Password benar | `Admin123` (untuk user admin) | Sukses login |
| Password salah | `wrongpass` | Gagal — 401 |
| Password kosong | `""` | Gagal — 422 |

### Domain Input Requested Role

| Kelas | Contoh Nilai | Ekspektasi |
|-------|-------------|------------|
| Role valid — cashier | `cashier` | Login mode kasir |
| Role valid — dashboard | `dashboard` | Login mode admin |
| Role tidak valid | `superadmin` | Gagal — 422 |

---

## 2. Boundary Value Analysis — Login

### Batas Jumlah Percobaan Login (Rate Limiting)

| Test Case | Input | Ekspektasi |
|-----------|-------|------------|
| 1-5 percobaan gagal berturut-turut | Username benar, password salah ×5 | Setiap percobaan: 401 |
| Percobaan ke-6 (melebihi batas) | Username benar, password salah ×6 | 429 — terkunci 15 menit |
| Percobaan setelah lock expired | Login benar setelah 15 menit | Sukses — 200 |

### Batas Panjang Field Registrasi

| Field | Min | Max | Test Min-1 | Test Min | Test Max | Test Max+1 |
|-------|-----|-----|-----------|---------|---------|-----------|
| `full_name` | 3 | 100 | 2 char | 3 char | 100 char | 101 char |
| `phone` | 10 | 16 | 9 digit | 10 digit | 16 digit | 17 digit |
| `username` | 4 | 30 | 3 char | 4 char | 30 char | 31 char |
| `password` | 8 | — | 7 char | 8 char | — | — |
| `registration_note` | 0 | 500 | — | — | 500 char | 501 char |

---

## 3. Cause-Effect — Login

### Diagram Sebab-Akibat

| Node Sebab (Cause) | Deskripsi |
|--------------------|-----------|
| C1 | Username & password diisi |
| C2 | Username terdaftar |
| C3 | Password cocok |
| C4 | Role yang diminta valid |
| C5 | User status = `active` |
| C6 | Role user sesuai requested_role |
| C7 | Tidak dalam kondisi rate-limited |

| Node Akibat (Effect) | Deskripsi |
|---------------------|-----------|
| E1 | Respon 401 — kredensial salah |
| E2 | Respon 422 — input tidak valid |
| E3 | Respon 429 — rate limited |
| E4 | Respon 403 — role/status mismatch |
| E5 | Respon 200 — login sukses + token JWT |

### Tabel Keputusan

| Kondisi | TC1 | TC2 | TC3 | TC4 | TC5 | TC6 | TC7 | TC8 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| C1 (input diisi) | Y | N | Y | Y | Y | Y | Y | Y |
| C2 (username terdaftar) | Y | — | N | Y | Y | Y | Y | Y |
| C3 (password cocok) | Y | — | — | N | Y | Y | Y | Y |
| C4 (role valid) | Y | — | Y | Y | N | Y | Y | Y |
| C5 (status active) | Y | — | — | — | — | N | Y | Y |
| C6 (role sesuai) | Y | — | — | — | — | — | N | Y |
| C7 (tidak rate-limited) | Y | — | Y | Y | Y | Y | Y | N |
| **E1** (401) | | | ✓ | ✓ | | | | |
| **E2** (422) | | ✓ | | | ✓ | | | |
| **E3** (429) | | | | | | | | ✓ |
| **E4** (403) | | | | | | ✓ | ✓ | |
| **E5** (200 + token) | ✓ | | | | | | | |

---

## 4. Skenario Uji — Login

### TC-AUTH-001: Login Admin Berhasil
- **Endpoint:** `POST /api/auth/login.php`
- **Body:**
  ```json
  { "username": "ilham_admin", "password": "Admin123", "requested_role": "dashboard" }
  ```
- **Ekspektasi:** HTTP 200, `status: "success"`, field `data.token` ada

### TC-AUTH-002: Login Kasir Berhasil
- **Body:**
  ```json
  { "username": "kasir_local", "password": "Kasir123", "requested_role": "cashier" }
  ```
- **Ekspektasi:** HTTP 200, role = `cashier`

### TC-AUTH-003: Password Salah
- **Body:**
  ```json
  { "username": "ilham_admin", "password": "wrongpass", "requested_role": "dashboard" }
  ```
- **Ekspektasi:** HTTP 401, `message` berisi info gagal login

### TC-AUTH-004: Username Tidak Terdaftar
- **Body:**
  ```json
  { "username": "nonexistent", "password": "AnyPass123", "requested_role": "cashier" }
  ```
- **Ekspektasi:** HTTP 401

### TC-AUTH-005: Input Kosong
- **Body:**
  ```json
  { "username": "", "password": "", "requested_role": "cashier" }
  ```
- **Ekspektasi:** HTTP 422, `message: "Username dan password wajib diisi."`

### TC-AUTH-006: Role Tidak Valid
- **Body:**
  ```json
  { "username": "ilham_admin", "password": "Admin123", "requested_role": "superadmin" }
  ```
- **Ekspektasi:** HTTP 422, `message: "Mode login tidak valid."`

### TC-AUTH-007: Admin Login Mode Kasir
- **Body:**
  ```json
  { "username": "ilham_admin", "password": "Admin123", "requested_role": "cashier" }
  ```
- **Ekspektasi:** HTTP 403, `message: "Akun ini tidak punya akses ke mode kasir."`

### TC-AUTH-008: Kasir Login Mode Admin
- **Body:**
  ```json
  { "username": "kasir_local", "password": "Kasir123", "requested_role": "dashboard" }
  ```
- **Ekspektasi:** HTTP 403, `message: "Akun ini tidak punya akses ke mode admin."`

### TC-AUTH-009: Rate Limiting — 6 Kali Gagal Berturut-turut
- **Prosedur:**
  1. Kirim login dengan password salah sebanyak 6 kali
  2. Kirim login dengan password benar
- **Ekspektasi:** Percobaan ke-6: HTTP 429. Percobaan ke-7 (dengan password benar): HTTP 429 (masih terkunci).

---

## 5. Skenario Uji — Registrasi Kasir

### TC-AUTH-010: Registrasi Kasir Berhasil
- **Endpoint:** `POST /api/auth/register_cashier.php`
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
- **Ekspektasi:** HTTP 200, `status: "success"`

### TC-AUTH-011: Registrasi — Username Duplikat
- **Body:** Seperti TC-AUTH-010 dengan `username: "kasir_local"`
- **Ekspektasi:** HTTP 409, `message: "Username sudah dipakai."`

### TC-AUTH-012: Registrasi — Email Duplikat
- **Body:** Seperti TC-AUTH-010 dengan `email: "kasir@locales.test"`
- **Ekspektasi:** HTTP 409, `message: "Email sudah terdaftar."`

### TC-AUTH-013: Registrasi — Password Lemah
- **Body:** Seperti TC-AUTH-010 dengan `password: "123"`
- **Ekspektasi:** HTTP 422, berisi validasi password

### TC-AUTH-014: Registrasi — Branch Tidak Aktif
- **Body:** Seperti TC-AUTH-010 dengan `branch_id: 999`
- **Ekspektasi:** HTTP 422

---

## 6. Hasil Pengujian

| Kode | Nama Skenario | HTTP Code | Status | Catatan |
|------|--------------|-----------|--------|---------|
| TC-AUTH-001 | Login Admin Berhasil | 200 | ✅ | — |
| TC-AUTH-002 | Login Kasir Berhasil | 200 | ✅ | — |
| TC-AUTH-003 | Password Salah | 401 | ✅ | — |
| TC-AUTH-004 | Username Tidak Terdaftar | 401 | ✅ | — |
| TC-AUTH-005 | Input Kosong | 422 | ✅ | — |
| TC-AUTH-006 | Role Tidak Valid | 422 | ✅ | — |
| TC-AUTH-007 | Admin → Mode Kasir | 403 | ✅ | — |
| TC-AUTH-008 | Kasir → Mode Admin | 403 | ✅ | — |
| TC-AUTH-009 | Rate Limiting | 429 | ✅ | — |
| TC-AUTH-010 | Registrasi Berhasil | 200 | ✅ | — |
| TC-AUTH-011 | Username Duplikat | 409 | ✅ | — |
| TC-AUTH-012 | Email Duplikat | 409 | ✅ | — |
| TC-AUTH-013 | Password Lemah | 422 | ✅ | — |
| TC-AUTH-014 | Branch Tidak Aktif | 422 | ✅ | — |
