import React, { useState } from "react";
import "./POS.css";
import { formatRupiah } from "../../utils/currency";
import { useApp } from "../../store/AppContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";

const POS = () => {
  const { products, ingredients, processTransaction } = useApp();
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // State Modal & Pembayaran
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State Modal Sukses
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashReceived, setCashReceived] = useState("");

  // 1. Logika Cek Ketersediaan Stok berdasarkan Resep
  const isOutOfStock = (product) => {
    if (!product || !product.recipe || !Array.isArray(product.recipe)) {
      return false;
    }

    return product.recipe.some((r) => {
      const ing = ingredients.find((i) => i.id === r.ingredientId);
      if (!ing) return true;
      return ing.stock < r.amount;
    });
  };

  // 2. Fungsi Cetak Struk
  const printReceipt = (items, total, cash, back, method) => {
    const printWindow = window.open("", "_blank");
    const date = new Date().toLocaleString("id-ID");

    const receiptContent = `
      <html>
        <head>
          <title>Cetak Struk - Locales</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .header h2 { margin: 5px 0; color: #092379; }
            .info { font-size: 12px; margin: 10px 0; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item-row { display: flex; justify-content: space-between; font-size: 13px; margin: 5px 0; }
            .totals { font-weight: bold; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>LOCALES</h2>
            <p>Fresh & Quality Drinks</p>
          </div>
          <div class="info">
            <div>Waktu: ${date}</div>
            <div>Metode: ${method}</div>
          </div>
          <div class="items">
            ${items
              .map(
                (item) => `
              <div class="item-row">
                <span>${item.name} x${item.qty}</span>
                <span>${formatRupiah(item.price * item.qty)}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          <div class="totals">
            <div class="item-row">
              <span>TOTAL</span>
              <span>${formatRupiah(total)}</span>
            </div>
            ${
              method === "Cash"
                ? `
              <div class="item-row" style="font-weight: normal; font-size: 12px;">
                <span>Tunai</span>
                <span>${formatRupiah(parseInt(cash || 0))}</span>
              </div>
              <div class="item-row" style="font-weight: normal; font-size: 12px;">
                <span>Kembali</span>
                <span>${formatRupiah(back)}</span>
              </div>
            `
                : ""
            }
          </div>
          <div class="footer">
            <p>Terima kasih telah berkunjung!</p>
            <p>Follow us @locales.id</p>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(() => { window.close(); }, 100);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  // 3. Filter Menu
  const filteredProducts =
    selectedCategory === "Semua"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const addToCart = (product) => {
    if (isOutOfStock(product)) {
      alert(`Waduh Ham, stok bahan untuk ${product.name} tidak cukup!`);
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        ),
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.qty > 0),
    );
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const change = cashReceived ? parseInt(cashReceived) - totalPrice : 0;

  // HANDLE PEMBAYARAN
  const handleConfirmPayment = () => {
    if (paymentMethod === "Cash" && (cashReceived === "" || change < 0)) {
      alert("Uang yang diterima kurang atau belum diisi, Ham!");
      return;
    }

    const cartForTransaction = cart.map((item) => ({
      ...item,
      quantity: item.qty,
    }));

    // Proses ke context & cetak
    processTransaction(cartForTransaction, paymentMethod, totalPrice);
    printReceipt(cart, totalPrice, cashReceived, change, paymentMethod);

    // Reset dan tampilkan modal sukses custom
    setCart([]);
    setShowModal(false);
    setCashReceived("");
    setShowSuccessModal(true); // <--- Munculkan pop-up custom
  };

  return (
    <div className="pos-container">
      {/* SEKSI KIRI: MENU & FILTER */}
      <div className="products-section">
        <div className="products-header">
          <h2 style={{ color: "#092379" }}>Menu Locales</h2>
          <div className="category-filters">
            {["Semua", "Milk Tea", "Tea", "Coffee"].map((cat) => (
              <button
                key={cat}
                className={`btn-filter-cat ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => {
            if (!product) return null;
            const outOfStock = isOutOfStock(product);
            return (
              <div
                key={product.id}
                className={`product-card ${outOfStock ? "disabled" : ""}`}
                onClick={() => !outOfStock && addToCart(product)}
              >
                {outOfStock && <div className="oos-badge">Habis</div>}
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    "🧋"
                  )}
                </div>
                <h3>{product.name}</h3>
                <p>{formatRupiah(product.price)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEKSI KANAN: KERANJANG */}
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
              <p>Belum ada pesanan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <strong>{item.name}</strong>
                  <span>{formatRupiah(item.price)}</span>
                </div>
                <div className="item-controls">
                  <button onClick={() => updateQty(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)}>+</button>
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
            style={{ width: "100%", padding: "15px", fontSize: "16px" }}
            disabled={cart.length === 0}
            onClick={() => setShowModal(true)}
          >
            BAYAR SEKARANG
          </Button>
        </div>
      </div>

      {/* MODAL PEMBAYARAN (BAWAAN POS) */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content payment-modal">
            <div className="modal-header">
              <h2>Konfirmasi Pembayaran</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <div className="payment-options">
              <button
                className={`btn-option ${paymentMethod === "Cash" ? "active" : ""}`}
                onClick={() => setPaymentMethod("Cash")}
              >
                💵 Tunai
              </button>
              <button
                className={`btn-option ${paymentMethod === "QRIS" ? "active" : ""}`}
                onClick={() => setPaymentMethod("QRIS")}
              >
                📱 QRIS
              </button>
            </div>

            <div className="payment-body">
              <div className="bill-detail">
                <span>Total Tagihan:</span>
                <strong className="bill-total" style={{ color: "#092379" }}>
                  {formatRupiah(totalPrice)}
                </strong>
              </div>

              {paymentMethod === "Cash" ? (
                <div className="cash-input-area">
                  <Input
                    label="Uang Tunai Diterima:"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="Contoh: 50000"
                    autoFocus
                  />
                  <div className="change-display">
                    <span>Kembalian:</span>
                    <strong className={change < 0 ? "negative" : "positive"}>
                      {formatRupiah(change >= 0 ? change : 0)}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="qris-display">
                  <div className="qr-code-box">QRIS LOCALES</div>
                  <p>Arahkan kamera pelanggan ke kode QR</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button onClick={handleConfirmPayment}>Konfirmasi & Cetak</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUKSES CUSTOM (PENGGANTI ALERT) */}
      <Modal
        isOpen={showSuccessModal}
        title="Transaksi Berhasil! ✅"
        message="Struk sudah dicetak. Pesanan telah masuk ke laporan penjualan."
        confirmText="Selesai"
        variant="primary"
        showCancel={false}
        onConfirm={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default POS;
