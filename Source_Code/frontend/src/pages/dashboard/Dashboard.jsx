import React, { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Coffee,
  Flame,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { useApp } from "../../hooks/useApp";
import { formatRupiah } from "../../utils/currency";
import "./Dashboard.css";

const isPaidTransaction = (trx) =>
  String(trx?.payment_status || "Paid").trim().toLowerCase() === "paid";

const formatDateKey = (date) => date.toLocaleDateString("en-CA");

const Dashboard = () => {
  const { transactions, ingredients, products, loading } = useApp();
  const todayStr = formatDateKey(new Date());

  const { todayTransactions, dailyIncome } = useMemo(() => {
    const filtered = transactions.filter(
      (trx) =>
        trx.created_at &&
        trx.created_at.startsWith(todayStr) &&
        isPaidTransaction(trx),
    );
    const income = filtered.reduce(
      (sum, trx) => sum + parseFloat(trx.total_price || 0),
      0,
    );
    return { todayTransactions: filtered, dailyIncome: income };
  }, [transactions, todayStr]);

  const weeklySales = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      return {
        key: formatDateKey(date),
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        total: 0,
      };
    });

    const dayMap = new Map(days.map((day) => [day.key, day]));

    transactions.filter(isPaidTransaction).forEach((trx) => {
      const trxDate = String(trx.created_at || "").split(" ")[0];
      const day = dayMap.get(trxDate);

      if (day) {
        day.total += parseFloat(trx.total_price || 0);
      }
    });

    return days;
  }, [transactions]);

  const averageOrderValue =
    todayTransactions.length > 0 ? dailyIncome / todayTransactions.length : 0;

  const stockHealthPercent = useMemo(() => {
    if (ingredients.length === 0) {
      return 100;
    }

    const safeItems = ingredients.filter(
      (ing) =>
        parseFloat(ing.stock_quantity || 0) >
        parseFloat(ing.min_stock || 0),
    ).length;

    return Math.round((safeItems / ingredients.length) * 100);
  }, [ingredients]);

  const lowStockItems = useMemo(() => {
    return ingredients
      .filter(
        (ing) =>
          parseFloat(ing.stock_quantity || 0) <=
          parseFloat(ing.min_stock || 0),
      )
      .sort(
        (a, b) => parseFloat(a.stock_quantity) - parseFloat(b.stock_quantity),
      );
  }, [ingredients]);

  const topProducts = useMemo(() => {
    const salesCount = {};

    transactions
      .filter(isPaidTransaction)
      .forEach((trx) => {
        let items = trx.items;

        if (typeof items === "string") {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }

        if (Array.isArray(items)) {
          items.forEach((item) => {
            const name = item.name || "Produk";
            const qty = parseInt(item.quantity || 0, 10);
            salesCount[name] = (salesCount[name] || 0) + qty;
          });
        }
      });

    return Object.entries(salesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter(isPaidTransaction)
      .slice(0, 5);
  }, [transactions]);

  const weeklyMax = Math.max(...weeklySales.map((day) => day.total), 1);

  if (loading && products.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memproses data Locales...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Dashboard Operasional</h2>
          <p className="dashboard-subtitle">
            Ringkasan penjualan, stok, dan performa menu hari ini.
          </p>
        </div>
        <p className="dashboard-date">
          {new Date().toLocaleDateString("id-ID", {
            dateStyle: "full",
          })}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card income">
          <div className="stat-icon">
            <WalletCards size={28} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span>Pendapatan Hari Ini</span>
            <h3>{formatRupiah(dailyIncome)}</h3>
          </div>
        </div>

        <div className="stat-card orders">
          <div className="stat-icon">
            <ReceiptText size={28} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span>Pesanan Hari Ini</span>
            <h3>{todayTransactions.length} Transaksi</h3>
          </div>
        </div>

        <div className="stat-card items">
          <div className="stat-icon">
            <Coffee size={28} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span>Total Menu</span>
            <h3>{products.length} Produk</h3>
          </div>
        </div>

        <div className="stat-card average">
          <div className="stat-icon">
            <TrendingUp size={28} strokeWidth={2.2} />
          </div>
          <div className="stat-info">
            <span>Rata-rata Belanja</span>
            <h3>{formatRupiah(averageOrderValue)}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-modern-grid">
        <div className="content-card weekly-card">
          <div className="card-header">
            <h3>
              <CalendarDays size={18} strokeWidth={2.2} />
              Tren 7 Hari
            </h3>
            <span className="badge-info">Paid</span>
          </div>
          <div className="weekly-bars">
            {weeklySales.map((day) => (
              <div key={day.key} className="weekly-bar-item">
                <div className="weekly-bar-track">
                  <div
                    className="weekly-bar-fill"
                    style={{ height: `${Math.max((day.total / weeklyMax) * 100, day.total > 0 ? 12 : 4)}%` }}
                  />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card stock-health-card">
          <div className="card-header">
            <h3>
              <CheckCircle2 size={18} strokeWidth={2.2} />
              Kesehatan Stok
            </h3>
          </div>
          <div className="stock-health-score">
            <strong>{stockHealthPercent}%</strong>
            <span>bahan di atas batas minimum</span>
          </div>
          <div className="health-meter">
            <span style={{ width: `${stockHealthPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-card stock-alert">
          <div className="card-header">
            <h3>
              <AlertTriangle size={18} strokeWidth={2.2} />
              Peringatan Stok Menipis
            </h3>
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
                      <span>
                        Batas: {parseFloat(ing.min_stock || 0)} {ing.unit}
                      </span>
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
                <CheckCircle2 size={24} strokeWidth={2.2} />
                <p>Semua stok bahan masih aman.</p>
              </div>
            )}
          </div>
        </div>

        <div className="content-card top-products">
          <div className="card-header">
            <h3>
              <Flame size={18} strokeWidth={2.2} />
              Produk Terlaris
            </h3>
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

        <div className="content-card recent-sales">
          <div className="card-header">
            <h3>
              <ReceiptText size={18} strokeWidth={2.2} />
              Transaksi Terbaru
            </h3>
          </div>
          <div className="recent-list">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((trx) => (
                <div key={trx.id} className="recent-item">
                  <div>
                    <strong>{trx.transaction_code || `TRX-${trx.id}`}</strong>
                    <span>{trx.created_at || "-"}</span>
                  </div>
                  <b>{formatRupiah(trx.total_price || 0)}</b>
                </div>
              ))
            ) : (
              <div className="empty-msg">
                <p>Belum ada transaksi terbaru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
