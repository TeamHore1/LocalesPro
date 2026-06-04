import React, { useMemo, useState } from "react";
import "./POS.css";
import { formatRupiah } from "../../utils/currency";
import { useApp } from "../../hooks/useApp";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const toNumber = (value) => {
  const parsed = Number(String(value ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const POS = () => {
  const { products, ingredients, processTransaction } = useApp();

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cashAmount = toNumber(cashReceived);
  const changeAmount = Math.max(cashAmount - totalPrice, 0);

  const categories = useMemo(
    () => ["Semua", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

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
      window.alert(`Stok bahan untuk ${product.name} tidak cukup.`);
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
            window.alert(`Stok bahan untuk ${item.name} tidak cukup.`);
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
      <div className="products-section">
        <div className="products-header">
          <div>
            <h2>Menu Locales</h2>
            <p>{filteredProducts.length} menu tersedia untuk dipilih</p>
          </div>
          <div className="category-filters">
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

        <div className="pos-toolbar">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari menu atau kategori..."
            className="menu-search-input"
          />
        </div>

        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
            const outOfStock = isOutOfStock(product);
            const availableCount = getAvailableStockCount(product);

            return (
              <button
                key={product.id}
                type="button"
                className={`product-card ${outOfStock ? "disabled" : ""}`}
                onClick={() => !outOfStock && addToCart(product)}
              >
                {outOfStock && <span className="oos-badge">Habis</span>}
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <span>Drink</span>
                  )}
                </div>
                <h3>{product.name}</h3>
                <p>{formatRupiah(product.price)}</p>
                <span className="stock-chip">
                  {Number.isFinite(availableCount)
                    ? `${availableCount} porsi`
                    : "Siap jual"}
                </span>
              </button>
            );
            })
          ) : (
            <div className="empty-product-state">
              <p>Menu tidak ditemukan.</p>
            </div>
          )}
        </div>
      </div>

      <div className="cart-section">
        <div className="cart-header">
          <h3>Pesanan Aktif</h3>
          <Button
            variant="outline"
            className="btn-small"
            onClick={() => setCart([])}
          >
            Hapus Semua
          </Button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Belum ada pesanan.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <strong>{item.name}</strong>
                  <span>{formatRupiah(item.price)}</span>
                </div>
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
            ))
          )}
        </div>

        <div className="cart-footer">
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
            Bayar Sekarang
          </Button>
        </div>
      </div>

      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <h2>Konfirmasi Pembayaran Tunai</h2>
              <button
                className="btn-close"
                onClick={handleClosePaymentModal}
                type="button"
              >
                &times;
              </button>
            </div>

            <div className="payment-body">
              <div className="bill-detail">
                <span>Total Tagihan</span>
                <strong className="bill-total">{formatRupiah(totalPrice)}</strong>
              </div>

              <div className="cash-input-area">
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
                <div className="change-display">
                  <span>Kembalian</span>
                  <strong
                    className={
                      cashAmount < totalPrice && cashReceived ? "negative" : "positive"
                    }
                  >
                    {formatRupiah(changeAmount)}
                  </strong>
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
              </div>

              {paymentError && <div className="payment-error">{paymentError}</div>}
            </div>

            <div className="modal-footer">
              <Button variant="outline" onClick={handleClosePaymentModal}>
                Batal
              </Button>
              <Button onClick={handleConfirmPayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? "Memproses..." : "Konfirmasi & Cetak"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
