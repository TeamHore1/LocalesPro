import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import "./Branch.css";

const BranchList = () => {
  const {
    branches,
    selectedBranch,
    setSelectedBranch,
    addBranch,
    deleteBranch,
    updateBranch,
  } = useApp();

  // 1. State untuk Modal dan Form
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    status: "active",
  });

  // 2. Fungsi Handle Input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Fungsi Kirim Data ke Backend (Tambah Cabang)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await addBranch(formData);
      alert(result.message || "Cabang berhasil ditambahkan!");
      setShowModal(false);
      setFormData({ name: "", address: "", phone: "", status: "active" });
    } catch (error) {
      console.error("Error:", error);
      alert(
        error.userMessage ||
          error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan koneksi ke server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 3b. Fungsi Buka Modal Edit
  const handleEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || "",
      status: branch.status || "active",
    });
    setShowEditModal(true);
  };

  // 3c. Fungsi Update Cabang
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateBranch(editingBranch.id, formData);
      alert(result.message || "Cabang berhasil diperbarui!");
      setShowEditModal(false);
      setEditingBranch(null);
      setFormData({ name: "", address: "", phone: "", status: "active" });
    } catch (error) {
      console.error("Error:", error);
      alert(
        error.userMessage ||
          error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan koneksi ke server.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 4. Fungsi Hapus Cabang
  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah kamu yakin ingin menghapus cabang "${name}"?`)) {
      try {
        const result = await deleteBranch(id);
        alert(result.message || "Cabang berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting branch:", error);
        alert(
          error.userMessage ||
            error.response?.data?.message ||
            error.message ||
            "Terjadi kesalahan server saat menghapus cabang.",
        );
      }
    }
  };

  return (
    <div className="branch-container">
      <div className="header-page">
        <div className="header-title">
          <h2 style={{ color: "#092379" }}>Manajemen Cabang</h2>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Pilih cabang aktif untuk operasional kasir dan laporan
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Tambah Cabang Baru</Button>
      </div>

      <div className="branch-grid">
        {branches.map((branch) => {
          const isActive = selectedBranch?.id === branch.id;

          return (
            <div
              key={branch.id}
              className={`branch-card ${isActive ? "active" : ""}`}
            >
              {/* Tombol Edit dan Hapus: Hanya muncul jika cabang TIDAK sedang aktif */}
              {!isActive && (
                <div className="branch-actions">
                  <button
                    className="edit-branch-btn"
                    onClick={() => handleEdit(branch)}
                    title="Edit Cabang"
                  >
                    Edit
                  </button>
                  <button
                    className="delete-branch-btn"
                    onClick={() => handleDelete(branch.id, branch.name)}
                    title="Hapus Cabang"
                  >
                    Hapus
                  </button>
                </div>
              )}

              {isActive && <div className="active-badge">Cabang Aktif</div>}

              <div className="branch-icon">{isActive ? "Aktif" : "Cabang"}</div>

              <div className="branch-info">
                <h3>{branch.name}</h3>
                <div className="info-item">
                  <span>Alamat</span>
                  <p>{branch.address}</p>
                </div>
                <div className="info-item">
                  <span>Telepon</span>
                  <p>{branch.phone || "-"}</p>
                </div>
              </div>

              <div className="branch-footer">
                <Button
                  variant={isActive ? "primary" : "outline"}
                  onClick={() => setSelectedBranch(branch)}
                  style={{ width: "100%" }}
                  disabled={isActive}
                >
                  {isActive ? "Sedang Digunakan" : "Pilih Cabang Ini"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL TAMBAH CABANG --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header-form">
              <h3>Tambah Cabang Baru</h3>
              <button className="close-x" onClick={() => setShowModal(false)}>
                X
              </button>
            </div>

            <form onSubmit={handleSubmit} className="branch-form">
              <div className="input-group">
                <label>Nama Cabang</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Locales - Dago"
                  required
                />
              </div>

              <div className="input-group">
                <label>Alamat</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Alamat lengkap cabang..."
                  required
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>No. Telepon</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812..."
                  />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Cabang"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT CABANG --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header-form">
              <h3>Edit Cabang</h3>
              <button className="close-x" onClick={() => setShowEditModal(false)}>
                X
              </button>
            </div>

            <form onSubmit={handleUpdate} className="branch-form">
              <div className="input-group">
                <label>Nama Cabang</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Locales - Dago"
                  required
                />
              </div>

              <div className="input-group">
                <label>Alamat</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Alamat lengkap cabang..."
                  required
                />
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label>No. Telepon</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812..."
                  />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Memperbarui..." : "Perbarui Cabang"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchList;
