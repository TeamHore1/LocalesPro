import React, { useState } from "react";
import { useApp } from "../../hooks/useApp";
import { formatRupiah } from "../../utils/currency";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import "./Product.css";

const ProductList = () => {
  const { products, ingredients, addProduct, deleteProduct, updateProduct } =
    useApp();

  // State untuk Kontrol Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedProductRecipe, setSelectedProductRecipe] = useState(null);

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
      alert("Pilih bahan dan isi jumlahnya terlebih dahulu.");
      return;
    }

    const ingInfo = ingredients.find(
      (i) => String(i.id) === String(tempIngredient.id),
    );

    if (!ingInfo) {
      alert("Bahan baku tidak ditemukan!");
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

    if (formData.recipe.length === 0) {
      alert("Resep tidak boleh kosong. Tambahkan bahan terlebih dahulu.");
      return;
    }

    // Memastikan payload bersih dan sesuai kolom DB
    const payload = {
      name: formData.name,
      price: parseInt(formData.price),
      category: formData.category,
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
      alert(result.message || "Menu berhasil disimpan!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menyimpan produk:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan saat menyimpan produk.",
      );
    }
  };

  // --- 5. Logika Hapus ---
  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus menu "${name}"?`)) {
      try {
        const result = await deleteProduct(id);
        alert(result.message || `Menu ${name} berhasil dihapus.`);
      } catch (error) {
        console.error("Gagal menghapus:", error);
        alert(
          error.response?.data?.message ||
            error.message ||
            "Terjadi kesalahan saat menghapus produk.",
        );
      }
    }
  };

  // --- 6. Logika Lihat Resep ---
  const handleViewRecipe = (product) => {
    setSelectedProductRecipe(product);
    setShowRecipeModal(true);
  };

  return (
    <div className="product-container">
      <div className="header-page">
        <h2 style={{ color: "#092379" }}>Manajemen Menu & Resep</h2>
        <Button onClick={openAddModal}>+ Tambah Menu Baru</Button>
      </div>

      <div className="table-card">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Gambar</th>
              <th>Nama & Resep</th>
              <th>Harga</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="img-wrapper">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                        }}
                      />
                    ) : (
                      <div className="img-placeholder">Menu</div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="product-info-cell">
                    <strong>{product.name}</strong>
                    <div className="recipe-preview-tags">
                      {product.recipe?.map((r, i) => (
                        <span key={i} className="tag-ing">
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td>{formatRupiah(product.price)}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      variant="outline"
                      onClick={() => handleViewRecipe(product)}
                    >
                      Lihat Resep
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openEditModal(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      Hapus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Menu Locales" : "Tambah Menu Baru"}</h3>
              <button
                className="btn-close"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="image-upload-section">
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="preview-img-form"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "10px",
                    }}
                  />
                )}
                <Input
                  label="Foto Produk"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                />
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
                  <select
                    className="input-field"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  >
                    <option value="Milk Tea">Milk Tea</option>
                    <option value="Tea">Tea</option>
                    <option value="Coffee">Coffee</option>
                  </select>
                </div>
              </div>

              <div className="recipe-section-box">
                <label className="input-label">Atur Resep (Bahan Baku)</label>
                <div
                  style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
                >
                  <select
                    className="input-field"
                    style={{ flex: 2 }}
                    value={tempIngredient.id}
                    onChange={(e) =>
                      setTempIngredient({
                        ...tempIngredient,
                        id: e.target.value,
                      })
                    }
                  >
                    <option value="">Pilih Bahan...</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input-field"
                    style={{ flex: 1 }}
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
                    <p style={{ fontSize: "12px", color: "#888" }}>
                      Belum ada bahan.
                    </p>
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

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Menu" : "Simpan Menu"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LIHAT RESEP --- */}
      {showRecipeModal && selectedProductRecipe && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>Resep: {selectedProductRecipe.name}</h3>
              <button
                className="btn-close"
                onClick={() => setShowRecipeModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="recipe-detail-container">
              <div className="recipe-info-header">
                <p>
                  <strong>Harga:</strong> {formatRupiah(selectedProductRecipe.price)}
                </p>
                <p>
                  <strong>Kategori:</strong> {selectedProductRecipe.category}
                </p>
              </div>

              <h4 style={{ color: "#092379", marginTop: "20px" }}>
                Bahan Baku yang Dibutuhkan:
              </h4>

              {selectedProductRecipe.recipe &&
              selectedProductRecipe.recipe.length > 0 ? (
                <table className="custom-table" style={{ marginTop: "10px" }}>
                  <thead>
                    <tr>
                      <th>Nama Bahan</th>
                      <th>Jumlah</th>
                      <th>Stok Tersedia</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductRecipe.recipe.map((item) => {
                      const ingredient = ingredients.find(
                        (ing) => String(ing.id) === String(item.ingredientId)
                      );
                      const availableStock = ingredient
                        ? parseFloat(ingredient.stock_quantity || 0)
                        : 0;
                      const needed = parseFloat(item.amount || 0);
                      const isEnough = availableStock >= needed;

                      return (
                        <tr key={item.ingredientId}>
                          <td>{item.name}</td>
                          <td>
                            {needed} {item.unit}
                          </td>
                          <td
                            style={{
                              color: isEnough ? "green" : "red",
                              fontWeight: "bold",
                            }}
                          >
                            {availableStock} {ingredient?.unit || ""}
                          </td>
                          <td>
                            {isEnough ? (
                              <span
                                style={{
                                  color: "green",
                                  fontWeight: "bold",
                                }}
                              >
                                ✓ Cukup
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: "red",
                                  fontWeight: "bold",
                                }}
                              >
                                ✗ Kurang
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#888", marginTop: "10px" }}>
                  Resep belum ditentukan.
                </p>
              )}

              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  backgroundColor: "#f0f4ff",
                  borderRadius: "8px",
                  border: "1px solid #d6b22f",
                }}
              >
                <p style={{ margin: "0", fontSize: "14px", color: "#092379" }}>
                  <strong>Catatan:</strong> Untuk menambah stok produk yang habis,
                  buka halaman <strong>Bahan Baku</strong> dan tambahkan stok
                  bahan baku yang ditandai "Kurang".
                </p>
              </div>

              <div
                className="modal-footer"
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button onClick={() => setShowRecipeModal(false)}>Tutup</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
