import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../store/AppContext";
import "./Layout.css";
import logoLocales from "../../assets/locales1.png";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBranch, setSelectedBranch, branches } = useApp();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const savedUser = localStorage.getItem("user");
  const currentUser = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !branches || branches.length === 0) return; // Tambah cek branches

    if (currentUser.role === "pegawai" && currentUser.branch_id) {
      // Sesuaikan branch_id (snake_case)
      const workBranch = branches.find((b) => b.id === currentUser.branch_id);
      if (workBranch) {
        setSelectedBranch(workBranch);
      }
    } else if (currentUser.role === "admin" && !selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [branches, setSelectedBranch, currentUser, selectedBranch]);

  const handleConfirmLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Tambah hapus token juga
    setShowLogoutModal(false);
    navigate("/login");
  };

  if (!currentUser) return null;

  // Gunakan username jika name tidak ada (agar tidak crash)
  const displayUserName = currentUser.name || currentUser.username || "User";

  const menuItems =
    currentUser.role === "admin"
      ? [
          { path: "/dashboard", label: "Dashboard", icon: "📊" },
          { path: "/pos", label: "Kasir (POS)", icon: "🛒" },
          { path: "/branch", label: "Cabang", icon: "🏪" },
          { path: "/report", label: "Laporan", icon: "📋" },
          { path: "/product", label: "Produk", icon: "📦" },
          { path: "/ingredients", label: "Master Bahan", icon: "🥫" },
          { path: "/stock", label: "Manajemen Stok", icon: "🗄️" },
        ]
      : [
          { path: "/pos", label: "Kasir (POS)", icon: "🛒" },
          { path: "/report", label: "Laporan", icon: "📋" },
          { path: "/stock", label: "Manajemen Stok", icon: "🗄️" },
        ];

  return (
    <div className="main-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to={currentUser.role === "admin" ? "/dashboard" : "/pos"}>
            <img src={logoLocales} alt="Locales Logo" className="main-logo" />
          </Link>
        </div>
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-brief">
            <span className="user-name-small">{displayUserName}</span>
            <span className="role-label">{currentUser.role}</span>
          </div>
          <button
            className="btn-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="top-nav">
          <div className="branch-indicator">
            📍 Lokasi:{" "}
            <strong style={{ color: "#092379" }}>
              {selectedBranch?.name || "Memuat..."}
            </strong>
            {currentUser.role === "pegawai" && (
              <span className="lock-tag">🔒 Fixed</span>
            )}
          </div>

          <div className="user-info">
            <div className="user-text">
              <span className="user-name">
                Halo, <strong>{displayUserName}</strong>
              </span>
              <span className={`role-badge ${currentUser.role}`}>
                {currentUser.role}
              </span>
            </div>
            <div className="user-avatar">
              {displayUserName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-body">
          <Outlet />
        </div>
      </main>

      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header-icon">⚠️</div>
            <h2>Konfirmasi Logout</h2>
            <p>
              Apakah Anda yakin ingin keluar dari aplikasi{" "}
              <strong>Locales</strong>?
            </p>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Batal
              </button>
              <button
                className="btn-primary-logout"
                onClick={handleConfirmLogout}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLayout;
