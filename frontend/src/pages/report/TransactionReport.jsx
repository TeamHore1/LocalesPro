import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { formatRupiah } from "../../utils/currency";
import Modal from "../../components/ui/Modal";
import "./Report.css";

const normalizePaymentStatus = (status) =>
  String(status || "Paid").trim().toLowerCase();

const PAYMENT_METHOD_FILTERS = [{ value: "Cash", label: "Tunai" }];
const STATUS_FILTERS = [
  { value: "Semua Status", label: "Semua Status" },
  { value: "paid", label: "Paid" },
  { value: "voided", label: "Voided" },
];

const getPaymentMethodClassName = (paymentMethod) =>
  String(paymentMethod || "Cash")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const TransactionReport = () => {
  const { transactions = [], voidTransaction, selectedBranch } = useApp();

  const [filterDate, setFilterDate] = useState("");
  const [filterMethod, setFilterMethod] = useState("Semua Metode");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState("");

  const filteredTransactions = transactions.filter((trx) => {
    const trxDate = trx.created_at ? trx.created_at.split(" ")[0] : "";
    const itemsText = Array.isArray(trx.items)
      ? trx.items.map((item) => item.name).join(" ")
      : "";
    const keyword = searchQuery.trim().toLowerCase();
    const matchDate = filterDate ? trxDate === filterDate : true;
    const matchMethod =
      filterMethod === "Semua Metode"
        ? true
        : String(trx.payment_method || "").toLowerCase() ===
          filterMethod.toLowerCase();
    const matchStatus =
      filterStatus === "Semua Status"
        ? true
        : normalizePaymentStatus(trx.payment_status) === filterStatus;
    const matchSearch = keyword
      ? `${trx.transaction_code || ""} ${itemsText}`.toLowerCase().includes(keyword)
      : true;

    return matchDate && matchMethod && matchStatus && matchSearch;
  });

  const totalIncome = filteredTransactions.reduce(
    (sum, trx) =>
      normalizePaymentStatus(trx.payment_status) === "paid"
        ? sum + parseFloat(trx.total_price || 0)
        : sum,
    0,
  );

  const paidTransactionsCount = filteredTransactions.filter(
    (trx) => normalizePaymentStatus(trx.payment_status) === "paid",
  ).length;

  const voidedTransactionsCount = filteredTransactions.filter(
    (trx) => normalizePaymentStatus(trx.payment_status) === "voided",
  ).length;

  const exportCsv = () => {
    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = filteredTransactions.map((trx) => [
      trx.transaction_code || `TRX-${trx.id}`,
      trx.created_at || "",
      trx.customer_name || "",
      Array.isArray(trx.items)
        ? trx.items.map((item) => `${item.name} (${item.qty ?? item.quantity ?? 0})`).join("; ")
        : "Menu Locales",
      trx.total_price || 0,
      trx.amount_paid || 0,
      trx.change_amount || 0,
      trx.payment_method || "Cash",
      trx.payment_status || "Paid",
      trx.payment_note || "",
      trx.void_reason || "",
      trx.voided_by_name || "",
      trx.voided_at || "",
    ]);

    const csvContent = [
      [
        "ID Transaksi",
        "Waktu",
        "Pelanggan",
        "Item Pesanan",
        "Total Bayar",
        "Tunai Diterima",
        "Kembalian",
        "Metode",
        "Status",
        "Catatan",
        "Alasan Void",
        "Void Oleh",
        "Waktu Void",
      ],
      ...rows,
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-locales-${filterDate || "semua"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerVoid = (id) => {
    setSelectedId(id);
    setVoidReason("");
    setVoidError("");
    setIsModalOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (voidReason.trim().length < 3) {
      setVoidError("Alasan void wajib diisi minimal 3 karakter.");
      return;
    }

    if (selectedId) {
      try {
        await voidTransaction(selectedId, voidReason.trim());
        setIsModalOpen(false);
        setSelectedId(null);
        setVoidReason("");
      } catch (error) {
        setVoidError(
          error.response?.data?.message ||
            "Void transaksi gagal diproses. Coba lagi sebentar.",
        );
      }
    }
  };

  return (
    <div className="report-container">
      <Modal
        isOpen={isModalOpen}
        title="Konfirmasi Void"
        message="Yakin ingin membatalkan transaksi ini? Seluruh stok bahan baku yang digunakan dalam pesanan ini akan dikembalikan otomatis ke gudang."
        onConfirm={handleConfirmVoid}
        onCancel={() => {
          setIsModalOpen(false);
          setVoidReason("");
          setVoidError("");
        }}
      >
        <div className="void-reason-field">
          <label htmlFor="void-reason">Alasan Void</label>
          <textarea
            id="void-reason"
            rows="3"
            value={voidReason}
            onChange={(event) => {
              setVoidReason(event.target.value);
              setVoidError("");
            }}
            placeholder="Contoh: pesanan salah input atau pembeli batal."
          />
          {voidError && <span>{voidError}</span>}
        </div>
      </Modal>

      <div className="header-page">
        <div className="header-title">
          <h2 style={{ color: "#092379" }}>Laporan Transaksi</h2>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Riwayat penjualan cabang{" "}
            <strong>{selectedBranch?.name || "aktif"}</strong>
          </p>
        </div>
        <div className="report-actions">
          <button className="btn-export" onClick={exportCsv}>
            Export CSV
          </button>
          <button className="btn-print" onClick={() => window.print()}>
            Cetak Laporan
          </button>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-card main">
          <span>Total Pendapatan (Filtered)</span>
          <h3>{formatRupiah(totalIncome)}</h3>
        </div>
        <div className="summary-card">
          <span>Transaksi Dibayar</span>
          <h3>{paidTransactionsCount}</h3>
        </div>
        <div className="summary-card">
          <span>Semua Transaksi</span>
          <h3>{filteredTransactions.length}</h3>
        </div>
        <div className="summary-card">
          <span>Void</span>
          <h3>{voidedTransactionsCount}</h3>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-group search">
          <label>Pencarian:</label>
          <input
            type="search"
            className="filter-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kode transaksi atau item"
          />
        </div>
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
            {PAYMENT_METHOD_FILTERS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select
            className="filter-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-reset"
          onClick={() => {
            setFilterDate("");
            setFilterMethod("Semua Metode");
            setFilterStatus("Semua Status");
            setSearchQuery("");
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
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((trx) => {
                const [datePart, timePart] = trx.created_at
                  ? trx.created_at.split(" ")
                  : ["-", "-"];

                return (
                  <tr
                    key={trx.id}
                    className={
                      normalizePaymentStatus(trx.payment_status) === "voided"
                        ? "row-voided"
                        : ""
                    }
                  >
                    <td>
                      <strong>{trx.transaction_code || `TRX-${trx.id}`}</strong>
                      {trx.customer_name && (
                        <div className="transaction-meta">
                          {trx.customer_name}
                        </div>
                      )}
                    </td>
                    <td>
                      {datePart} <br />{" "}
                      <small style={{ color: "#888" }}>{timePart}</small>
                    </td>
                    <td>
                      {Array.isArray(trx.items)
                        ? trx.items
                            .map((item) => `${item.name} (${item.qty ?? item.quantity ?? 0})`)
                            .join(", ")
                        : "Menu Locales"}
                    </td>
                    <td className="text-bold">{formatRupiah(trx.total_price)}</td>
                    <td>
                      <span
                        className={`method-tag ${getPaymentMethodClassName(trx.payment_method)}`}
                      >
                        {trx.payment_method || "Cash"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-tag ${normalizePaymentStatus(trx.payment_status)}`}
                      >
                        {trx.payment_status || "Paid"}
                      </span>
                      {trx.void_reason && (
                        <div className="transaction-meta danger">
                          {trx.void_reason}
                          {trx.voided_by_name ? ` oleh ${trx.voided_by_name}` : ""}
                        </div>
                      )}
                    </td>
                    <td>
                      {normalizePaymentStatus(trx.payment_status) === "paid" ? (
                        <button
                          className="btn-void"
                          onClick={() => triggerVoid(trx.id)}
                        >
                          Void
                        </button>
                      ) : (
                        <span className="void-disabled">Tidak tersedia</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
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
