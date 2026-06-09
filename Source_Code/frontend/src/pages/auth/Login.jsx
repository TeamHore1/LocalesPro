import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./Login.css";
import logo from "../../assets/locales1.png";
import bgImage from "../../assets/bg.jpg";
import api from "../../services/api";
import { setAuthSession } from "../../utils/auth";

const LOGIN_MODES = {
  cashier: "cashier",
  dashboard: "dashboard",
};

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{4,30}$/;
const PASSWORD_MIN_LENGTH = 8;

const isDashboardRole = (role) => role === "admin";

const formatLoginError = (error) => {
  const baseMessage =
    error.userMessage ||
    error.response?.data?.message ||
    "Koneksi ke server gagal. Coba lagi sebentar.";
  const retryAfterSeconds = Number(error.response?.data?.retry_after_seconds || 0);
  const remainingAttempts = Number(error.response?.data?.remaining_attempts);

  if (retryAfterSeconds > 0) {
    const retryAfterMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
    return `${baseMessage} Coba lagi dalam ${retryAfterMinutes} menit.`;
  }

  if (Number.isFinite(remainingAttempts) && remainingAttempts > 0) {
    return `${baseMessage} Sisa percobaan: ${remainingAttempts}.`;
  }

  return baseMessage;
};

const Login = () => {
  const [loginMode, setLoginMode] = useState(LOGIN_MODES.cashier);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: "",
    pass: "",
  });

  const isAdminMode = loginMode === LOGIN_MODES.dashboard;

  const resetForm = () => {
    setError("");
    setShowPassword(false);
    setFormData({ user: "", pass: "" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateLoginInput = (username, password) => {
    if (username.length < 4) {
      return "Username minimal 4 karakter.";
    }

    if (!USERNAME_PATTERN.test(username)) {
      return "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip.";
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
    }

    return "";
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const username = formData.user.trim();
    const password = formData.pass;

    const validationError = validateLoginInput(username, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login.php", {
        username,
        password,
        requested_role: loginMode,
      });

      if (response.data.status === "success") {
        const { token, user, expires_at: expiresAt, expires_in: expiresIn } =
          response.data.data;

        setAuthSession({
          token,
          user,
          expiresAt: expiresAt ? Date.parse(expiresAt) / 1000 : undefined,
          expiresIn,
        });

        navigate(isDashboardRole(user.role) ? "/dashboard" : "/pos");
      }
    } catch (err) {
      setError(formatLoginError(err));
      setFormData((current) => ({
        ...current,
        pass: "",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setLoginMode(nextMode);
    resetForm();
  };

  return (
    <div className="login-body" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={`container ${isAdminMode ? "active" : ""}`} id="container">
        <div className="mobile-mode-switch" aria-label="Pilih mode login">
          <button
            type="button"
            className={!isAdminMode ? "active" : ""}
            onClick={() => switchMode(LOGIN_MODES.cashier)}
          >
            Kasir
          </button>
          <button
            type="button"
            className={isAdminMode ? "active" : ""}
            onClick={() => switchMode(LOGIN_MODES.dashboard)}
          >
            Admin
          </button>
        </div>

        <div className="form-container sign-up">
          <form onSubmit={handleLogin}>
            <span className="login-form-eyebrow">Dashboard access</span>
            <h1>Login Admin</h1>
            <p className="login-form-copy">
              Masuk untuk mengelola transaksi, stok, cabang, dan laporan.
            </p>
            {error && isAdminMode && (
              <div className="alert-error" aria-live="polite">
                {error}
              </div>
            )}
            <input
              type="text"
              name="user"
              placeholder="Username Admin"
              onChange={handleChange}
              value={formData.user}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              minLength={4}
              maxLength={30}
              pattern={"[A-Za-z0-9._\\-]{4,30}"}
              title="Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip."
              required
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="pass"
                placeholder="Password"
                onChange={handleChange}
                value={formData.pass}
                autoComplete="current-password"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={72}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff size={17} strokeWidth={2.3} />
                ) : (
                  <Eye size={17} strokeWidth={2.3} />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="btn-login-action"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memverifikasi..." : "Masuk sebagai Admin"}
            </button>
          </form>
        </div>

        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <span className="login-form-eyebrow">POS access</span>
            <h1>Login Kasir</h1>
            <p className="login-form-copy">
              Masuk untuk melayani pesanan dan pembayaran cabang aktif.
            </p>
            {error && !isAdminMode && (
              <div className="alert-error" aria-live="polite">
                {error}
              </div>
            )}
            <input
              type="text"
              name="user"
              placeholder="Username Kasir"
              onChange={handleChange}
              value={formData.user}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              minLength={4}
              maxLength={30}
              pattern={"[A-Za-z0-9._\\-]{4,30}"}
              title="Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip."
              required
            />
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="pass"
                placeholder="Password"
                onChange={handleChange}
                value={formData.pass}
                autoComplete="current-password"
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={72}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? (
                  <EyeOff size={17} strokeWidth={2.3} />
                ) : (
                  <Eye size={17} strokeWidth={2.3} />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="btn-login-action"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Memverifikasi..." : "Masuk sebagai Kasir"}
            </button>
            <Link className="login-register-link" to="/register/cashier">
              Belum punya akun kasir? Daftar di sini
            </Link>
          </form>
        </div>

        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <div className="h1-style">
                <img src={logo} alt="Locales Logo" />
              </div>
              <h2>Mode Admin</h2>
              <button
                type="button"
                className="mode-switch-button"
                onClick={() => switchMode(LOGIN_MODES.cashier)}
              >
                Login As Kasir
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <div className="h1-style">
                <img src={logo} alt="Locales Logo" />
              </div>
              <h2>Mode Kasir</h2>
              <button
                type="button"
                className="mode-switch-button"
                onClick={() => switchMode(LOGIN_MODES.dashboard)}
              >
                Login As Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
