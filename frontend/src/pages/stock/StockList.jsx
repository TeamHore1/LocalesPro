import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import { formatRupiah } from "../../utils/currency";
import "./StockList.css";

const StockList = () => {
  const { ingredients, updateStock, loading } = useApp();
  const [selectedIng, setSelectedIng] = useState(null);
  const [amount, setAmount] = useState("");

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
              <button
                className="btn-add-stock"
                onClick={() => setSelectedIng(ing)}
              >
                + Update Stok
              </button>
            </div>
          ))
        ) : (
          <div className="empty-stock-msg">
            <p>Belum ada data bahan baku di database.</p>
          </div>
        )}
      </div>

      {/* Modal Tambah/Update Stok */}
      {selectedIng && (
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
