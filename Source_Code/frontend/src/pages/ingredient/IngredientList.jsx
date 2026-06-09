import React, { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SideSheet from "../../components/ui/SideSheet";
import EmptyState from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  PackagePlus,
  Pencil,
  Scale,
  Search,
  Trash2,
} from "lucide-react";
import "./Ingredient.css";

const IngredientList = () => {
  // Ambil selectedBranch dari context untuk memastikan data terikat ke cabang yang benar
  const {
    ingredients,
    addIngredient,
    deleteIngredient,
    updateIngredient,
    selectedBranch,
    loading,
    loadError,
    refreshData,
  } = useApp();
  const toast = useToast();

  // State untuk Modal & Mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // State Form disesuaikan dengan kebutuhan database
  const [formData, setFormData] = useState({
    name: "",
    stock: "", // Akan di-map ke stock_quantity di backend
    unit: "",
    minStock: "", // Akan di-map ke min_stock di backend
  });
  const currentStock = parseFloat(formData.stock || 0);
  const minimumStock = parseFloat(formData.minStock || 0);
  const isBelowMinimum =
    formData.stock !== "" &&
    formData.minStock !== "" &&
    currentStock <= minimumStock;
  const unitOptions = ["ml", "gr", "pcs", "pack", "botol"];
  const ingredientStats = useMemo(() => {
    const items = Array.isArray(ingredients) ? ingredients : [];
    const lowStock = items.filter(
      (item) =>
        parseFloat(item.stock_quantity || 0) <= parseFloat(item.min_stock || 0),
    ).length;

    return {
      total: items.length,
      lowStock,
      safeStock: Math.max(items.length - lowStock, 0),
    };
  }, [ingredients]);
  const filteredIngredients = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const items = Array.isArray(ingredients) ? ingredients : [];

    return items.filter((item) => {
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

    const payload = {
      ...formData,
      stock: parseFloat(formData.stock) || 0,
      minStock: parseFloat(formData.minStock) || 0,
      branch_id: selectedBranch?.id || 1,
    };

    try {
      let result;

      if (isEditMode) {
        result = await updateIngredient(editingId, payload);
      } else {
        result = await addIngredient(payload);
      }

      toast.success(result.message || `Bahan ${formData.name} berhasil disimpan.`);
      setFormData({ name: "", stock: "", unit: "", minStock: "" });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan sistem. Cek koneksi API dan CORS.",
      );
    }
  };

  // --- 3. Logika Hapus ---
  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const result = await deleteIngredient(deleteTarget.id);
      toast.success(result.message || `Bahan ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Gagal hapus.");
    }
  };

  return (
    <div className="ingredient-container">
      <PageHeader
        title="Bahan Baku"
        subtitle="Pantau stok bahan, satuan, dan batas minimum per cabang."
        meta={`${filteredIngredients.length} bahan`}
        actions={<Button onClick={openAddModal}>+ Tambah Bahan Baku Baru</Button>}
      />

      <div className="ingredient-summary-grid">
        <div className="ingredient-stat-card total">
          <span>Total bahan</span>
          <strong>{ingredientStats.total}</strong>
          <p>{selectedBranch?.name || "Cabang aktif"}</p>
        </div>
        <div className="ingredient-stat-card safe">
          <span>Stok aman</span>
          <strong>{ingredientStats.safeStock}</strong>
          <p>Di atas batas minimum</p>
        </div>
        <div className="ingredient-stat-card warning">
          <span>Perlu perhatian</span>
          <strong>{ingredientStats.lowStock}</strong>
          <p>Stok minimum atau lebih rendah</p>
        </div>
      </div>

      <div className="ingredient-toolbar">
        <div className="ingredient-search-box">
          <Search size={17} strokeWidth={2.3} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari bahan atau satuan..."
          />
        </div>
        <div className="ingredient-filter-tabs">
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

      <div className="table-card">
        {loadError && ingredients.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Bahan baku gagal dimuat."
            description={loadError}
            actionLabel="Coba Lagi"
            onAction={refreshData}
            variant="error"
          />
        ) : loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
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
            {filteredIngredients.length > 0 ? (
              filteredIngredients.map((item) => {
                const stock = parseFloat(item.stock_quantity || 0);
                const minimum = parseFloat(item.min_stock || 0);
                const isLow = stock <= minimum;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="ingredient-name-cell">
                        <strong>{item.name}</strong>
                        <span>{selectedBranch?.name || "Cabang aktif"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ingredient-stock-cell">
                        <strong className={isLow ? "low" : ""}>
                          {stock.toLocaleString("id-ID")} {item.unit}
                        </strong>
                        <span className={`stock-state-pill ${isLow ? "low" : "safe"}`}>
                          {isLow ? "Menipis" : "Aman"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="ingredient-unit-pill">{item.unit}</span>
                    </td>
                    <td>
                      {minimum.toLocaleString("id-ID")} {item.unit}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="ingredient-row-actions">
                        <button
                          className="btn-edit-small"
                          onClick={() => openEditModal(item)}
                          title="Edit Bahan"
                        >
                          <Pencil size={14} strokeWidth={2.3} />
                          Edit
                        </button>
                        <button
                          className="btn-delete-small"
                          onClick={() => setDeleteTarget(item)}
                          title="Hapus Bahan"
                        >
                          <Trash2 size={14} strokeWidth={2.3} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="ingredient-empty-row"
                >
                  <EmptyState
                    icon={AlertTriangle}
                    title="Belum ada bahan yang cocok."
                    description="Ubah pencarian atau filter stok untuk melihat data lain."
                    actionLabel={ingredients.length === 0 ? "Tambah Bahan" : undefined}
                    onAction={ingredients.length === 0 ? openAddModal : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
          </table>
        )}
      </div>

      <SideSheet
        isOpen={isModalOpen}
        title={isEditMode ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
        subtitle="Atur stok awal, satuan, dan batas minimum bahan untuk cabang aktif."
        onClose={() => setIsModalOpen(false)}
        width="560px"
        footer={
          <div className="ingredient-sheet-actions">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="ingredient-form">
              {isEditMode ? "Simpan Perubahan" : "Tambahkan Bahan"}
            </Button>
          </div>
        }
      >
        <form
          id="ingredient-form"
          onSubmit={handleSubmit}
          className="modal-form ingredient-sheet-form"
        >
          <div className="ingredient-sheet-hero">
            <div className="ingredient-sheet-icon">
              <PackagePlus size={24} strokeWidth={2.3} />
            </div>
            <div>
              <span>Bahan untuk {selectedBranch?.name || "cabang aktif"}</span>
              <strong>{formData.name || "Nama bahan belum diisi"}</strong>
              <p>
                {formData.unit
                  ? `Stok dicatat dalam satuan ${formData.unit}.`
                  : "Pilih satuan supaya stok dan laporan konsisten."}
              </p>
            </div>
          </div>

          <div className="ingredient-metric-grid">
            <div className="ingredient-metric-card">
              <span>Stok awal</span>
              <strong>
                {currentStock.toLocaleString("id-ID")} {formData.unit || "unit"}
              </strong>
            </div>
            <div
              className={`ingredient-metric-card ${
                isBelowMinimum ? "warning" : "safe"
              }`}
            >
              <span>Batas minimum</span>
              <strong>
                {minimumStock.toLocaleString("id-ID")} {formData.unit || "unit"}
              </strong>
            </div>
          </div>

          <div className="form-group">
            <label>
              <Boxes size={16} strokeWidth={2.4} />
              Nama Bahan
            </label>
            <input
              type="text"
              value={formData.name || ""}
              placeholder="Contoh: Bubuk matcha premium"
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>
                <PackagePlus size={16} strokeWidth={2.4} />
                Jumlah Stok
              </label>
              <input
                type="number"
                step="any"
                value={formData.stock}
                placeholder="Contoh: 5000"
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Scale size={16} strokeWidth={2.4} />
                Satuan
              </label>
              <input
                type="text"
                value={formData.unit || ""}
                placeholder="ml, gr, pcs..."
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="ingredient-unit-row" aria-label="Pilihan satuan cepat">
            {unitOptions.map((unit) => (
              <button
                key={unit}
                type="button"
                className={formData.unit === unit ? "active" : ""}
                onClick={() => setFormData({ ...formData, unit })}
              >
                {unit}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label>
              <AlertTriangle size={16} strokeWidth={2.4} />
              Batas Stok Minimum
            </label>
            <input
              type="number"
              value={formData.minStock}
              placeholder="Contoh: 500"
              onChange={(e) =>
                setFormData({ ...formData, minStock: e.target.value })
              }
              required
            />
            <small>
              Sistem akan menandai bahan saat stok berada di batas ini atau lebih
              rendah.
            </small>
          </div>
        </form>
      </SideSheet>

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Bahan"
        message={`Hapus bahan "${deleteTarget?.name || ""}"? Data ini tidak bisa dikembalikan.`}
        confirmText="Hapus Bahan"
        cancelText="Batal"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default IngredientList;
