import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import POS from "../pages/pos/POS";
import MainLayout from "../components/layout/MainLayout";
import ProductList from "../pages/product/ProductList";
import IngredientList from "../pages/ingredient/IngredientList";
import StockList from "../pages/stock/StockList";
import TransactionReport from "../pages/report/TransactionReport";
import BranchList from "../pages/branch/BranchList";

// Komponen Helper untuk membatasi akses berdasarkan Role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    // Jika kasir mencoba akses dashboard, arahkan ke POS
    return <Navigate to="/pos" replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* 1. Route Login (Terbuka untuk semua yang belum login) */}
        <Route path="/login" element={<Login />} />

        {/* 2. Route Utama dengan MainLayout */}
        <Route path="/" element={<MainLayout />}>
          {/* Index Route: Mengarahkan ke dashboard secara default */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* HALAMAN KHUSUS ADMIN & MANAGER */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="branch"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <BranchList />
              </ProtectedRoute>
            }
          />

          <Route
            path="product"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <ProductList />
              </ProtectedRoute>
            }
          />

          <Route
            path="ingredients"
            element={
              <ProtectedRoute allowedRoles={["admin", "manager"]}>
                <IngredientList />
              </ProtectedRoute>
            }
          />

          {/* HALAMAN YANG BISA DIAKSES SEMUA (ADMIN & PEGAWAI/KASIR) */}
          <Route path="pos" element={<POS />} />
          <Route path="report" element={<TransactionReport />} />
          <Route path="stock" element={<StockList />} />

          {/* 3. Fallback (Jika URL tidak ditemukan) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
