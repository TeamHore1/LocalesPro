import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import CustomSelect from "../../components/ui/CustomSelect";
import { CheckCircle2, ClipboardCheck, ShieldCheck } from "lucide-react";
import bgImage from "../../assets/bg.jpg";
import logo from "../../assets/locales1.png";
import "./CashierRegister.css";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
  branch_id: "",
  registration_note: "",
};

const NAME_PATTERN = /^[A-Za-zÀ-ÿ]+(?:[A-Za-zÀ-ÿ.'\s-]*[A-Za-zÀ-ÿ]+)?$/u;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{4,30}$/;
const PHONE_PATTERN = /^(?:\+62|62|0)[0-9]{8,13}$/;

const sanitizeSpaces = (value) => value.replace(/\s+/g, " ").trim();

const normalizePhone = (value) =>
  value.replace(/[^\d+]/g, "").replace(/^08/, "08").trim();

const validatePassword = (password, username) => {
  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password harus mengandung minimal 1 huruf besar.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password harus mengandung minimal 1 huruf kecil.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password harus mengandung minimal 1 angka.";
  }

  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    return "Password tidak boleh mengandung username.";
  }

  return "";
};

const validateForm = (formData) => {
  const fullName = sanitizeSpaces(formData.full_name);
  const email = sanitizeSpaces(formData.email).toLowerCase();
  const phone = normalizePhone(formData.phone);
  const username = sanitizeSpaces(formData.username);

  if (fullName.length < 3) {
    return "Nama lengkap minimal 3 karakter.";
  }

  if (!NAME_PATTERN.test(fullName) || !/[A-Za-zÀ-ÿ]/u.test(fullName)) {
    return "Nama lengkap hanya boleh berisi huruf, spasi, titik, tanda petik, dan strip.";
  }

  if (fullName.split(" ").filter(Boolean).length < 2) {
    return "Nama lengkap sebaiknya terdiri dari minimal 2 kata.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email tidak valid.";
  }

  if (!PHONE_PATTERN.test(phone)) {
    return "Nomor HP harus diawali 08, 62, atau +62 dan berisi 10 sampai 16 digit.";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Username harus 4-30 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau strip.";
  }

  const passwordError = validatePassword(formData.password, username);
  if (passwordError) {
    return passwordError;
  }

  if (formData.password !== formData.confirmPassword) {
    return "Konfirmasi password tidak cocok.";
  }

  if (!formData.branch_id) {
    return "Cabang tujuan wajib dipilih.";
  }

  if (sanitizeSpaces(formData.registration_note).length > 500) {
    return "Catatan pendaftaran maksimal 500 karakter.";
  }

  return "";
};

