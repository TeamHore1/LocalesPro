import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import "./Ingredient.css";

const IngredientList = () => {
  // Ambil selectedBranch dari context untuk memastikan data terikat ke cabang yang benar
  const {
    ingredients,
    addIngredient,
    deleteIngredient,
    updateIngredient,
    selectedBranch,
  } = useApp();

  // State untuk Modal & Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State Form disesuaikan dengan kebutuhan database
  const [formData, setFormData] = useState({
    name: "",
    stock: "", // Akan di-map ke stock_quantity di backend
    unit: "",
    minStock: "", // Akan di-map ke min_stock di backend
  });

  // --- 1. Logika Buka Modal ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: "", stock: "", unit: "", minStock: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setEditingId(item.id);
    // SINKRONISASI: Kita ambil data sesuai penamaan di phpMyAdmin
    setFormData({
      name: item.name || "",
      stock: item.stock_quantity || 0,
      unit: item.unit || "",
      minStock: item.min_stock || 0, // Mengambil min_stock dari DB untuk form
    });
    setIsModalOpen(true);
  };

  // --- 2. Logika Submit (Add / Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Payload dipastikan mengirim field yang dibutuhkan backend
    const payload = {
      ...formData,
      stock: parseFloat(formData.stock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      branch_id: selectedBranch?.id || 1,
    };

    try {
      if (isEditMode) {
        await updateIngredient(editingId, payload);
        alert(`Bahan ${formData.name} berhasil diperbarui!`);
      } else {
        await addIngredient(payload);
        alert(`Bahan ${formData.name} berhasil ditambahkan!`);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Terjadi kesalahan sistem. Cek koneksi API dan CORS.");
    }
  };

  // --- 3. Logika Hapus ---
  const handleDelete = async (id, name) => {
    if (
      window.confirm(`Hapus bahan "${name}"? Data ini tidak bisa dikembalikan.`)
    ) {
      try {
        await deleteIngredient(id);
      } catch (error) {
        alert(
          "Gagal hapus! Periksa apakah bahan ini masih digunakan dalam resep.",
        );
      }
    }
  };

  return (
    <div className="ingredient-container">
      <div className="header-page">
        <h2 style={{ color: "#092379" }}>Master Bahan Baku</h2>
        <button className="btn-add" onClick={openAddModal}>
          + Daftar Bahan Baru
        </button>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Nama Bahan</th>
              <th>Stok Saat Ini</th>
              <th>Satuan</th>
              <th>Batas Min.</th>
              <th style={{ textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(ingredients) && ingredients.length > 0 ? (
              ingredients.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td
                    style={{
                      // PERBAIKAN: Gunakan min_stock sesuai kolom DB agar deteksi warna merah jalan
                      color:
                        parseFloat(item.stock_quantity) <=
                        parseFloat(item.min_stock || 0)
                          ? "red"
                          : "inherit",
                      fontWeight: "bold",
                    }}
                  >
                    {parseFloat(item.stock_quantity || 0).toLocaleString()}
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    {/* PERBAIKAN: Menampilkan min_stock dari database, bukan minStock */}
                    {parseFloat(item.min_stock || 0).toLocaleString()}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center",
                      }}
                    >
                      <button
                        className="btn-edit-small"
                        onClick={() => openEditModal(item)}
                        title="Edit Bahan"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete-small"
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Hapus Bahan"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  Data tidak ditemukan di database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL (UNTUK TAMBAH & EDIT) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {isEditMode ? "🔧 Edit Bahan Baku" : "➕ Tambah Bahan Baru"}
              </h3>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nama Bahan</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div
                className="form-grid"
                style={{ display: "flex", gap: "15px" }}
              >
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Jumlah Stok</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Satuan (ml, gr, dll)</label>
                  <input
                    type="text"
                    value={formData.unit || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Batas Stok Minimum (Peringatan Merah)</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                  required
                />
              </div>

              <div
                className="modal-footer"
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  className="btn-cancel"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: "#092379",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {isEditMode ? "Simpan Perubahan" : "Tambahkan Bahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientList;
