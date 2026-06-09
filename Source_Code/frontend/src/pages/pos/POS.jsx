import React, { useEffect, useMemo, useState } from "react";
import "./POS.css";
import {
  AlertCircle,
  ClipboardList,
  Search,
  ShoppingBag,
  Tags,
  UserRound,
} from "lucide-react";
import { formatRupiah } from "../../utils/currency";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import SideSheet from "../../components/ui/SideSheet";
import EmptyState from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const ORDER_TYPES = [
  { value: "dine-in", label: "Dine in" },
  { value: "takeaway", label: "Takeaway" },
];

const POS = () => {
  const { products, ingredients, processTransaction, loading, loadError, refreshData } =
    useApp();
  const toast = useToast();

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState("dine-in");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cashAmount = toNumber(cashReceived);
  const changeAmount = Math.max(cashAmount - totalPrice, 0);
  const isProductsLoading = loading && products.length === 0;

  const categories = useMemo(
    () => [
      "Semua",
      ...new Set(
        products
          .map((product) => String(product.category || "").trim())
          .filter(Boolean),
      ),
    ],
    [products],
  );

  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory("Semua");
    }
  }, [categories, selectedCategory]);

  const filteredProducts = products.filter((product) => {
    const matchCategory =
      selectedCategory === "Semua" || product.category === selectedCategory;
    const keyword = searchTerm.trim().toLowerCase();
    const matchSearch = keyword
      ? `${product.name || ""} ${product.category || ""}`
          .toLowerCase()
          .includes(keyword)
      : true;

    return matchCategory && matchSearch;
  });

  const quickCashOptions = useMemo(() => {
    const roundedTotal = Math.ceil(totalPrice / 10000) * 10000;
    return [...new Set([totalPrice, roundedTotal, 20000, 50000, 100000])]
      .filter((value) => value > 0 && value >= totalPrice)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [totalPrice]);

  const getAvailableStockCount = (product) => {
    if (!product?.recipe || !Array.isArray(product.recipe) || product.recipe.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    return product.recipe.reduce((minimumStock, recipeItem) => {
      const ingredient = ingredients.find(
        (item) => String(item.id) === String(recipeItem.ingredientId),
      );

      const availableStock = parseFloat(
        ingredient?.stock_quantity ?? ingredient?.stock ?? 0,
      );
      const requiredAmount = parseFloat(recipeItem.amount ?? 0);

      if (!ingredient || requiredAmount <= 0) {
        return 0;
      }

      return Math.min(minimumStock, Math.floor(availableStock / requiredAmount));
    }, Number.POSITIVE_INFINITY);
  };

  const isOutOfStock = (product) => getAvailableStockCount(product) <= 0;
  const getCartQty = (productId) =>
    cart.find((item) => String(item.id) === String(productId))?.qty || 0;
  const getProductImage = (product) => product.image || product.image_url || "";

  const resetPaymentForm = () => {
    setCashReceived("");
    setCustomerName("");
    setPaymentNote("");
    setPaymentError("");
    setIsProcessingPayment(false);
  };

  const buildReceiptTransaction = (transaction, items) => ({
    transaction_code: transaction.transaction_code || "LOC-CASH",
    created_at: transaction.created_at || new Date().toISOString(),
    payment_method: "Cash",
    payment_status: transaction.payment_status || "Paid",
    total_price: transaction.total_price ?? totalPrice,
    amount_paid: transaction.amount_paid ?? cashAmount,
    change_amount: transaction.change_amount ?? changeAmount,
    customer_name: customerName.trim(),
    payment_note: paymentNote.trim(),
    items: items.map((item) => ({
      ...item,
      subtotal: item.subtotal ?? item.price * item.qty,
    })),
  });

  const printReceipt = (transaction) =>
    new Promise((resolve) => {
      const receiptWindow = window.open("", "_blank", "width=360,height=720");
      let settled = false;
      let closeWatcher = null;
      let timeoutId = null;

      const finish = () => {
        if (settled) {
          return;
        }

        settled = true;

        if (closeWatcher) {
          window.clearInterval(closeWatcher);
        }

        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }

        resolve(Boolean(receiptWindow));
      };

      if (!receiptWindow) {
        finish();
        return;
      }

      const closeReceiptWindow = () => {
        try {
          receiptWindow.close();
        } catch {
          // ignore browser restrictions
        }
      };

      closeWatcher = window.setInterval(() => {
        if (receiptWindow.closed) {
          finish();
        }
      }, 300);

      timeoutId = window.setTimeout(() => {
        closeReceiptWindow();
        finish();
      }, 15000);

      receiptWindow.onafterprint = () => {
        window.setTimeout(() => {
          closeReceiptWindow();
          finish();
        }, 200);
      };

      const transactionDate = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(transaction.created_at || Date.now()));

      const receiptContent = `
        <html>
          <head>
            <title>Struk ${transaction.transaction_code}</title>
            <style>
              body {
                font-family: "Courier New", Courier, monospace;
                width: 300px;
                padding: 20px;
                color: #1f2937;
              }
              .header {
                text-align: center;
                border-bottom: 1px dashed #111827;
                padding-bottom: 10px;
                margin-bottom: 12px;
              }
              .header h2 {
                margin: 0 0 6px;
                color: #092379;
              }
              .meta {
                font-size: 12px;
                margin-bottom: 12px;
              }
              .items {
                border-bottom: 1px dashed #111827;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .item-row,
              .total-row {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                margin: 6px 0;
                font-size: 13px;
              }
              .total-row {
                font-weight: bold;
                font-size: 14px;
              }
              .footer {
                margin-top: 14px;
                text-align: center;
                font-size: 11px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>LOCALES</h2>
              <div>Fresh & Quality Drinks</div>
            </div>
            <div class="meta">
              <div>Order: ${transaction.transaction_code}</div>
              <div>Waktu: ${transactionDate}</div>
              <div>Metode: Tunai</div>
              <div>Status: ${transaction.payment_status || "Paid"}</div>
              ${transaction.customer_name ? `<div>Pelanggan: ${transaction.customer_name}</div>` : ""}
              ${transaction.payment_note ? `<div>Catatan: ${transaction.payment_note}</div>` : ""}
            </div>
            <div class="items">
              ${transaction.items
                .map(
                  (item) => `
                  <div class="item-row">
                    <span>${item.name} x${item.qty}</span>
                    <span>${formatRupiah(item.subtotal ?? item.price * item.qty)}</span>
                  </div>`,
                )
                .join("")}
            </div>
            <div class="total-row">
              <span>Total</span>
              <span>${formatRupiah(transaction.total_price || 0)}</span>
            </div>
            <div class="item-row">
              <span>Tunai</span>
              <span>${formatRupiah(transaction.amount_paid || 0)}</span>
            </div>
            <div class="item-row">
              <span>Kembalian</span>
              <span>${formatRupiah(transaction.change_amount || 0)}</span>
            </div>
            <div class="footer">
              <div>Terima kasih telah berbelanja.</div>
              <div>Follow us @locales.id</div>
            </div>
            <script>
              window.addEventListener("afterprint", function () {
                setTimeout(function () {
                  window.close();
                }, 200);
              });

              window.onload = function () {
                setTimeout(function () {
                  window.print();
                }, 150);
              };
            </script>
          </body>
        </html>
      `;

      receiptWindow.document.write(receiptContent);
      receiptWindow.document.close();
    });

  const addToCart = (product) => {
    const maxAvailable = getAvailableStockCount(product);
    const currentQty =
      cart.find((item) => String(item.id) === String(product.id))?.qty || 0;

    if (currentQty >= maxAvailable) {
      toast.warning(`Stok bahan untuk ${product.name} tidak cukup.`);
      return;
    }

    const existingItem = cart.find((item) => String(item.id) === String(product.id));

    if (existingItem) {
      setCart((prevCart) =>
        prevCart.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, qty: item.qty + 1 }
            : item,
        ),
      );
      return;
    }

    setCart((prevCart) => [...prevCart, { ...product, qty: 1 }]);
  };

  const updateQty = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (String(item.id) !== String(id)) {
            return item;
          }

          const nextQty = item.qty + delta;
          const maxAvailable = getAvailableStockCount(item);

          if (nextQty <= 0) {
            return null;
          }

          if (nextQty > maxAvailable) {
            toast.warning(`Stok bahan untuk ${item.name} tidak cukup.`);
            return item;
          }

          return { ...item, qty: nextQty };
        })
        .filter(Boolean),
    );
  };

  const handleClosePaymentModal = () => {
    if (isProcessingPayment) {
      return;
    }

    setShowPaymentModal(false);
    setPaymentError("");
  };

  const handleCashPayment = async (cartSnapshot) => {
    if (cashAmount < totalPrice) {
      setPaymentError("Uang yang diterima kurang dari total tagihan.");
      setIsProcessingPayment(false);
      return;
    }

    const result = await processTransaction(cartSnapshot, "Cash", totalPrice, {
      amountPaid: cashAmount,
      changeAmount,
      customerName: customerName.trim(),
      paymentNote: paymentNote.trim(),
    });

    if (!result.success) {
      setPaymentError(result.message || "Transaksi tunai gagal diproses.");
      setIsProcessingPayment(false);
      return;
    }

    const receiptTransaction = buildReceiptTransaction(
      {
        ...result.transaction,
        payment_status: "Paid",
        total_price: totalPrice,
        amount_paid: cashAmount,
        change_amount: changeAmount,
      },
      cartSnapshot,
    );

    setCart([]);
    setShowPaymentModal(false);
    resetPaymentForm();
    setShowSuccessModal(true);
    void printReceipt(receiptTransaction);
  };

  const handleConfirmPayment = async () => {
    setPaymentError("");

    if (cart.length === 0) {
      setPaymentError("Belum ada item yang bisa dibayar.");
      return;
    }

    const cartSnapshot = cart.map((item) => ({
      ...item,
      subtotal: item.price * item.qty,
    }));

    setIsProcessingPayment(true);
    await handleCashPayment(cartSnapshot);
  };

  return (
    <div className="pos-container">
      <section className="products-section">
        <div className="pos-workspace-header">
          <div>
            <span className="pos-eyebrow">Point of Sale</span>
            <h2>Product Lists</h2>
            <p>Pilih menu, atur jumlah, lalu lanjutkan pembayaran tunai.</p>
          </div>
          <div className="pos-header-metrics">
            <span>
              <ShoppingBag size={16} strokeWidth={2.2} />
              {filteredProducts.length} tampil
            </span>
            <span>
              <Tags size={16} strokeWidth={2.2} />
              {Math.max(categories.length - 1, 0)} kategori
            </span>
          </div>
        </div>

        <div className="pos-discovery-card">
          <div className="pos-discovery-top">
            <h3>Menu Locales</h3>
            <span>{isProductsLoading ? "Memuat produk..." : `${products.length} produk`}</span>
          </div>
          <div className="pos-search-wrap">
            <Search size={19} strokeWidth={2.3} />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari menu atau kategori..."
              className="menu-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm("")}
              >
                Bersihkan
              </button>
            )}
          </div>

          <div className="category-filter-row" aria-label="Filter kategori menu">
            {categories.map((category) => (
              <button
                key={category}
                className={`btn-filter-cat ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {loadError && products.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Menu gagal dimuat."
              description={loadError}
              actionLabel="Coba Lagi"
              onAction={refreshData}
              variant="error"
              className="pos-grid-empty-state"
            />
          ) : isProductsLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="product-card product-card-skeleton">
                <Skeleton className="pos-skeleton-image" />
                <div className="product-card-body">
                  <div>
                    <Skeleton className="pos-skeleton-title" />
                    <Skeleton className="pos-skeleton-price" />
                  </div>
                  <div className="product-card-tags">
                    <Skeleton className="pos-skeleton-chip" />
                    <Skeleton className="pos-skeleton-chip" />
                  </div>
                </div>
                <div className="product-card-actions">
                  <Skeleton className="pos-skeleton-stepper" />
                  <Skeleton className="pos-skeleton-button" />
                </div>
              </article>
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const outOfStock = isOutOfStock(product);
              const availableCount = getAvailableStockCount(product);
              const cartQty = getCartQty(product.id);
              const productImage = getProductImage(product);

              return (
                <article
                  key={product.id}
                  className={`product-card ${outOfStock ? "disabled" : ""}`}
                >
                  {outOfStock && <span className="oos-badge">Habis</span>}
                  <div className="product-image">
                    {productImage ? (
                      <img src={productImage} alt={product.name} />
                    ) : (
                      <span>Drink</span>
                    )}
                  </div>

                  <div className="product-card-body">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{formatRupiah(product.price)}</p>
                    </div>
                    <div className="product-card-tags">
                      <span>{product.category || "Menu"}</span>
                      <span>
                        {Number.isFinite(availableCount)
                          ? `${availableCount} porsi`
                          : "Siap jual"}
                      </span>
                    </div>
                  </div>

                  <div className="product-card-actions">
                    <div className="product-qty-stepper">
                      <button
                        type="button"
                        onClick={() => updateQty(product.id, -1)}
                        disabled={cartQty === 0}
                        aria-label={`Kurangi ${product.name}`}
                      >
                        -
                      </button>
                      <span>{cartQty}</span>
                      <button
                        type="button"
                        onClick={() => !outOfStock && addToCart(product)}
                        disabled={outOfStock}
                        aria-label={`Tambah ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn-add-to-cart"
                      onClick={() => addToCart(product)}
                      disabled={outOfStock}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-product-state">
              <EmptyState
                icon={Search}
                title="Menu tidak ditemukan."
                description="Ubah kata kunci atau pilih kategori lain untuk melihat menu yang tersedia."
                className="pos-grid-empty-state"
              />
            </div>
          )}
        </div>
      </section>

      <aside className="cart-section">
        <div className="cart-header">
          <div>
            <h3>Cart Details</h3>
            <p>{cartItemCount} item dalam pesanan</p>
          </div>
          <button type="button" className="cart-icon-button" aria-label="Detail cart">
            <ClipboardList size={18} strokeWidth={2.3} />
          </button>
        </div>

        <div className="order-type-tabs" aria-label="Tipe pesanan">
          {ORDER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              className={orderType === type.value ? "active" : ""}
              onClick={() => setOrderType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="customer-card">
          <div className="cart-section-title">
            <UserRound size={17} strokeWidth={2.3} />
            <span>Customer information</span>
          </div>
          <label htmlFor="cart-customer-name">Customer name</label>
          <input
            id="cart-customer-name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Masukkan nama pelanggan"
          />
        </div>

        <div className="cart-items-header">
          <div>
            <h4>Order items</h4>
            <span>{cart.length} menu dipilih</span>
          </div>
          {cart.length > 0 && (
            <button type="button" onClick={() => setCart([])}>
              Clear all items
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Belum ada pesanan.</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemImage = getProductImage(item);

              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-main">
                    <div className="cart-item-image">
                      {itemImage ? (
                        <img src={itemImage} alt={item.name} />
                      ) : (
                        <span>Menu</span>
                      )}
                    </div>
                    <div className="item-info">
                      <strong>{item.name}</strong>
                      <span>{item.category || "Menu Locales"}</span>
                    </div>
                  </div>

                  <div className="cart-item-bottom">
                    <b>{formatRupiah(item.price * item.qty)}</b>
                    <div className="item-controls">
                      <button type="button" onClick={() => updateQty(item.id, -1)}>
                        -
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div>
              <span>Sub total</span>
              <strong>{formatRupiah(totalPrice)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>{formatRupiah(0)}</strong>
            </div>
          </div>
          <div className="total-price">
            <span>Total Bayar</span>
            <span className="price-big">{formatRupiah(totalPrice)}</span>
          </div>
          <Button
            className="btn-checkout"
            disabled={cart.length === 0}
            onClick={() => {
              setPaymentError("");
              setShowPaymentModal(true);
            }}
          >
            Proceed payment
          </Button>
        </div>
      </aside>

      <SideSheet
        isOpen={showPaymentModal}
        title="Pembayaran Tunai"
        subtitle="Selesaikan pembayaran dan cetak struk untuk pesanan ini."
        onClose={handleClosePaymentModal}
        width="500px"
        className="payment-side-sheet"
        overlayClassName="payment-sheet-overlay"
        footer={
          <div className="payment-sheet-footer">
            <Button variant="outline" onClick={handleClosePaymentModal}>
              Batal
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isProcessingPayment}>
              {isProcessingPayment ? "Memproses..." : "Konfirmasi & Cetak"}
            </Button>
          </div>
        }
      >
        <div className="payment-body">
          <section className="payment-total-card">
            <span>Total Tagihan</span>
            <strong>{formatRupiah(totalPrice)}</strong>
            <small>{cartItemCount} item dalam pesanan</small>
          </section>

          <section className="payment-section-card">
            <div className="payment-section-heading">
              <span>Uang diterima</span>
              <strong>{formatRupiah(cashAmount)}</strong>
            </div>
            <Input
              label="Uang Tunai Diterima"
              type="number"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder="Contoh: 50000"
              autoFocus
            />
            <div className="quick-cash-grid">
              {quickCashOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setCashReceived(String(amount))}
                >
                  {formatRupiah(amount)}
                </button>
              ))}
            </div>
          </section>

          <section
            className={`change-summary-card ${
              cashAmount < totalPrice && cashReceived ? "warning" : "ready"
            }`}
          >
            <span>
              {cashAmount < totalPrice && cashReceived
                ? "Tunai masih kurang"
                : "Kembalian"}
            </span>
            <strong>
              {cashAmount < totalPrice && cashReceived
                ? formatRupiah(totalPrice - cashAmount)
                : formatRupiah(changeAmount)}
            </strong>
          </section>

          <section className="payment-section-card">
            <div className="payment-section-heading">
              <span>Detail pelanggan</span>
              <small>Opsional</small>
            </div>
            <Input
              label="Nama Pelanggan"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Opsional"
            />
            <div className="payment-note-field">
              <label htmlFor="payment-note">Catatan Pembayaran</label>
              <textarea
                id="payment-note"
                rows="3"
                value={paymentNote}
                onChange={(event) => setPaymentNote(event.target.value)}
                placeholder="Opsional: meja, catatan pesanan, atau keterangan lain."
              />
            </div>
          </section>

          {paymentError && <div className="payment-error">{paymentError}</div>}
        </div>
      </SideSheet>

      <Modal
        isOpen={showSuccessModal}
        title="Transaksi Berhasil"
        message="Struk sudah dicetak dan pesanan masuk ke laporan penjualan."
        confirmText="Selesai"
        variant="primary"
        showCancel={false}
        onConfirm={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default POS;
