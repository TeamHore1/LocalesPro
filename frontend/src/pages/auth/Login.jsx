import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../../assets/locales1.png";
import bgImage from "../../assets/bg.jpg";
// 1. Import api yang tadi kita buat
import api from "../../services/api";

const Login = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    user: "",
    pass: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    // 2. Tambahkan async
    e.preventDefault();
    setError("");

    try {
      // 3. Kirim data ke Backend PHP
      // Kita mapping 'user' ke 'username' dan 'pass' ke 'password' agar sesuai database
      const response = await api.post("/auth/login.php", {
        username: formData.user,
        password: formData.pass,
      });

      if (response.data.status === "success") {
        const { token, user } = response.data.data;

        // 4. Simpan ke LocalStorage agar terbaca di seluruh aplikasi
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // 5. Navigasi berdasarkan Role asli dari Database
        if (user.role === "admin") {
          navigate("/dashboard");
        } else {
          // Kasir atau Manager diarahkan ke POS
          navigate("/pos");
        }
      }
    } catch (err) {
      // 6. Ambil pesan error dari PHP (misal: "Username salah")
      const message =
        err.response?.data?.message || "Koneksi ke server gagal, Ham!";
      setError(message);
    }
  };

  return (
    <div className="login-body" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className={`container ${isActive ? "active" : ""}`} id="container">
        {/* Panel Login Admin */}
        <div className="form-container sign-up">
          <form onSubmit={handleLogin}>
            <h1>Login Admin</h1>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Akses penuh manajemen sistem
            </p>
            {error && isActive && <div className="alert-error">{error}</div>}
            <input
              type="text"
              name="user"
              placeholder="Username Admin"
              onChange={handleChange}
              value={formData.user}
              required
            />
            <input
              type="password"
              name="pass"
              placeholder="Password"
              onChange={handleChange}
              value={formData.pass}
              required
            />
            <button type="submit" className="btn-login-action">
              Masuk sebagai Admin
            </button>
          </form>
        </div>

        {/* Panel Login Kasir */}
        <div className="form-container sign-in">
          <form onSubmit={handleLogin}>
            <h1>Login Kasir</h1>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Akses operasional toko
            </p>
            {error && !isActive && <div className="alert-error">{error}</div>}
            <input
              type="text"
              name="user"
              placeholder="Username Kasir"
              onChange={handleChange}
              value={formData.user}
              required
            />
            <input
              type="password"
              name="pass"
              placeholder="Password"
              onChange={handleChange}
              value={formData.pass}
              required
            />
            <button type="submit" className="btn-login-action">
              Masuk sebagai Kasir
            </button>
          </form>
        </div>

        {/* Overlay Toggle Panel */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <div className="h1-style">
                <img src={logo} alt="Locales Logo" />
              </div>
              <h2>Mode Admin</h2>
              <p>Butuh transaksi cepat? Pindah ke mode kasir sekarang.</p>
              <button
                className="hidden"
                onClick={() => {
                  setIsActive(false);
                  setError("");
                  setFormData({ user: "", pass: "" }); // Bersihkan form
                }}
              >
                Login As Kasir
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <div className="h1-style">
                <img src={logo} alt="Locales Logo" />
              </div>
              <h2>Mode Kasir</h2>
              <p>
                Hallo Sobat Local! Silakan login untuk mulai melayani pelanggan.
              </p>
              <button
                className="hidden"
                onClick={() => {
                  setIsActive(true);
                  setError("");
                  setFormData({ user: "", pass: "" }); // Bersihkan form
                }}
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
