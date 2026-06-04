import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { getAuthUser } from "../../utils/auth";
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
  const { ingredients, stockMovements = [], updateStock, loading, selectedBranch } =
    useApp();
  const [selectedIng, setSelectedIng] = useState(null);
  const [amount, setAmount] = useState("");
  const currentUser = getAuthUser();
  const canAdjustStock = currentUser?.role === "admin";

  const handleUpdate = async (e) => {
    e.preventDefault();
    // Validasi input: tidak boleh kosong atau 0
    if (!selectedIng || !amount || parseFloat(amount) <= 0) {
      alert("Masukkan jumlah stok yang valid.");
      return;
    }

    // Menunggu proses update selesai di server (MySQL)
    await updateStock(selectedIng.id, amount);

    alert(`Stok ${selectedIng.name} berhasil diperbarui!`);
    setSelectedIng(null);
    setAmount("");
  };

  // Tampilan saat data sedang ditarik dari database
  if (loading && ingredients.length === 0) {
    return <div className="stock-loading">Menghubungkan ke gudang data...</div>;
  }

  return (
    <div className="stock-container">
      <div className="header-page">
        <h2 style={{ color: "#092379" }}>Manajemen Stok Bahan Baku</h2>
        <p className="subtitle">
          Pantau dan kelola ketersediaan bahan baku Locales
        </p>
        <p className="stock-branch-indicator">
          Cabang aktif: <strong>{selectedBranch?.name || "Semua cabang"}</strong>
        </p>
      </div>

      <div className="stock-grid">
        {ingredients.length > 0 ? (
          ingredients.map((ing) => (
            <div key={ing.id} className="stock-card">
              <div className="stock-info">
                <h3>{ing.name}</h3>
                <p className="unit">Satuan: {ing.unit}</p>
                <div className="stock-badge">
                  {/* Konsisten menggunakan stock_quantity sesuai kolom MySQL */}
                  Sisa: <span>{parseFloat(ing.stock_quantity || 0)}</span>
                </div>
              </div>
              {canAdjustStock ? (
                <button
                  className="btn-add-stock"
                  onClick={() => setSelectedIng(ing)}
                >
                  + Update Stok
                </button>
              ) : (
                <div className="stock-readonly-tag">Lihat Saja</div>
              )}
            </div>
          ))
        ) : (
          <div className="empty-stock-msg">
            <p>Belum ada data bahan baku di database.</p>
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

        {stockMovements.length > 0 ? (
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
            <p>Belum ada riwayat mutasi stok untuk cabang ini.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah/Update Stok */}
      {selectedIng && canAdjustStock && (
        <div className="modal-overlay">
          <div className="modal-content stock-modal">
            <div className="modal-header">
              <h3>Update Stok: {selectedIng.name}</h3>
              <p>Tambahkan jumlah stok yang masuk ke sistem.</p>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Jumlah Masuk ({selectedIng.unit})</label>
                <input
                  type="number"
                  step="any" // Mendukung angka desimal jika diperlukan
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 100 atau 0.5"
                  autoFocus
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setSelectedIng(null);
                    setAmount("");
                  }}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockList;
