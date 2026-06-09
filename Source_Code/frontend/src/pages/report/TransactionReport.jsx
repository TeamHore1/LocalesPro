import React, { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { formatRupiah } from "../../utils/currency";
import { getAuthUser } from "../../utils/auth";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import CustomSelect from "../../components/ui/CustomSelect";
import EmptyState from "../../components/ui/EmptyState";
import { CardSkeletonGrid, Skeleton, TableSkeleton } from "../../components/ui/Skeleton";
import { AlertCircle, FileText, Printer, Search, ShieldCheck } from "lucide-react";
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

const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const TransactionReport = () => {
  const {
    transactions = [],
    voidTransaction,
    selectedBranch,
    loading,
    loadError,
    refreshData,
  } = useApp();
  const currentUser = getAuthUser();
  const isInitialLoading = loading && transactions.length === 0;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
    const matchStartDate = startDate ? trxDate >= startDate : true;
    const matchEndDate = endDate ? trxDate <= endDate : true;
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

    return matchStartDate && matchEndDate && matchMethod && matchStatus && matchSearch;
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

  const averageTransaction = paidTransactionsCount
    ? totalIncome / paidTransactionsCount
    : 0;
  const reportPeriod =
    startDate || endDate
      ? `${formatDisplayDate(startDate || endDate)} - ${formatDisplayDate(endDate || startDate)}`
      : "Semua tanggal";
  const printedAt = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());
  const activeFilterLabels = useMemo(() => {
    const labels = [];

    if (searchQuery.trim()) {
      labels.push(`Cari: ${searchQuery.trim()}`);
    }

    if (startDate || endDate) {
      labels.push(
        `Periode: ${formatDisplayDate(startDate || endDate)} - ${formatDisplayDate(
          endDate || startDate,
        )}`,
      );
    }

    if (filterMethod !== "Semua Metode") {
      labels.push(`Metode: ${filterMethod}`);
    }

    if (filterStatus !== "Semua Status") {
      labels.push(`Status: ${filterStatus}`);
    }

    return labels;
  }, [endDate, filterMethod, filterStatus, searchQuery, startDate]);

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

      <PageHeader
        title="Laporan Transaksi"
        subtitle={`Riwayat penjualan cabang ${selectedBranch?.name || "aktif"}.`}
        meta={`${filteredTransactions.length} transaksi`}
        actions={
          <div className="report-actions">
            <button className="btn-print" onClick={() => window.print()}>
              <Printer size={16} strokeWidth={2.3} />
              Cetak Laporan
            </button>
          </div>
        }
      />

      <div className="print-report-header">
        <div>
          <span>Locales Boba Tea</span>
          <h1>Laporan Transaksi</h1>
          <p>Cabang: {selectedBranch?.name || "Cabang aktif"}</p>
        </div>
        <div className="print-report-meta">
          <p>
            <strong>Periode</strong>
            {reportPeriod}
          </p>
          <p>
            <strong>Dicetak</strong>
            {printedAt}
          </p>
          <p>
            <strong>Petugas</strong>
            {currentUser?.full_name || currentUser?.username || "Admin"}
          </p>
        </div>
      </div>

      {loadError && transactions.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="Laporan gagal dimuat."
          description={loadError}
          actionLabel="Coba Lagi"
          onAction={refreshData}
          variant="error"
        />
      ) : isInitialLoading ? (
        <>
          <CardSkeletonGrid count={5} />
          <div className="report-loading-filter">
            <Skeleton className="report-loading-search" />
            <Skeleton className="report-loading-input" />
            <Skeleton className="report-loading-input" />
            <Skeleton className="report-loading-input" />
          </div>
          <div className="table-card">
            <div className="report-table-title">
              <div>
                <FileText size={18} strokeWidth={2.3} />
                <strong>Detail Transaksi</strong>
              </div>
              <span>Memuat data</span>
            </div>
            <TableSkeleton rows={7} columns={7} />
          </div>
        </>
      ) : (
        <>
      <div className="report-summary">
        <div className="summary-card main">
          <span>Pendapatan valid</span>
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
        <div className="summary-card">
          <span>Rata-rata Transaksi</span>
          <h3>{formatRupiah(averageTransaction)}</h3>
        </div>
      </div>

      <div className="report-integrity-card">
        <div className="report-integrity-icon">
          <ShieldCheck size={22} strokeWidth={2.3} />
        </div>
        <div>
          <strong>Laporan dibuat untuk cetak atau simpan PDF.</strong>
          <p>
            Laporan diarahkan ke format cetak atau PDF supaya data transaksi
            tidak mudah diubah di luar sistem. Gunakan fitur Cetak Laporan, lalu
            pilih Save as PDF jika perlu arsip digital.
          </p>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-group search">
          <label>Pencarian</label>
          <div className="report-search-box">
            <Search size={16} strokeWidth={2.3} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kode transaksi atau item"
            />
          </div>
        </div>
        <div className="filter-group">
          <label>Dari Tanggal</label>
          <input
            type="date"
            className="filter-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Sampai Tanggal</label>
          <input
            type="date"
            className="filter-input"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Metode</label>
          <CustomSelect
            value={filterMethod}
            onChange={setFilterMethod}
            placeholder="Semua Metode"
            options={[
              { value: "Semua Metode", label: "Semua Metode", description: "Tanpa filter metode" },
              ...PAYMENT_METHOD_FILTERS.map((method) => ({
                value: method.value,
                label: method.label,
                description: "Metode pembayaran",
              })),
            ]}
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Semua Status"
            options={STATUS_FILTERS.map((status) => ({
              value: status.value,
              label: status.label,
              description:
                status.value === "Semua Status"
                  ? "Tanpa filter status"
                  : "Status transaksi",
            }))}
          />
        </div>
        <button
          className="btn-reset"
          onClick={() => {
            setStartDate("");
            setEndDate("");
            setFilterMethod("Semua Metode");
            setFilterStatus("Semua Status");
            setSearchQuery("");
          }}
        >
          Reset Filter
        </button>
      </div>

      {activeFilterLabels.length > 0 && (
        <div className="active-filter-row">
          <span>Filter aktif</span>
          {activeFilterLabels.map((label) => (
            <strong key={label}>{label}</strong>
          ))}
        </div>
      )}

      <div className="table-card">
        <div className="report-table-title">
          <div>
            <FileText size={18} strokeWidth={2.3} />
            <strong>Detail Transaksi</strong>
          </div>
          <span>{filteredTransactions.length} data</span>
        </div>
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
                      <div className="report-date-cell">
                        <strong>{datePart}</strong>
                        <span>{timePart}</span>
                      </div>
                    </td>
                    <td>
                      <div className="report-items-cell">
                        {Array.isArray(trx.items)
                          ? trx.items
                              .map((item) => `${item.name} (${item.qty ?? item.quantity ?? 0})`)
                              .join(", ")
                          : "Menu Locales"}
                      </div>
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
                >
                  <EmptyState
                    icon={Search}
                    title="Tidak ada transaksi yang sesuai."
                    description="Ubah tanggal, status, metode, atau kata kunci pencarian."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="print-signature-block">
        <div>
          <span>Mengetahui,</span>
          <strong>Admin / Owner</strong>
        </div>
        <div>
          <span>Dibuat oleh,</span>
          <strong>{currentUser?.full_name || currentUser?.username || "Petugas"}</strong>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default TransactionReport;
