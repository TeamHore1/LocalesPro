import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChartNoAxesColumn,
  CupSoda,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  MapPinned,
  PackageSearch,
  ShoppingCart,
  UserCog,
  UserRound,
  Warehouse,
} from "lucide-react";
import { useApp } from "../../hooks/useApp";
import "./Layout.css";
import logoLocales from "../../assets/locales1.png";
import { clearAuthSession } from "../../utils/auth";
import PageLoader from "../ui/PageLoader";

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBranch, setSelectedBranch, branches, currentUser } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    return <PageLoader message="Mengalihkan ke halaman login..." />;
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
          { path: "/cashier-accounts", label: "Akun Kasir", icon: UserCog },
          { path: "/branch", label: "Cabang", icon: MapPinned },
          { path: "/report", label: "Laporan", icon: ChartNoAxesColumn },
          { path: "/product", label: "Produk", icon: CupSoda },
          { path: "/ingredients", label: "Bahan Baku", icon: PackageSearch },
          { path: "/stock", label: "Stok", icon: Warehouse },
        ]
      : [
          { path: "/pos", label: "Kasir POS", icon: ShoppingCart },
          { path: "/report", label: "Laporan", icon: ChartNoAxesColumn },
          { path: "/stock", label: "Stok", icon: Warehouse },
        ];

  return (
    <div className="main-container bg-light-gray">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo bg-gradient-to-b from-white to-primary-yellow/10">
          <Link to={homePath}>
            <img src={logoLocales} alt="Locales Logo" className="main-logo" />
          </Link>
        </div>

        <div className="sidebar-context-card">
          <span className="context-label">Cabang aktif</span>
          <div className="context-branch-row">
            <MapPinned size={17} strokeWidth={2.3} aria-hidden="true" />
            <strong>{selectedBranch?.name || "Belum ada cabang"}</strong>
          </div>
          {isCashier && (
            <span className="sidebar-lock-tag">
              <LockKeyhole size={12} strokeWidth={2.2} aria-hidden="true" />
              Terkunci untuk kasir
            </span>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`menu-item ${
                  location.pathname === item.path
                    ? "active bg-primary-yellow/15 border-primary-yellow text-dark-blue"
                    : ""
                }`}
              >
                <span
                  className={`icon ${
                    location.pathname === item.path
                      ? "bg-primary-yellow text-dark-blue"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              <UserRound size={17} strokeWidth={2.3} aria-hidden="true" />
            </div>
            <div className="user-brief">
              <span className="user-name-small">{displayUserName}</span>
              <span className="role-label">{displayRole}</span>
            </div>
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
      <button
        type="button"
        className={`sidebar-scrim ${isSidebarOpen ? "show" : ""}`}
        aria-label="Tutup menu"
        onClick={() => setIsSidebarOpen(false)}
      />

      <main className="content">
        <header className="top-nav">
          <div className="top-nav-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              aria-label="Buka menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} strokeWidth={2.4} />
            </button>
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
