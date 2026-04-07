import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import { formatRupiah } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import "./Report.css";

const TransactionReport = () => {
  // Ambil transactions dari AppContext (Pastikan default array [] agar tidak blank)
  const { transactions = [], voidTransaction } = useApp();

  // State untuk Filter
  const [filterDate, setFilterDate] = useState("");
  const [filterMethod, setFilterMethod] = useState("Semua Metode");

  // State untuk Custom Modal Void
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // --- LOGIKA FILTER DATA ---
  const filteredTransactions = transactions.filter((trx) => {
    // Database menggunakan format YYYY-MM-DD HH:mm:ss di kolom created_at
    const trxDate = trx.created_at ? trx.created_at.split(" ")[0] : "";

    const matchDate = filterDate ? trxDate === filterDate : true;

    // Menangani case-insensitive untuk metode (Cash/QRIS)
    const matchMethod =
      filterMethod === "Semua Metode"
        ? true
        : trx.payment_method?.toLowerCase() === filterMethod.toLowerCase();

    return matchDate && matchMethod;
  });

  // --- HITUNG TOTAL PENDAPATAN (Gunakan total_price dari DB) ---
  const totalIncome = filteredTransactions.reduce(
    (sum, trx) => sum + parseFloat(trx.total_price || 0),
    0,
  );

  // Fungsi untuk memicu Modal Konfirmasi
  const triggerVoid = (id) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  // Fungsi yang dijalankan setelah user klik "Ya" di Modal
  const handleConfirmVoid = () => {
    if (selectedId) {
      voidTransaction(selectedId);
      setIsModalOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="report-container">
      {/* IMPLEMENTASI CUSTOM MODAL */}
      <Modal
        isOpen={isModalOpen}
        title="Konfirmasi Void"
        message="Yakin ingin membatalkan transaksi ini? Seluruh stok bahan baku yang digunakan dalam pesanan ini akan dikembalikan otomatis ke gudang."
        onConfirm={handleConfirmVoid}
        onCancel={() => setIsModalOpen(false)}
      />

      <div className="header-page">
        <div className="header-title">
          <h2 style={{ color: "#092379" }}>Laporan Transaksi</h2>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Riwayat penjualan harian Locales
          </p>
        </div>
        <div className="report-actions">
          <button className="btn-print" onClick={() => window.print()}>
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary">
        <div className="summary-card main">
          <span>Total Pendapatan (Filtered)</span>
          <h3>{formatRupiah(totalIncome)}</h3>
        </div>
        <div className="summary-card">
          <span>Jumlah Transaksi</span>
          <h3>{filteredTransactions.length}</h3>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-group">
          <label>Tanggal:</label>
          <input
            type="date"
            className="filter-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Metode:</label>
          <select
            className="filter-input"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="Semua Metode">Semua Metode</option>
            <option value="Cash">Tunai</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
        <button
          className="btn-reset"
          onClick={() => {
            setFilterDate("");
            setFilterMethod("Semua Metode");
          }}
        >
          Reset Filter
        </button>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID Transaksi</th>
              <th>Waktu</th>
              <th>Item Pesanan</th>
              <th>Total Bayar</th>
              <th>Metode</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((trx) => {
                // Pecah created_at menjadi Tanggal dan Jam
                const [datePart, timePart] = trx.created_at
                  ? trx.created_at.split(" ")
                  : ["-", "-"];

                return (
                  <tr key={trx.id}>
                    <td>
                      <strong>TRX-{trx.id}</strong>
                    </td>
                    <td>
                      {datePart} <br />{" "}
                      <small style={{ color: "#888" }}>{timePart}</small>
                    </td>
                    <td>
                      {/* Mapping item jika ada data array items */}
                      {Array.isArray(trx.items)
                        ? trx.items
                            .map((item) => `${item.name} (${item.quantity})`)
                            .join(", ")
                        : "Menu Locales"}
                    </td>
                    <td className="text-bold">
                      {formatRupiah(trx.total_price)}
                    </td>
                    <td>
                      <span
                        className={`method-tag ${trx.payment_method?.toLowerCase() || "cash"}`}
                      >
                        {trx.payment_method || "Cash"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-void"
                        onClick={() => triggerVoid(trx.id)}
                      >
                        Void
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="empty-row"
                  style={{ textAlign: "center", padding: "40px" }}
                >
                  Tidak ada transaksi yang sesuai dengan filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionReport;
