import React, { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { getAuthUser } from "../../utils/auth";
import PageHeader from "../../components/ui/PageHeader";
import SideSheet from "../../components/ui/SideSheet";
import EmptyState from "../../components/ui/EmptyState";
import { CardSkeletonGrid, Skeleton, TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { AlertCircle, AlertTriangle, Boxes, Search, TrendingUp } from "lucide-react";
import "./StockList.css";

const formatMovementLabel = (movementType) => {
  switch (movementType) {
    case "sale":
      return "Penjualan";
    case "void_restore":
      return "Void Transaksi";
    case "stock_in":
      return "Tambah Stok";
    case "stock_out":
      return "Koreksi Keluar";
    default:
      return "Mutasi";
  }
};

const StockList = () => {
  const {
    ingredients,
    stockMovements = [],
    updateStock,
    loading,
    selectedBranch,
    loadError,
    refreshData,
  } = useApp();
  const toast = useToast();
  const [selectedIng, setSelectedIng] = useState(null);
  const [amount, setAmount] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const currentUser = getAuthUser();
  const isCashier = currentUser?.role === "cashier";
  const canAdjustStock = ["admin", "cashier"].includes(currentUser?.role);
  const isInitialLoading = loading && ingredients.length === 0;
  const selectedStock = parseFloat(selectedIng?.stock_quantity || 0);
  const incomingStock = parseFloat(amount || 0);
  const projectedStock =
    selectedIng && Number.isFinite(incomingStock)
      ? selectedStock + Math.max(incomingStock, 0)
      : selectedStock;
  const stockStats = useMemo(() => {
    const lowStock = ingredients.filter(
      (item) =>
        parseFloat(item.stock_quantity || 0) <= parseFloat(item.min_stock || 0),
    ).length;

    return {
      total: ingredients.length,
      safeStock: Math.max(ingredients.length - lowStock, 0),
      lowStock,
      movements: stockMovements.length,
    };
  }, [ingredients, stockMovements.length]);
  const filteredIngredients = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return ingredients.filter((item) => {
      const stock = parseFloat(item.stock_quantity || 0);
      const minimum = parseFloat(item.min_stock || 0);
      const isLow = stock <= minimum;
      const matchKeyword = keyword
        ? `${item.name || ""} ${item.unit || ""}`.toLowerCase().includes(keyword)
        : true;
      const matchFilter =
        stockFilter === "low"
          ? isLow
          : stockFilter === "safe"
            ? !isLow
            : true;

      return matchKeyword && matchFilter;
    });
  }, [ingredients, searchQuery, stockFilter]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Validasi input: tidak boleh kosong atau 0
    if (!selectedIng || !amount || parseFloat(amount) <= 0) {
      toast.warning("Masukkan jumlah stok yang valid.");
      return;
    }

    try {
      // Menunggu proses update selesai di server (MySQL)
      await updateStock(
        selectedIng.id,
        amount,
        stockNote.trim() ||
          (isCashier
            ? "Stok masuk diterima kasir cabang."
            : "Penambahan stok masuk dari halaman manajemen stok."),
      );

      toast.success(`Stok masuk ${selectedIng.name} berhasil dicatat.`);
      setSelectedIng(null);
      setAmount("");
      setStockNote("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Gagal memperbarui stok.",
      );
    }
  };

  return (
    <div className="stock-container">
      <PageHeader
        title="Manajemen Stok Bahan Baku"
        subtitle="Pantau stok masuk, stok keluar, dan sisa akhir bahan baku."
        meta={`${filteredIngredients.length} bahan`}
      />

      {isInitialLoading ? (
        <CardSkeletonGrid count={4} />
      ) : (
        <div className="stock-summary-grid">
        <div className="stock-stat-card total">
          <span>Total bahan</span>
          <strong>{stockStats.total}</strong>
          <p>{selectedBranch?.name || "Cabang aktif"}</p>
        </div>
        <div className="stock-stat-card safe">
          <span>Stok aman</span>
          <strong>{stockStats.safeStock}</strong>
          <p>Di atas batas minimum</p>
        </div>
        <div className="stock-stat-card warning">
          <span>Perlu restock</span>
          <strong>{stockStats.lowStock}</strong>
          <p>Minimum atau lebih rendah</p>
        </div>
        <div className="stock-stat-card movement">
          <span>Mutasi</span>
          <strong>{stockStats.movements}</strong>
          <p>Riwayat cabang aktif</p>
        </div>
        </div>
      )}

      <div className="stock-toolbar">
        <div className="stock-search-box">
          <Search size={17} strokeWidth={2.3} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari bahan atau satuan..."
          />
        </div>
        <div className="stock-filter-tabs">
          {[
            { value: "all", label: "Semua" },
            { value: "safe", label: "Aman" },
            { value: "low", label: "Menipis" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={stockFilter === item.value ? "active" : ""}
              onClick={() => setStockFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stock-grid">
        {loadError && ingredients.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Stok gagal dimuat."
            description={loadError}
            actionLabel="Coba Lagi"
            onAction={refreshData}
            variant="error"
          />
        ) : isInitialLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="stock-card stock-card-skeleton">
              <div className="stock-card-top">
                <Skeleton className="stock-skeleton-chip" />
                <Skeleton className="stock-skeleton-unit" />
              </div>
              <Skeleton className="stock-skeleton-title" />
              <Skeleton className="stock-skeleton-number" />
              <Skeleton className="stock-skeleton-line" />
              <Skeleton className="stock-skeleton-button" />
            </div>
          ))
        ) : filteredIngredients.length > 0 ? (
          filteredIngredients.map((ing) => {
            const stock = parseFloat(ing.stock_quantity || 0);
            const minimum = parseFloat(ing.min_stock || 0);
            const isLow = stock <= minimum;

            return (
              <div key={ing.id} className={`stock-card ${isLow ? "low" : "safe"}`}>
                <div className="stock-info">
                  <div className="stock-card-top">
                    <span className={`stock-status-chip ${isLow ? "low" : "safe"}`}>
                      {isLow ? "Menipis" : "Aman"}
                    </span>
                    <span className="stock-unit-chip">{ing.unit}</span>
                  </div>
                  <h3>{ing.name}</h3>
                  <div className="stock-badge">
                    <span>{stock.toLocaleString("id-ID")}</span>
                    <small>{ing.unit}</small>
                  </div>
                  <p className="unit">
                    Minimum: {minimum.toLocaleString("id-ID")} {ing.unit}
                  </p>
                </div>
                {canAdjustStock ? (
                  <button
                    className="btn-add-stock"
                    onClick={() => setSelectedIng(ing)}
                  >
                    <TrendingUp size={15} strokeWidth={2.3} />
                    {isCashier ? "Terima Stok" : "Update Stok"}
                  </button>
                ) : (
                  <div className="stock-readonly-tag">Lihat Saja</div>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-stock-msg">
            <EmptyState
              icon={AlertTriangle}
              title="Belum ada bahan yang cocok."
              description="Ubah pencarian atau filter stok untuk melihat data lain."
            />
          </div>
        )}
      </div>

      <div className="stock-history-card">
        <div className="stock-history-header">
          <div>
            <h3>Riwayat Mutasi Stok</h3>
            <p>Lacak stok masuk, stok keluar, dan sisa akhir per cabang.</p>
          </div>
        </div>

        {isInitialLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : stockMovements.length > 0 ? (
          <div className="stock-history-table-wrap">
            <table className="stock-history-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Bahan</th>
                  <th>Jenis</th>
                  <th>Jumlah</th>
                  <th>Sisa Akhir</th>
                  <th>Petugas</th>
                </tr>
              </thead>
              <tbody>
                {stockMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.created_at || "-"}</td>
                    <td>
                      <strong>{movement.ingredient_name || "Bahan"}</strong>
                      <div className="stock-history-note">
                        {movement.notes || movement.branch_name || "-"}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`movement-badge ${movement.direction === "out" ? "out" : "in"}`}
                      >
                        {formatMovementLabel(movement.movement_type)}
                      </span>
                    </td>
                    <td
                      className={
                        movement.direction === "out"
                          ? "movement-qty out"
                          : "movement-qty in"
                      }
                    >
                      {movement.direction === "out" ? "-" : "+"}
                      {parseFloat(movement.quantity || 0).toLocaleString("id-ID")}{" "}
                      {movement.ingredient_unit || ""}
                    </td>
                    <td>
                      {parseFloat(movement.stock_after || 0).toLocaleString("id-ID")}{" "}
                      {movement.ingredient_unit || ""}
                    </td>
                    <td>{movement.actor_name || "Sistem"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-stock-msg history-empty">
            <EmptyState
              icon={Boxes}
              title="Belum ada riwayat mutasi stok."
              description="Saat stok masuk, penjualan, atau void terjadi, riwayatnya akan tampil di sini."
            />
          </div>
        )}
      </div>

      <SideSheet
        isOpen={Boolean(selectedIng && canAdjustStock)}
        title={`${isCashier ? "Terima Stok Masuk" : "Update Stok"}${
          selectedIng ? `: ${selectedIng.name}` : ""
        }`}
        subtitle={
          isCashier
            ? "Catat barang datang untuk cabang aktif. Riwayat mutasi tersimpan atas nama kasir."
            : "Tambahkan jumlah stok masuk. Riwayat mutasi akan tersimpan untuk cabang aktif."
        }
        onClose={() => {
          setSelectedIng(null);
          setAmount("");
          setStockNote("");
        }}
        width="460px"
        footer={
          <div className="stock-sheet-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setSelectedIng(null);
                setAmount("");
                setStockNote("");
              }}
            >
              Batal
            </button>
            <button type="submit" form="stock-update-form" className="btn-save">
              {isCashier ? "Simpan Stok Masuk" : "Simpan Perubahan"}
            </button>
          </div>
        }
      >
        {selectedIng && (
          <form
            id="stock-update-form"
            onSubmit={handleUpdate}
            className="stock-sheet-form"
          >
            <div className="stock-sheet-hero">
              <div className="stock-sheet-icon">
                <Boxes size={25} strokeWidth={2.3} />
              </div>
              <div>
                <span>Bahan baku</span>
                <strong>{selectedIng.name}</strong>
                <p>Satuan stok: {selectedIng.unit}</p>
              </div>
            </div>

            <div className="stock-metric-grid">
              <div className="stock-update-summary">
                <span>Stok Saat Ini</span>
                <strong>
                  {selectedStock.toLocaleString("id-ID")} {selectedIng.unit}
                </strong>
              </div>
              <div className="stock-update-summary projected">
                <span>Estimasi Akhir</span>
                <strong>
                  {projectedStock.toLocaleString("id-ID")} {selectedIng.unit}
                </strong>
              </div>
            </div>

            <div className="form-group">
              <label>
                <TrendingUp size={15} strokeWidth={2.2} /> Jumlah Masuk ({selectedIng.unit})
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Contoh: 100 atau 0.5"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label>Catatan Penerimaan</label>
              <textarea
                value={stockNote}
                onChange={(event) => setStockNote(event.target.value)}
                rows="3"
                maxLength={180}
                placeholder="Contoh: barang datang dari pusat atau supplier pagi."
              />
              <small className="stock-note-hint">
                Opsional, tapi bagus untuk audit stok cabang.
              </small>
            </div>
          </form>
        )}
      </SideSheet>
    </div>
  );
};

export default StockList;
