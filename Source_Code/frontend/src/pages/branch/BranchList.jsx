import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SideSheet from "../../components/ui/SideSheet";
import CustomSelect from "../../components/ui/CustomSelect";
import EmptyState from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { AlertCircle, Building2, MapPinned, Phone, ShieldCheck } from "lucide-react";
import "./Branch.css";

const BRANCH_STATUS_OPTIONS = [
  { value: "active", label: "Aktif", description: "Cabang dapat dipakai kasir" },
  { value: "inactive", label: "Nonaktif", description: "Cabang disembunyikan sementara" },
];

const BranchList = () => {
  const {
    branches,
    selectedBranch,
    setSelectedBranch,
    addBranch,
    deleteBranch,
    updateBranch,
    loading: appLoading,
    loadError,
    refreshData,
  } = useApp();
  const toast = useToast();

  // 1. State untuk Modal dan Form
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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
      toast.success(result.message || "Cabang berhasil ditambahkan.");
      setShowModal(false);
      setFormData({ name: "", address: "", phone: "", status: "active" });
    } catch (error) {
      console.error("Error:", error);
      toast.error(
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
      toast.success(result.message || "Cabang berhasil diperbarui.");
      setShowEditModal(false);
      setEditingBranch(null);
      setFormData({ name: "", address: "", phone: "", status: "active" });
    } catch (error) {
      console.error("Error:", error);
      toast.error(
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
  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const result = await deleteBranch(deleteTarget.id);
      toast.success(result.message || "Cabang berhasil dihapus.");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error(
        error.userMessage ||
          error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan server saat menghapus cabang.",
      );
    }
  };

  return (
    <div className="branch-container">
      <PageHeader
        title="Manajemen Cabang"
        subtitle="Pilih cabang aktif untuk operasional kasir, stok, dan laporan."
        meta={`${branches.length} cabang`}
        actions={<Button onClick={() => setShowModal(true)}>+ Tambah Cabang Baru</Button>}
      />

      <div className="branch-grid">
        {loadError && branches.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Cabang gagal dimuat."
            description={loadError}
            actionLabel="Coba Lagi"
            onAction={refreshData}
            variant="error"
          />
        ) : appLoading && branches.length === 0 ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="branch-card branch-card-skeleton">
              <Skeleton className="branch-skeleton-badge" />
              <Skeleton className="branch-skeleton-title" />
              <Skeleton className="branch-skeleton-line" />
              <Skeleton className="branch-skeleton-line wide" />
              <Skeleton className="branch-skeleton-button" />
            </div>
          ))
        ) : branches.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Belum ada cabang."
            description="Tambahkan cabang pertama agar kasir, stok, dan laporan punya lokasi operasional."
            actionLabel="Tambah Cabang"
            onAction={() => setShowModal(true)}
          />
        ) : branches.map((branch) => {
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
                    onClick={() => setDeleteTarget(branch)}
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

      <SideSheet
        isOpen={showModal}
        title="Tambah Cabang Baru"
        subtitle="Lengkapi identitas cabang agar bisa dipakai untuk kasir, stok, dan laporan."
        onClose={() => setShowModal(false)}
        width="560px"
        footer={
          <div className="branch-sheet-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="branch-add-form" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Cabang"}
            </Button>
          </div>
        }
      >
        <div className="branch-sheet-hero">
          <div className="branch-sheet-icon">
            <Building2 size={24} strokeWidth={2.3} />
          </div>
          <div>
            <span>Cabang operasional</span>
            <strong>{formData.name || "Nama cabang belum diisi"}</strong>
            <p>{formData.address || "Alamat cabang akan tampil di sini."}</p>
          </div>
        </div>

        <form id="branch-add-form" onSubmit={handleSubmit} className="branch-form">
          <div className="input-group">
            <label>
              <Building2 size={15} strokeWidth={2.2} /> Nama Cabang
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Locales - Dago"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <MapPinned size={15} strokeWidth={2.2} /> Alamat
            </label>
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
              <label>
                <Phone size={15} strokeWidth={2.2} /> No. Telepon
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0812..."
              />
            </div>
            <div className="input-group">
              <label>
                <ShieldCheck size={15} strokeWidth={2.2} /> Status
              </label>
              <CustomSelect
                value={formData.status}
                options={BRANCH_STATUS_OPTIONS}
                placeholder="Pilih status"
                onChange={(value) =>
                  handleChange({ target: { name: "status", value } })
                }
              />
            </div>
          </div>
        </form>
      </SideSheet>

      <SideSheet
        isOpen={showEditModal}
        title="Edit Cabang"
        subtitle="Perbarui data cabang tanpa mengubah konteks daftar cabang di belakang."
        onClose={() => setShowEditModal(false)}
        width="560px"
        footer={
          <div className="branch-sheet-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="branch-edit-form" disabled={loading}>
              {loading ? "Memperbarui..." : "Perbarui Cabang"}
            </Button>
          </div>
        }
      >
        <div className="branch-sheet-hero">
          <div className="branch-sheet-icon">
            <Building2 size={24} strokeWidth={2.3} />
          </div>
          <div>
            <span>Cabang operasional</span>
            <strong>{formData.name || "Nama cabang belum diisi"}</strong>
            <p>{formData.address || "Alamat cabang akan tampil di sini."}</p>
          </div>
        </div>

        <form id="branch-edit-form" onSubmit={handleUpdate} className="branch-form">
          <div className="input-group">
            <label>
              <Building2 size={15} strokeWidth={2.2} /> Nama Cabang
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Locales - Dago"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <MapPinned size={15} strokeWidth={2.2} /> Alamat
            </label>
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
              <label>
                <Phone size={15} strokeWidth={2.2} /> No. Telepon
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0812..."
              />
            </div>
            <div className="input-group">
              <label>
                <ShieldCheck size={15} strokeWidth={2.2} /> Status
              </label>
              <CustomSelect
                value={formData.status}
                options={BRANCH_STATUS_OPTIONS}
                placeholder="Pilih status"
                onChange={(value) =>
                  handleChange({ target: { name: "status", value } })
                }
              />
            </div>
          </div>
        </form>
      </SideSheet>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Cabang"
        message={`Apakah kamu yakin ingin menghapus cabang "${deleteTarget?.name || ""}"?`}
        confirmText="Hapus Cabang"
        cancelText="Batal"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default BranchList;
