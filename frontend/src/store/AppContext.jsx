import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- STATE UTAMA ---
  const [branches, setBranches] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState(() => {
    const saved = localStorage.getItem("locales_current_branch");
    return saved ? JSON.parse(saved) : null;
  });

  // --- 1. FUNGSI FETCH DATA ---
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [resBranch, resIng, resProd, resTrx] = await Promise.all([
        api.get("/branches/list.php"),
        api.get("/ingredients/list.php"),
        api.get("/products/read.php"),
        api.get("/transactions/history.php"),
      ]);

      if (resBranch.data.status === "success")
        setBranches(resBranch.data.data || []);
      if (resIng.data.status === "success")
        setIngredients(resIng.data.data || []);
      if (resProd.data.status === "success")
        setProducts(resProd.data.data || []);
      if (resTrx.data.status === "success")
        setTransactions(resTrx.data.data || []);

      if (!selectedBranch && resBranch.data.data?.length > 0) {
        setSelectedBranch(resBranch.data.data[0]);
      }
    } catch (error) {
      console.error("Gagal mengambil data dari server:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (selectedBranch) {
      localStorage.setItem(
        "locales_current_branch",
        JSON.stringify(selectedBranch),
      );
    }
  }, [selectedBranch]);

  // --- 2. MANAJEMEN BAHAN BAKU (INGREDIENTS) ---
  // PERBAIKAN: Mengembalikan fungsi addIngredient ke fungsi aslinya
  const addIngredient = async (data) => {
    try {
      const res = await api.post("/ingredients/create.php", data);
      if (res.data.status === "success") await refreshData();
      return res.data;
    } catch (error) {
      console.error("API Error (Add Ingredient):", error);
      throw error;
    }
  };

  const updateIngredient = async (id, data) => {
    try {
      const res = await api.post("/ingredients/update.php", { id, ...data });
      if (res.data.status === "success") await refreshData();
      return res.data;
    } catch (error) {
      console.error("API Error (Update Ingredient):", error);
      throw error;
    }
  };

  const deleteIngredient = async (id) => {
    try {
      const res = await api.post("/ingredients/delete.php", { id });
      if (res.data.status === "success") await refreshData();
      return res.data;
    } catch (error) {
      console.error("API Error (Delete Ingredient):", error);
      throw error;
    }
  };

  // --- 3. MANAJEMEN PRODUK & RESEP (PRODUCTS) ---
  const addProduct = async (data) => {
    const res = await api.post("/products/create.php", data);
    if (res.data.status === "success") await refreshData();
    return res.data;
  };

  const updateProduct = async (id, data) => {
    const res = await api.post("/products/update.php", { id, ...data });
    if (res.data.status === "success") await refreshData();
    return res.data;
  };

  const deleteProduct = async (id) => {
    const res = await api.post("/products/delete.php", { id });
    if (res.data.status === "success") {
      await refreshData();
      return res.data;
    } else {
      alert(res.data.message);
      return res.data;
    }
  };

  // --- 4. TRANSAKSI & STOK ---
  const updateStock = async (id, amount) => {
    try {
      const target = ingredients.find((ing) => ing.id === id);
      if (!target) return;

      const currentStock = parseFloat(target.stock_quantity || 0);

      await updateIngredient(id, {
        name: target.name,
        unit: target.unit,
        branch_id: target.branch_id,
        minStock: target.min_stock,
        stock: currentStock + parseFloat(amount),
      });
    } catch (error) {
      console.error("Gagal update stok:", error);
    }
  };

  const processTransaction = async (cartItems, paymentMethod, totalAmount) => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));

      // Validasi data user sebelum kirim
      if (!userData) {
        return {
          success: false,
          message: "User tidak ditemukan. Silahkan login ulang.",
        };
      }

      const payload = {
        user_id: userData.id,
        branch_id: selectedBranch?.id || 1,
        total_price: totalAmount,
        payment_method: paymentMethod,
        items: cartItems.map((item) => ({
          id: item.id, // ID Produk
          qty: item.quantity || item.qty, // Support dua kemungkinan nama field
          price: item.price,
        })),
      };

      const res = await api.post("/transactions/create.php", payload);

      if (res.data.status === "success") {
        // Penting: Refresh data agar stok terbaru ditarik dari DB
        await refreshData();
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (error) {
      console.error("Gagal proses transaksi:", error);
      return { success: false, message: "Terjadi kesalahan server." };
    }
  };

  const voidTransaction = async (trxId) => {
    if (
      window.confirm("Hapus transaksi ini? Stok akan dikembalikan otomatis.")
    ) {
      try {
        const res = await api.post("/transactions/delete.php", { id: trxId });
        if (res.data.status === "success") await refreshData();
      } catch (error) {
        console.error("Gagal void transaksi:", error);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        ingredients,
        products,
        transactions,
        branches,
        selectedBranch,
        loading,
        refreshData,
        setSelectedBranch,
        // Ingredient Actions
        addIngredient,
        updateIngredient,
        deleteIngredient,
        // Product Actions
        addProduct,
        updateProduct,
        deleteProduct,
        // Transaction Actions
        updateStock,
        processTransaction,
        voidTransaction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
export const useApp = () => useContext(AppContext);
