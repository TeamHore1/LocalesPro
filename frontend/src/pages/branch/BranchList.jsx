import React, { useState } from "react";
import { useApp } from "../../store/AppContext";
import Button from "../../components/ui/Button";
import axios from "axios";
import "./Branch.css";

const BranchList = () => {
  const { branches, selectedBranch, setSelectedBranch, fetchBranches } =
    useApp();

  // 1. State untuk Modal dan Form
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
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
      const response = await axios.post(
        "http://localhost/Tugas/LocalPro/backend/api/branches/create.php",
        formData,
      );

      if (response.data.status === "success") {
        alert("Cabang berhasil ditambahkan!");
        setShowModal(false); // Tutup modal
        setFormData({ name: "", address: "", phone: "", status: "active" }); // Reset form
        if (fetchBranches) fetchBranches(); // Refresh data biar langsung muncul
      } else {
        alert("Gagal: " + response.data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Fungsi Hapus Cabang
  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah kamu yakin ingin menghapus cabang "${name}"?`)) {
      try {
        const response = await axios.post(
          "http://localhost/Tugas/LocalPro/backend/api/branches/delete.php",
          { id: id },
        );

        if (response.data.status === "success") {
          alert("Cabang berhasil dihapus!");
          if (fetchBranches) fetchBranches(); // Refresh list agar data terupdate
        } else {
          alert("Gagal menghapus: " + response.data.message);
        }
      } catch (error) {
        console.error("Error deleting branch:", error);
        alert("Terjadi kesalahan server saat menghapus cabang.");
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
              {/* Tombol Hapus: Hanya muncul jika cabang TIDAK sedang aktif */}
              {!isActive && (
                <button
                  className="delete-branch-btn"
                  onClick={() => handleDelete(branch.id, branch.name)}
                  title="Hapus Cabang"
                >
                  🗑️
                </button>
              )}

              {isActive && <div className="active-badge">Cabang Aktif</div>}

              <div className="branch-icon">{isActive ? "🏪" : "🏬"}</div>

              <div className="branch-info">
                <h3>{branch.name}</h3>
                <div className="info-item">
                  <span>📍</span>
                  <p>{branch.address}</p>
                </div>
                <div className="info-item">
                  <span>📞</span>
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
                ×
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
    </div>
  );
};

export default BranchList;
