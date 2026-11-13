import { useState } from "react";
import { Link } from "../router.jsx";
import { useCart } from "../context/CartContext";
import CartItemRow from "../components/CartItemRow";
import { calcTotals, formatPrice } from "../utils/calculations";

export default function CartView() {
  const { items, clearCart, reorderItems, syncing, isServerCart } = useCart();
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const { subtotal, tax, shipping, total } = calcTotals(items);

  function handleDragStart(event, key) {
    setDragKey(key);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", key);
  }

  function handleDragOver(event, key) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (key !== overKey) setOverKey(key);
  }

  function handleDrop(event, key) {
    event.preventDefault();
    const from = dragKey || event.dataTransfer.getData("text/plain");
    setDragKey(null);
    setOverKey(null);
    if (!from || from === key) return;

    const keys = items.map((item) => item.key);
    const fromIndex = keys.indexOf(from);
    const toIndex = keys.indexOf(key);
    if (fromIndex < 0 || toIndex < 0) return;

    keys.splice(fromIndex, 1);
    keys.splice(toIndex, 0, from);
    reorderItems(keys);
  }

  function resetDrag() {
    setDragKey(null);
    setOverKey(null);
  }

  if (syncing && items.length === 0) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 520 }}>
        <span className="spinner-border" role="status" />
        <p className="text-muted mt-3 mb-0">Syncing your bag with the server…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 520 }}>
        <div className="fs-eyebrow">Cart</div>
        <h3 className="mt-1">Your cart is empty</h3>
        <p className="text-muted">Looks like you haven’t added anything yet.</p>
        <Link to="/catalogue" className="btn btn-dark">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="fs-eyebrow">Your Bag</div>
        <h2 className="mt-1">
          Shopping cart ({items.reduce((sum, item) => sum + item.qty, 0)})
        </h2>
        <p className="small text-muted mb-0">
          {isServerCart
            ? "Saved to your account on the Express server."
            : "Guest bag — saved in this browser. Sign in at checkout to sync it to the server."}
        </p>
      </div>

      {!isServerCart && (
        <div className="alert alert-info d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>Your guest bag will be merged into your account when you log in.</span>
          <Link to="/login" className="btn btn-sm btn-dark">
            Sign in
          </Link>
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-md-8">
          <p className="small text-muted">⠿ Drag a row to reorder your bag.</p>
          {items.map((item) => (
            <CartItemRow
              key={item.key}
              item={item}
              isDragging={dragKey === item.key}
              isOver={overKey === item.key}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={resetDrag}
            />
          ))}
          <button className="btn btn-sm btn-outline-danger" onClick={clearCart}>
            Clear cart
          </button>
        </div>
        <div className="col-12 col-md-4">
          <div className="fs-summary p-4">
            <div className="fs-eyebrow mb-1">Summary</div>
            <h5 className="font-display">Order summary</h5>
            <div className="d-flex justify-content-between small mt-3">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Tax (8%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="d-flex justify-content-between small">
              <span>Shipping</span>
              <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link to="/checkout" className="btn btn-warning w-100 mt-3">
              Proceed to Checkout
            </Link>
            <div className="text-center mt-2">
              <Link to="/catalogue" className="btn btn-link btn-sm text-light">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
