import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  Boxes,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Package,
  ReceiptText,
  ShoppingCart,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import { useApp } from "../../hooks/useApp";
import "./Layout.css";
import logoLocales from "../../assets/locales1.png";
import { clearAuthSession, getAuthUser } from "../../utils/auth";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBranch, setSelectedBranch, branches } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const currentUser = getAuthUser();
  const isCashier = currentUser?.role === "cashier";
  const canAccessDashboard = currentUser?.role === "admin";

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser || !branches || branches.length === 0) {
      return;
    }

    if (isCashier && currentUser.branch_id) {
      const workBranch = branches.find(
        (branch) => String(branch.id) === String(currentUser.branch_id),
      );

      if (workBranch) {
        setSelectedBranch(workBranch);
      }

      return;
    }

    if (!selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [branches, currentUser, isCashier, selectedBranch, setSelectedBranch]);

  const handleConfirmLogout = () => {
    clearAuthSession();
    setShowLogoutModal(false);
    navigate("/login");
  };

  if (!currentUser) {
    return null;
  }

  const displayUserName =
    currentUser.full_name || currentUser.name || currentUser.username || "User";
  const displayRole = isCashier ? "kasir" : currentUser.role;
  const homePath = canAccessDashboard ? "/dashboard" : "/pos";

  const menuItems =
    currentUser.role === "admin"
      ? [
          { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { path: "/pos", label: "Kasir POS", icon: ShoppingCart },
          { path: "/cashier-accounts", label: "Akun Kasir", icon: Users },
          { path: "/branch", label: "Cabang", icon: Store },
          { path: "/report", label: "Laporan", icon: ReceiptText },
          { path: "/product", label: "Produk", icon: Package },
          { path: "/ingredients", label: "Bahan Baku", icon: Boxes },
          { path: "/stock", label: "Stok", icon: Archive },
        ]
      : [
          { path: "/pos", label: "Kasir POS", icon: ShoppingCart },
          { path: "/report", label: "Laporan", icon: ReceiptText },
          { path: "/stock", label: "Stok", icon: Archive },
        ];

  return (
    <div className="main-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Link to={homePath}>
            <img src={logoLocales} alt="Locales Logo" className="main-logo" />
          </Link>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
              >
                <span className="icon" aria-hidden="true">
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-brief">
            <span className="user-name-small">{displayUserName}</span>
            <span className="role-label">{displayRole}</span>
          </div>
          <button
            type="button"
            className="btn-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut size={18} strokeWidth={2.2} /> Logout
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="top-nav">
          <div className="branch-indicator">
            <MapPin size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Lokasi:</span>
            <strong>
              {selectedBranch?.name || "Belum ada cabang"}
            </strong>
            {isCashier && (
              <span className="lock-tag">
                <LockKeyhole size={12} strokeWidth={2.2} aria-hidden="true" />
                Terkunci
              </span>
            )}
          </div>

          <div className="user-info">
            <div className="user-text">
              <span className="user-name">
                Halo, <strong>{displayUserName}</strong>
              </span>
              <span className={`role-badge ${currentUser.role}`}>
                {displayRole}
              </span>
            </div>
            <div className="user-avatar">
              <UserRound size={18} strokeWidth={2.2} aria-hidden="true" />
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
            <div className="modal-header-icon">!</div>
            <h2>Konfirmasi Logout</h2>
            <p>
              Apakah Anda yakin ingin keluar dari aplikasi{" "}
              <strong>Locales</strong>?
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
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