const CashierRegister = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedBranchName, setSelectedBranchName] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get("/public/branches_registration.php");
        if (response.data.status === "success") {
          setBranches(response.data.data || []);
        } else {
          setError(response.data.message || "Gagal memuat cabang.");
        }
      } catch (fetchError) {
        setError(
          fetchError.userMessage ||
            fetchError.response?.data?.message ||
            "Gagal memuat daftar cabang.",
        );
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!isLoadingBranches && branches.length === 0) {
      setError("Tidak ada cabang aktif yang tersedia untuk pendaftaran.");
      return;
    }

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    const fullName = sanitizeSpaces(formData.full_name);
    const email = sanitizeSpaces(formData.email).toLowerCase();
    const phone = normalizePhone(formData.phone);
    const username = sanitizeSpaces(formData.username);
    const registrationNote = sanitizeSpaces(formData.registration_note);

    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/register_cashier.php", {
        full_name: fullName,
        email,
        phone,
        username,
        password: formData.password,
        branch_id: Number(formData.branch_id),
        registration_note: registrationNote,
      });

      if (response.data.status === "success") {
        setSuccessMessage(
          response.data.message ||
            "Pendaftaran kasir berhasil dikirim. Tunggu persetujuan admin.",
        );
        setSelectedBranchName(response.data.data?.branch_name || "");
        setFormData(INITIAL_FORM);
      }
    } catch (submitError) {
      setError(
        submitError.userMessage ||
          submitError.response?.data?.message ||
          "Gagal mengirim pendaftaran kasir.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="cashier-register-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="cashier-register-card">
        <aside className="cashier-register-side">
          <img src={logo} alt="Locales Logo" />
          <span>Onboarding kasir</span>
          <h1>Daftar Kasir Locales</h1>
          <p>
            Kirim data pendaftaran agar admin dapat menempatkan akun ke cabang
            yang sesuai.
          </p>

          <div className="register-flow-list">
            <div>
              <ClipboardCheck size={18} strokeWidth={2.3} />
              <strong>Isi data lengkap</strong>
              <small>Nama, kontak, username, dan cabang tujuan.</small>
            </div>
            <div>
              <ShieldCheck size={18} strokeWidth={2.3} />
              <strong>Admin meninjau</strong>
              <small>Akun diperiksa sebelum akses POS dibuka.</small>
            </div>
            <div>
              <CheckCircle2 size={18} strokeWidth={2.3} />
              <strong>Login setelah aktif</strong>
              <small>Kasir bisa masuk setelah disetujui admin.</small>
            </div>
          </div>
        </aside>

        <main className="cashier-register-main">
        <div className="cashier-register-brand">
          <div>
            <span>Form pendaftaran</span>
            <h2>Data akun kasir</h2>
            <p>
              Pastikan data valid agar proses verifikasi admin berjalan cepat.
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="cashier-register-success">
            <h2>Pendaftaran Terkirim</h2>
            <p>{successMessage}</p>
            {selectedBranchName && (
              <p className="success-branch">
                Cabang tujuan: <strong>{selectedBranchName}</strong>
              </p>
            )}
            <div className="cashier-register-actions">
              <button
                type="button"
                className="register-primary-button"
                onClick={() => navigate("/login")}
              >
                Kembali ke Login
              </button>
              <button
                type="button"
                className="register-secondary-button"
                onClick={() => {
                  setSuccessMessage("");
                  setSelectedBranchName("");
                }}
              >
                Daftarkan Akun Lain
              </button>
            </div>
          </div>
        ) : (
          <form className="cashier-register-form" onSubmit={handleSubmit}>
            <div className="register-grid">
              <label>
                Nama Lengkap
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Nama sesuai identitas"
                  autoComplete="name"
                  minLength={3}
                  maxLength={100}
                  pattern={"[A-Za-zÀ-ÿ]+(?:[A-Za-zÀ-ÿ.'\\s\\-]*[A-Za-zÀ-ÿ]+)?"}
                  title="Gunakan huruf, spasi, titik, tanda petik, atau strip."
                  required
                />
              </label>

              <label>
                Email Aktif
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Nomor HP
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={16}
                  pattern={"(?:\\+62|62|0)[0-9]{8,13}"}
                  title="Gunakan nomor yang diawali 08, 62, atau +62."
                  required
                />
              </label>

              <label>
                Cabang Tujuan
                <CustomSelect
                  value={formData.branch_id}
                  onChange={(value) =>
                    handleChange({ target: { name: "branch_id", value } })
                  }
                  disabled={isLoadingBranches || branches.length === 0}
                  placeholder={
                    isLoadingBranches
                      ? "Memuat cabang..."
                      : branches.length === 0
                        ? "Tidak ada cabang aktif"
                        : "Pilih cabang"
                  }
                  options={branches.map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                    description: branch.address || "Cabang Locales",
                  }))}
                />
              </label>

              <label>
                Username
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="contoh: kasir.dago"
                  autoComplete="username"
                  minLength={4}
                  maxLength={30}
                  pattern={"[A-Za-z0-9._\\-]{4,30}"}
                  title="Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip."
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </label>

              <label>
                Konfirmasi Password
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                />
              </label>
            </div>

            <label className="register-textarea-field">
              Catatan Pendaftaran
              <textarea
                name="registration_note"
                value={formData.registration_note}
                onChange={handleChange}
                rows="4"
                maxLength={500}
                placeholder="Opsional: pengalaman kerja, jam siap kerja, atau catatan singkat untuk admin."
              />
            </label>

            <div className="register-security-box">
              Akun kasir baru tidak langsung aktif. Admin akan meninjau data,
              cabang tujuan, dan kesiapan akun sebelum login diperbolehkan.
            </div>

            {error && <div className="register-error">{error}</div>}

            <div className="cashier-register-actions">
              <button
                type="submit"
                className="register-primary-button"
                disabled={
                  isSubmitting || isLoadingBranches || branches.length === 0
                }
              >
                {isSubmitting ? "Mengirim Pendaftaran..." : "Kirim Pendaftaran"}
              </button>
              <Link className="register-login-link" to="/login">
                Sudah punya akun? Masuk di sini
              </Link>
            </div>
          </form>
        )}
        </main>
      </div>
    </div>
  );
};

export default CashierRegister;
