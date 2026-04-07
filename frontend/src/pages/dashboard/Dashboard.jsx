import React, { useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { formatRupiah } from "../../utils/currency";
import "./Dashboard.css";

const Dashboard = () => {
  const { transactions, ingredients, products, loading } = useApp();

  // --- 1. HITUNG PENDAPATAN & TRANSAKSI HARI INI ---
  const todayStr = new Date().toLocaleDateString("en-CA"); // Format YYYY-MM-DD sesuai database

  const { todayTransactions, dailyIncome } = useMemo(() => {
    const filtered = transactions.filter(
      (trx) => trx.created_at && trx.created_at.startsWith(todayStr),
    );
    const income = filtered.reduce(
      (sum, trx) => sum + parseFloat(trx.total_price || 0),
      0,
    );
    return { todayTransactions: filtered, dailyIncome: income };
  }, [transactions, todayStr]);

  // --- 2. LOGIKA PERINGATAN STOK MENIPIS ---
  const lowStockItems = useMemo(() => {
    return ingredients
      .filter((ing) => parseFloat(ing.stock_quantity || 0) <= 10)
      .sort(
        (a, b) => parseFloat(a.stock_quantity) - parseFloat(b.stock_quantity),
      );
  }, [ingredients]);

  // --- 3. LOGIKA PRODUK TERLARIS (TOP 5) ---
  const topProducts = useMemo(() => {
    const salesCount = {};

    transactions.forEach((trx) => {
      let items = trx.items;

      // Antisipasi jika data dari PHP berupa String JSON (sering terjadi di MySQL)
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }

      if (Array.isArray(items)) {
        items.forEach((item) => {
          const name = item.name || "Produk";
          const qty = parseInt(item.quantity || 0);
          salesCount[name] = (salesCount[name] || 0) + qty;
        });
      }
    });

    return Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1]) // Urutkan dari yang terbanyak terjual
      .slice(0, 5);
  }, [transactions]);

  // Tampilkan Loading State jika data sedang ditarik
  if (loading && products.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memproses data Locales, sabar ya Ham...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Dashboard Overview - Locales</h2>
        <p className="dashboard-date">
          {new Date().toLocaleDateString("id-ID", {
            dateStyle: "full",
          })}
        </p>
      </div>

      {/* RANGKUMAN KOTAK (STAT CARDS) */}
      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span>Pendapatan Hari Ini</span>
            <h3>{formatRupiah(dailyIncome)}</h3>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <span>Pesanan Hari Ini</span>
            <h3>{todayTransactions.length} Transaksi</h3>
          </div>
        </div>

        <div className="stat-card items">
          <div className="stat-icon">🧋</div>
          <div className="stat-info">
            <span>Total Menu</span>
            <h3>{products.length} Produk</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* PERINGATAN STOK (WARNING) */}
        <div className="content-card stock-alert">
          <div className="card-header">
            <h3>⚠️ Peringatan Stok Menipis</h3>
            {lowStockItems.length > 0 && (
              <span className="badge-count">{lowStockItems.length} Bahan</span>
            )}
          </div>
          <div className="alert-list">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((ing) => {
                const qty = parseFloat(ing.stock_quantity || 0);
                return (
                  <div key={ing.id} className="alert-item">
                    <div className="alert-name">
                      <strong>{ing.name}</strong>
                      <span>Batas: 10 {ing.unit}</span>
                    </div>
                    <div
                      className={`alert-value ${
                        qty <= 5 ? "critical" : "warning"
                      }`}
                    >
                      {qty} {ing.unit}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-msg">
                <span className="check-icon">✅</span>
                <p>Semua stok bahan masih aman, Ham!</p>
              </div>
            )}
          </div>
        </div>

        {/* PRODUK TERLARIS */}
        <div className="content-card top-products">
          <div className="card-header">
            <h3>🔥 Produk Terlaris</h3>
            <span className="badge-info">Top 5</span>
          </div>
          <div className="top-list">
            {topProducts.length > 0 ? (
              topProducts.map(([name, qty], index) => (
                <div key={name} className="top-item">
                  <div className="rank-circle">{index + 1}</div>
                  <span className="name">{name}</span>
                  <span className="qty">
                    <strong>{qty}</strong> cup terjual
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-msg">
                <p>Belum ada data penjualan terbaru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
