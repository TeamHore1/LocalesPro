import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../pages/auth/Login";
import CashierRegister from "../pages/auth/CashierRegister";
import Dashboard from "../pages/dashboard/Dashboard";
import POS from "../pages/pos/POS";
import MainLayout from "../components/layout/MainLayout";
import ProductList from "../pages/product/ProductList";
import IngredientList from "../pages/ingredient/IngredientList";
import StockList from "../pages/stock/StockList";
import TransactionReport from "../pages/report/TransactionReport";
import BranchList from "../pages/branch/BranchList";
import CashierAccounts from "../pages/user/CashierAccounts";
import { AUTH_SESSION_EVENT, getAuthUser } from "../utils/auth";

const isDashboardRole = (role) => role === "admin";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={isDashboardRole(user.role) ? "/dashboard" : "/pos"} replace />;
  }

  return children;
};

const AppRoutes = () => {
  const [, setAuthVersion] = useState(0);

  useEffect(() => {
    const syncAuth = () => setAuthVersion((version) => version + 1);

    window.addEventListener(AUTH_SESSION_EVENT, syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener(AUTH_SESSION_EVENT, syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            getAuthUser() ? (
              <Navigate
                to={
                  isDashboardRole(getAuthUser().role) ? "/dashboard" : "/pos"
                }
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/register/cashier"
          element={
            getAuthUser() ? <Navigate to="/" replace /> : <CashierRegister />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin", "cashier"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Navigate
                to={
                  isDashboardRole(getAuthUser()?.role) ? "/dashboard" : "/pos"
                }
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
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
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProductList />
              </ProtectedRoute>
            }
          />

          <Route
            path="ingredients"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <IngredientList />
              </ProtectedRoute>
            }
          />

          <Route
            path="cashier-accounts"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <CashierAccounts />
              </ProtectedRoute>
            }
          />

          <Route path="pos" element={<POS />} />
          <Route path="report" element={<TransactionReport />} />
          <Route path="stock" element={<StockList />} />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  isDashboardRole(getAuthUser()?.role) ? "/dashboard" : "/pos"
                }
                replace
              />
            }
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;
