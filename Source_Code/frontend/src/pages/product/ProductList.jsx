import React, { useMemo, useState } from "react";
import { useApp } from "../../hooks/useApp";
import { formatRupiah } from "../../utils/currency";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import SideSheet from "../../components/ui/SideSheet";
import CustomSelect from "../../components/ui/CustomSelect";
import EmptyState from "../../components/ui/EmptyState";
import { TableSkeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import {
  AlertCircle,
  ClipboardList,
  Eye,
  ImagePlus,
  ListChecks,
  Pencil,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import "./Product.css";

const ProductList = () => {
  const {
    products,
    ingredients,
    addProduct,
    deleteProduct,
    updateProduct,
    loading,
    loadError,
    refreshData,
  } = useApp();
  const toast = useToast();
  const productStatusOptions = [
    { value: "active", label: "Aktif", description: "Menu tampil di POS" },
    { value: "inactive", label: "Nonaktif", description: "Menu disembunyikan" },
  ];
  const categoryOptions = useMemo(() => {
    const defaults = ["Milk Tea", "Tea", "Coffee"];
    const existing = products
      .map((product) => String(product.category || "").trim())
      .filter(Boolean);

    return [...new Set([...defaults, ...existing])].sort((a, b) =>
      a.localeCompare(b, "id-ID"),
    );
  }, [products]);

  // State untuk Kontrol Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedProductRecipe, setSelectedProductRecipe] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // State Utama Form
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Milk Tea",
    status: "active",
    image_url: null,
    recipe: [],
  });

  // State Input Bahan Sementara
  const [tempIngredient, setTempIngredient] = useState({ id: "", amount: "" });
  const productStats = useMemo(() => {
    const active = products.filter(
      (product) => String(product.status || "active").toLowerCase() === "active",
    ).length;
    const categories = new Set(
      products
        .map((product) => String(product.category || "").trim())
        .filter(Boolean),
    );

    return {
      total: products.length,
      active,
      inactive: Math.max(products.length - active, 0),
      categories: categories.size,
    };
  }, [products]);
  const filteredProducts = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const category = String(product.category || "Tanpa kategori").trim();
      const status = String(product.status || "active").toLowerCase();
      const recipeText = Array.isArray(product.recipe)
        ? product.recipe.map((item) => item.name).join(" ")
        : "";
      const matchKeyword = keyword
        ? `${product.name || ""} ${category} ${recipeText}`.toLowerCase().includes(keyword)
        : true;
      const matchCategory =
        categoryFilter === "all" ? true : category === categoryFilter;
      const matchStatus = statusFilter === "all" ? true : status === statusFilter;

      return matchKeyword && matchCategory && matchStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // --- 1. Logika File / Gambar (Auto-Crop 1:1) ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const size = Math.min(img.width, img.height);
          canvas.width = 400;
          canvas.height = 400;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            (img.width - size) / 2,
            (img.height - size) / 2,
            size,
            size,
            0,
            0,
            400,
            400,
          );

          const base64Canvas = canvas.toDataURL("image/jpeg", 0.7);
          setFormData((prev) => ({ ...prev, image_url: base64Canvas }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // --- 2. Logika Manajemen Resep ---
  const addIngredientToRecipe = () => {
    if (!tempIngredient.id || !tempIngredient.amount) {
      toast.warning("Pilih bahan dan isi jumlahnya terlebih dahulu.");
      return;
    }

    const ingInfo = ingredients.find(
      (i) => String(i.id) === String(tempIngredient.id),
    );

    if (!ingInfo) {
      toast.error("Bahan baku tidak ditemukan.");
      return;
    }

    const existingIndex = formData.recipe.findIndex(
      (item) => String(item.ingredientId) === String(ingInfo.id),
    );

    if (existingIndex !== -1) {
      const updatedRecipe = [...formData.recipe];
      updatedRecipe[existingIndex].amount += parseFloat(tempIngredient.amount);
      setFormData({ ...formData, recipe: updatedRecipe });
    } else {
      const newItem = {
        ingredientId: ingInfo.id,
        name: ingInfo.name,
        amount: parseFloat(tempIngredient.amount),
        unit: ingInfo.unit,
      };
      setFormData({ ...formData, recipe: [...formData.recipe, newItem] });
    }

    setTempIngredient({ id: "", amount: "" });
  };

  const removeIngredientFromRecipe = (id) => {
    setFormData({
      ...formData,
      recipe: formData.recipe.filter(
        (item) => String(item.ingredientId) !== String(id),
      ),
    });
  };

  // --- 3. Logika Buka Modal ---
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: "",
      price: "",
      category: "Milk Tea",
      status: "active",
      image_url: null,
      recipe: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category || "Milk Tea",
      status: product.status || "active",
      image_url: product.image_url,
      recipe: product.recipe || [],
    });
    setIsModalOpen(true);
  };

  // --- 4. Logika Submit (Perbaikan Utama) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const normalizedCategory = String(formData.category || "").trim();

    if (!normalizedCategory) {
      toast.warning("Kategori menu wajib diisi.");
      return;
    }

    if (formData.recipe.length === 0) {
      toast.warning("Resep tidak boleh kosong. Tambahkan bahan terlebih dahulu.");
      return;
    }

    // Memastikan payload bersih dan sesuai kolom DB
    const payload = {
      name: formData.name,
      price: parseInt(formData.price),
      category: normalizedCategory,
      status: formData.status,
      image_url: formData.image_url,
      recipe: formData.recipe, // Backend harus siap memproses array ini
    };

    try {
      let result;

      if (isEditMode) {
        result = await updateProduct(editingId, payload);
      } else {
        result = await addProduct(payload);
      }
      toast.success(result.message || "Menu berhasil disimpan.");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat menyimpan produk.",
      );
    }
  };

  // --- 5. Logika Hapus ---
  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const result = await deleteProduct(deleteTarget.id);
      toast.success(result.message || `Menu ${deleteTarget.name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Gagal menghapus:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat menghapus produk.",
      );
    }
  };

  // --- 6. Logika Lihat Resep ---
  const handleViewRecipe = (product) => {
    setSelectedProductRecipe(product);
    setShowRecipeModal(true);
  };

  return (
    <div className="product-container">
      <PageHeader
        title="Manajemen Menu & Resep"
        subtitle="Kelola menu, harga, foto produk, dan kebutuhan bahan per porsi."
        meta={`${filteredProducts.length} menu`}
        actions={<Button onClick={openAddModal}>+ Tambah Menu Baru</Button>}
      />

      <div className="product-summary-grid">
        <div className="product-stat-card total">
          <span>Total menu</span>
          <strong>{productStats.total}</strong>
          <p>Menu yang terdaftar di katalog</p>
        </div>
        <div className="product-stat-card active">
          <span>Menu aktif</span>
          <strong>{productStats.active}</strong>
          <p>Tersedia untuk POS</p>
        </div>
        <div className="product-stat-card category">
          <span>Kategori</span>
          <strong>{productStats.categories}</strong>
          <p>Kelompok menu aktif</p>
        </div>
        <div className="product-stat-card inactive">
          <span>Nonaktif</span>
          <strong>{productStats.inactive}</strong>
          <p>Disembunyikan dari penjualan</p>
        </div>
      </div>

      <div className="product-toolbar">
        <div className="product-search-box">
          <Search size={17} strokeWidth={2.3} />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari menu, kategori, atau bahan resep..."
          />
        </div>
        <div className="product-filter-group">
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            aria-label="Filter kategori"
            placeholder="Semua kategori"
            options={[
              { value: "all", label: "Semua kategori", description: "Tampilkan semua menu" },
              ...categoryOptions.map((category) => ({
                value: category,
                label: category,
                description: "Kategori menu",
              })),
            ]}
          />
          <div className="product-filter-tabs">
            {[
              { value: "all", label: "Semua" },
              { value: "active", label: "Aktif" },
              { value: "inactive", label: "Nonaktif" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={statusFilter === item.value ? "active" : ""}
                onClick={() => setStatusFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-card">
        {loadError && products.length === 0 ? (
          <EmptyState
            icon={AlertCircle}
            title="Menu gagal dimuat."
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
              <th>Gambar</th>
              <th>Nama & Resep</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const productStatus = String(product.status || "active").toLowerCase();

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="img-wrapper">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="product-table-img"
                          />
                        ) : (
                          <div className="img-placeholder">
                            <ImagePlus size={18} strokeWidth={2.2} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-info-cell">
                        <strong>{product.name}</strong>
                        <span className="product-recipe-count">
                          <ClipboardList size={13} strokeWidth={2.3} />
                          {product.recipe?.length || 0} bahan resep
                        </span>
                        <div className="recipe-preview-tags">
                          {product.recipe?.slice(0, 4).map((r, i) => (
                            <span key={i} className="tag-ing">
                              {r.name}
                            </span>
                          ))}
                          {(product.recipe?.length || 0) > 4 && (
                            <span className="tag-ing muted">
                              +{product.recipe.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-chip">
                        {product.category || "Tanpa kategori"}
                      </span>
                    </td>
                    <td className="product-price-cell">
                      {formatRupiah(product.price)}
                    </td>
                    <td>
                      <span className={`product-status-pill ${productStatus}`}>
                        {productStatus === "active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="product-action-group">
                        <Button
                          variant="outline"
                          onClick={() => handleViewRecipe(product)}
                        >
                          <Eye size={14} strokeWidth={2.3} />
                          Resep
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openEditModal(product)}
                        >
                          <Pencil size={14} strokeWidth={2.3} />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 size={14} strokeWidth={2.3} />
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="product-empty-row">
                  <EmptyState
                    icon={Search}
                    title="Menu tidak ditemukan."
                    description="Ubah kata kunci, kategori, atau filter status."
                    actionLabel={products.length === 0 ? "Tambah Menu" : undefined}
                    onAction={products.length === 0 ? openAddModal : undefined}
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
        title={isEditMode ? "Edit Menu Locales" : "Tambah Menu Baru"}
        subtitle="Kelola detail menu, foto produk, harga, kategori, dan resep bahan baku per porsi."
        onClose={() => setIsModalOpen(false)}
        width="680px"
        footer={
          <div className="product-sheet-actions">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="product-form">
              {isEditMode ? "Update Menu" : "Simpan Menu"}
            </Button>
          </div>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="modal-form">
          <div className="image-upload-section">
            <div className="product-preview-card">
              <div className="product-preview-image">
                {formData.image_url ? (
                  <img src={formData.image_url} alt="Preview menu" />
                ) : (
                  <ImagePlus size={34} strokeWidth={2.2} />
                )}
              </div>
              <div className="product-preview-copy">
                <span>Preview menu</span>
                <strong>{formData.name || "Nama menu"}</strong>
                <p>{formData.category || "Kategori"} - {formData.price ? formatRupiah(formData.price) : "Harga belum diisi"}</p>
              </div>
            </div>
            <Input
              label="Upload Foto Produk"
              type="file"
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          <div className="product-detail-panel">
            <div className="product-panel-heading">
              <Tags size={17} strokeWidth={2.3} />
              <div>
                <strong>Informasi menu</strong>
                <span>Data yang tampil di POS dan katalog menu.</span>
              </div>
            </div>

            <Input
              label="Nama Menu"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <div className="form-grid">
              <Input
                label="Harga"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
              <div className="input-group-custom">
                <label className="input-label">Kategori</label>
                <input
                  className="input-field"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Contoh: Milk Tea, Yakult, Seasonal"
                  required
                />
                <div className="category-suggestion-row">
                  {categoryOptions.map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={formData.category === category ? "active" : ""}
                      onClick={() => setFormData({ ...formData, category })}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div className="input-group-custom">
                <label className="input-label">Status Menu</label>
                <CustomSelect
                  value={formData.status}
                  options={productStatusOptions}
                  placeholder="Pilih status"
                  onChange={(value) => setFormData({ ...formData, status: value })}
                />
              </div>
            </div>
          </div>

          <div className="recipe-section-box">
            <div className="product-panel-heading">
              <ListChecks size={17} strokeWidth={2.3} />
              <div>
                <strong>Resep bahan baku</strong>
                <span>Dipakai untuk validasi dan pengurangan stok otomatis.</span>
              </div>
            </div>
            <div className="recipe-builder-row">
              <CustomSelect
                value={tempIngredient.id}
                placeholder="Pilih bahan..."
                options={[
                  { value: "", label: "Pilih bahan...", description: "Belum memilih bahan" },
                  ...ingredients.map((ing) => ({
                    value: ing.id,
                    label: ing.name,
                    description: `${ing.unit} tersedia`,
                  })),
                ]}
                onChange={(value) =>
                  setTempIngredient({
                    ...tempIngredient,
                    id: value,
                  })
                }
              />
              <input
                className="input-field"
                type="number"
                step="any"
                placeholder="Qty"
                value={tempIngredient.amount}
                onChange={(e) =>
                  setTempIngredient({
                    ...tempIngredient,
                    amount: e.target.value,
                  })
                }
              />
              <Button type="button" onClick={addIngredientToRecipe}>
                +
              </Button>
            </div>

            <div className="recipe-list-simple">
              {formData.recipe.length === 0 && (
                <p className="empty-recipe-text">Belum ada bahan.</p>
              )}
              {formData.recipe.map((item) => (
                <div key={item.ingredientId} className="recipe-item-simple">
                  <span>
                    {item.name} ({item.amount} {item.unit})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      removeIngredientFromRecipe(item.ingredientId)
                    }
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </SideSheet>

      {/* --- MODAL LIHAT RESEP --- */}
      {showRecipeModal && selectedProductRecipe && (
        <div className="modal-overlay recipe-view-overlay">
          <div className="modal-content recipe-view-modal">
            <div className="recipe-view-header">
              <div>
                <span>Resep Ingredient</span>
                <h3>{selectedProductRecipe.name}</h3>
              </div>
              <button
                type="button"
                className="recipe-view-close"
                onClick={() => setShowRecipeModal(false)}
                aria-label="Tutup tabel resep"
              >
                <X size={20} strokeWidth={2.3} />
              </button>
            </div>

            <div className="recipe-detail-container">
              {selectedProductRecipe.recipe &&
              selectedProductRecipe.recipe.length > 0 ? (
                <div className="recipe-view-table-wrap">
                  <table className="recipe-view-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Ingredient</th>
                        <th>Kebutuhan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProductRecipe.recipe.map((item, index) => {
                        const ingredient = ingredients.find(
                          (ing) => String(ing.id) === String(item.ingredientId),
                        );
                        const needed = parseFloat(item.amount || 0);

                        return (
                          <tr key={`${item.ingredientId}-${index}`}>
                            <td>
                              <span className="recipe-index">{index + 1}</span>
                            </td>
                            <td>
                              <strong>{item.name}</strong>
                              <small>{ingredient?.unit || item.unit || "unit"}</small>
                            </td>
                            <td>
                              {needed.toLocaleString("id-ID")} {item.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={ListChecks}
                  title="Resep belum ditentukan."
                  description="Tambahkan ingredient pada menu ini agar stok bisa dihitung otomatis."
                />
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Menu"
        message={`Yakin ingin menghapus menu "${deleteTarget?.name || ""}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmText="Hapus Menu"
        cancelText="Batal"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ProductList;
