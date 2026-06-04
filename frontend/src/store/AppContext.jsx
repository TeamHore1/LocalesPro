import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import api from "../services/api";
import AppStoreContext from "./app-store-context";
import { getAuthUser } from "../utils/auth";

const BRANCH_STORAGE_KEY = "locales_current_branch";

const normalizeBranch = (branch) => {
  if (!branch || typeof branch !== "object" || !branch.id) {
    return null;
  }

  return branch;
};

const readSavedBranch = () => {
  try {
    const saved = localStorage.getItem(BRANCH_STORAGE_KEY);
    if (!saved) {
      return null;
    }

    return normalizeBranch(JSON.parse(saved));
  } catch {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
    return null;
  }
};

export const AppProvider = ({ children }) => {
  // --- STATE UTAMA ---
  const [branches, setBranches] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBranch, setSelectedBranch] = useState(() => readSavedBranch());

  const ensureSuccess = (response, fallbackMessage) => {
    const result = response.data;
    if (result?.status !== "success") {
      throw new Error(result?.message || fallbackMessage);
    }

    return result;
  };

  const syncSelectedBranch = useCallback(
    (branchList) => {
      if (!Array.isArray(branchList) || branchList.length === 0) {
        setSelectedBranch(null);
        localStorage.removeItem(BRANCH_STORAGE_KEY);
        return null;
      }

      const currentBranch = normalizeBranch(selectedBranch);

      if (!currentBranch) {
        setSelectedBranch(branchList[0]);
        return branchList[0];
      }

      const matchedBranch = branchList.find(
        (branch) => String(branch.id) === String(currentBranch.id),
      );

      if (!matchedBranch) {
        setSelectedBranch(branchList[0]);
        return branchList[0];
      }

      if (JSON.stringify(matchedBranch) !== JSON.stringify(currentBranch)) {
        setSelectedBranch(matchedBranch);
      }

      return matchedBranch;
    },
    [selectedBranch],
  );

  const getActiveBranchId = () => {
    if (!selectedBranch?.id) {
      return getAuthUser()?.branch_id || null;
    }

    const matchedBranch = branches.find(
      (branch) => String(branch.id) === String(selectedBranch.id),
    );

    return matchedBranch ? matchedBranch.id : null;
  };

  const buildBranchParams = useCallback((branchId, extraParams = {}) => {
    const params = { ...extraParams };

    if (branchId) {
      params.branch_id = branchId;
    }

    return Object.keys(params).length > 0 ? { params } : undefined;
  }, []);

  // --- 1. FUNGSI FETCH DATA ---
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const resBranch = await api.get("/branches/list.php");

      let activeBranchId = null;

      if (resBranch.data.status === "success") {
        const branchList = resBranch.data.data || [];
        setBranches(branchList);
        const activeBranch = syncSelectedBranch(branchList);
        // Selalu pakai hasil syncSelectedBranch karena sudah termasuk validasi
        activeBranchId = activeBranch?.id || null;
      }

      // Fallback ke branch_id dari user session jika tidak ada branch aktif
      if (!activeBranchId) {
        activeBranchId = getAuthUser()?.branch_id || null;
      }

      const [resIng, resProd, resTrx, resStockMovements] = await Promise.all([
        api.get("/ingredients/list.php", buildBranchParams(activeBranchId)),
        api.get("/products/read.php", buildBranchParams(activeBranchId)),
        api.get("/transactions/history.php", buildBranchParams(activeBranchId)),
        api.get(
          "/stock_movements/list.php",
          buildBranchParams(activeBranchId, { limit: 50 }),
        ),
      ]);

      if (resIng.data.status === "success")
        setIngredients(resIng.data.data || []);
      if (resProd.data.status === "success")
        setProducts(resProd.data.data || []);
      if (resTrx.data.status === "success")
        setTransactions(resTrx.data.data || []);
      if (resStockMovements.data.status === "success")
        setStockMovements(resStockMovements.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data dari server:", error);
    } finally {
      setLoading(false);
    }
  }, [buildBranchParams, syncSelectedBranch]);

  useEffect(() => {
    const user = getAuthUser();
    if (user) refreshData();
  }, [refreshData]);

  useEffect(() => {
    const currentBranch = normalizeBranch(selectedBranch);

    if (currentBranch) {
      localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(currentBranch));
    } else {
      localStorage.removeItem(BRANCH_STORAGE_KEY);
    }
  }, [selectedBranch]);

  // --- 2. MANAJEMEN BAHAN BAKU (INGREDIENTS) ---
  const addIngredient = async (data) => {
    try {
      const payload = {
        ...data,
        branch_id: getActiveBranchId() || 1,
      };
      const res = await api.post("/ingredients/create.php", payload);
      const result = ensureSuccess(res, "Gagal menambah bahan.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Add Ingredient):", error);
      throw error;
    }
  };

  const updateIngredient = async (id, data) => {
    try {
      const res = await api.post("/ingredients/update.php", { id, ...data });
      const result = ensureSuccess(res, "Gagal memperbarui bahan.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Update Ingredient):", error);
      throw error;
    }
  };

  const deleteIngredient = async (id) => {
    try {
      const res = await api.post("/ingredients/delete.php", { id });
      const result = ensureSuccess(res, "Gagal menghapus bahan.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Delete Ingredient):", error);
      throw error;
    }
  };

  // --- 3. MANAJEMEN PRODUK & RESEP (PRODUCTS) ---
  const addProduct = async (data) => {
    try {
      const payload = {
        ...data,
        branch_id: getActiveBranchId(),
      };
      const res = await api.post("/products/create.php", payload);
      const result = ensureSuccess(res, "Gagal menambah produk.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Add Product):", error);
      throw error;
    }
  };

  const updateProduct = async (id, data) => {
    try {
      const payload = {
        id,
        ...data,
        branch_id: getActiveBranchId(),
      };
      const res = await api.post("/products/update.php", payload);
      const result = ensureSuccess(res, "Gagal memperbarui produk.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Update Product):", error);
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await api.post("/products/delete.php", { id });
      const result = ensureSuccess(res, "Gagal menghapus produk.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Delete Product):", error);
      throw error;
    }
  };

  const addBranch = async (data) => {
    try {
      const res = await api.post("/branches/create.php", data);
      const result = ensureSuccess(res, "Gagal menambah cabang.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Add Branch):", error);
      throw error;
    }
  };

  const deleteBranch = async (id) => {
    try {
      const res = await api.post("/branches/delete.php", { id });
      const result = ensureSuccess(res, "Gagal menghapus cabang.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Delete Branch):", error);
      throw error;
    }
  };

  const updateBranch = async (id, data) => {
    try {
      const res = await api.post("/branches/update.php", { id, ...data });
      const result = ensureSuccess(res, "Gagal memperbarui cabang.");
      await refreshData();
      return result;
    } catch (error) {
      console.error("API Error (Update Branch):", error);
      throw error;
    }
  };

  // --- 4. TRANSAKSI & STOK ---
  const updateStock = async (id, amount) => {
    try {
      const target = ingredients.find((ing) => ing.id === id);
      if (!target) return;

      // SINKRONISASI: Menggunakan stock_quantity dan min_stock sesuai kolom DB
      const currentStock = parseFloat(target.stock_quantity || 0);

      await updateIngredient(id, {
        name: target.name,
        unit: target.unit,
        branch_id: target.branch_id,
        minStock: target.min_stock, // Menjaga nilai min_stock tetap ada saat update
        stock: currentStock + parseFloat(amount),
      });
    } catch (error) {
      console.error("Gagal update stok:", error);
    }
  };

  const processTransaction = async (
    cartItems,
    paymentMethod,
    totalAmount,
    paymentDetails = {},
  ) => {
    try {
      const user = getAuthUser();
      if (!user?.id) {
        return { success: false, message: "Sesi login sudah berakhir." };
      }

      const activeBranchId = getActiveBranchId();
      if (!activeBranchId) {
        return { success: false, message: "Cabang aktif belum dipilih." };
      }

      const payload = {
        branch_id: activeBranchId,
        total_price: totalAmount,
        payment_method: paymentMethod,
        amount_paid: paymentDetails.amountPaid,
        change_amount: paymentDetails.changeAmount,
        customer_name: paymentDetails.customerName,
        payment_note: paymentDetails.paymentNote,
        items: cartItems.map((item) => ({
          id: item.id,
          qty: item.qty,
        })),
      };
      const res = await api.post("/transactions/create.php", payload);
      if (res.data.status === "success") {
        await refreshData();
        return { success: true, transaction: res.data.data };
      }
      return { success: false, message: res.data.message };
    } catch {
      return { success: false, message: "Terjadi kesalahan server." };
    }
  };

  const voidTransaction = async (trxId, voidReason = "") => {
    try {
      const res = await api.post("/transactions/delete.php", {
        id: trxId,
        void_reason: voidReason,
      });
      if (res.data.status === "success") await refreshData();
      return res.data;
    } catch (error) {
      console.error("Gagal void transaksi:", error);
      throw error;
    }
  };

  return (
    <AppStoreContext.Provider
      value={{
        ingredients,
        products,
        transactions,
        stockMovements,
        branches,
        selectedBranch,
        loading,
        refreshData,
        fetchBranches: refreshData,
        setSelectedBranch,
        addBranch,
        deleteBranch,
        updateBranch,
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
    </AppStoreContext.Provider>
  );
};
