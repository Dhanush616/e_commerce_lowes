import { Link } from "../router.jsx";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/calculations";

export default function CartItemRow({
  item,
  isDragging = false,
  isOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const { updateQty, removeItem } = useCart();
  const product = item.product || {};
  const lineTotal = (product.price || 0) * item.qty;

  return (
    <div
      className={`card fs-cart-row mb-3 p-2 ${isDragging ? "fs-dragging" : ""} ${
        isOver ? "fs-drop-target" : ""
      }`}
      draggable
      onDragStart={(event) => onDragStart?.(event, item.key)}
      onDragOver={(event) => onDragOver?.(event, item.key)}
      onDrop={(event) => onDrop?.(event, item.key)}
      onDragEnd={onDragEnd}
    >
      <span className="fs-drag-handle" title="Drag to reorder" aria-hidden="true">
        ⠿
      </span>
      <div className="row g-0 align-items-center">
        <div className="col-md-2">
          <Link to={`/product/${product.id}`}>
            <img
              src={product.image}
              alt={product.name}
              className="img-fluid"
              style={{ height: 110, width: "100%", objectFit: "cover" }}
            />
          </Link>
        </div>
        <div className="col-md-6">
          <div className="card-body py-2" style={{ boxShadow: "none" }}>
            <Link to={`/product/${product.id}`} className="text-decoration-none">
              <h6 className="mb-1 font-display" style={{ fontSize: "1rem" }}>
                {product.name}
              </h6>
            </Link>
            <div className="small text-muted">{item.size && <>Size: {item.size}</>}</div>
            <div className="small">{formatPrice(product.price)} each</div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="fs-qty" role="group" aria-label="Quantity">
            <button onClick={() => updateQty(item.key, item.qty - 1)} aria-label="Decrease quantity">
              −
            </button>
            <span>{item.qty}</span>
            <button
              onClick={() => updateQty(item.key, item.qty + 1)}
              disabled={item.qty >= (product.stock ?? 99)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        <div className="col-md-2 text-end pe-3">
          <div className="fw-bold">{formatPrice(lineTotal)}</div>
          <button
            className="btn btn-sm btn-link text-danger p-0"
            onClick={() => removeItem(item.key)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
