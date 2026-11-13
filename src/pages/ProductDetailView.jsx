import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import { formatPrice } from "../utils/calculations";
import Button from "../components/Button";
import { PageError, PageLoading } from "../components/States";
import { getProduct } from "../services/api";
import { useAsync } from "../hooks/useAsync";

export default function ProductDetailView({ productId }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { version } = useLiveUpdates();
  const { data, loading, error, reload } = useAsync(() => getProduct(productId), [
    productId,
    version,
  ]);

  const product = data?.product;
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (product) {
      setSize(product.sizes?.[0] || "One Size");
      setQty(1);
    }
  }, [product?.id]);

  if (loading && !product) return <PageLoading label="Loading product…" />;
  if (error && !product) {
    return (
      <div className="alert alert-warning">
        {error.status === 404 ? "Product not found." : "Could not load this product."}{" "}
        <Link to="/catalogue">Back to catalogue</Link>
        <div className="mt-2">
          <button className="btn btn-sm btn-outline-dark" onClick={reload}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (!product) return <PageError error={error} onRetry={reload} />;

  const out = product.stock === 0;
  const wished = isWishlisted(product.id);

  async function handleAdd() {
    setBusy(true);
    const ok = await addToCart(product, qty, { size });
    setBusy(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  }

  return (
    <div className="row g-4 g-lg-5">
      <div className="col-12 col-md-6">
        <img
          src={product.image}
          alt={product.name}
          className="img-fluid w-100 fs-detail-img"
          style={{ maxHeight: 560, objectFit: "cover" }}
        />
      </div>
      <div className="col-12 col-md-6">
        <Link to="/catalogue" className="fs-crumb">
          ← Back to catalogue
        </Link>
        <div className="d-flex gap-2 align-items-center mt-3 mb-1 flex-wrap">
          <span className="fs-chip">{product.category}</span>
          {out ? (
            <span className="badge rounded-pill text-bg-danger">Out of stock</span>
          ) : (
            <span className="badge rounded-pill text-bg-success">
              In stock ({product.stock})
            </span>
          )}
          {product.featured && <span className="badge rounded-pill text-bg-warning">Featured</span>}
        </div>
        <h2 className="mt-1">{product.name}</h2>
        <div className="fs-stars">
          {"★".repeat(Math.round(product.rating))}
          {"☆".repeat(5 - Math.round(product.rating))}{" "}
          <span className="text-muted small">({product.rating})</span>
        </div>
        <div className="fs-price mt-2" style={{ fontSize: "1.8rem" }}>
          {formatPrice(product.price)}
        </div>
        <p className="text-muted mt-2">{product.description}</p>
        <p className="small text-muted">
          Colours: {product.colours?.join(", ")} · Free shipping over ₹999 · 7-day returns
        </p>

        {product.sizes?.length > 1 && (
          <div className="mb-3">
            <label className="form-label fw-semibold small text-uppercase text-muted">Size</label>
            <div className="d-flex gap-2 flex-wrap">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  className={`btn btn-sm fs-opt ${size === option ? "btn-dark" : "btn-outline-dark"}`}
                  onClick={() => setSize(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="d-flex align-items-center gap-3 mb-4">
          <label className="fw-semibold small text-uppercase text-muted">Qty</label>
          <div className="fs-qty" role="group" aria-label="Quantity">
            <button
              disabled={qty <= 1}
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span>{qty}</span>
            <button
              disabled={qty >= product.stock}
              onClick={() => setQty((value) => Math.min(product.stock, value + 1))}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button variant="dark" disabled={out || busy} loading={busy} onClick={handleAdd}>
            {out
              ? "Out of Stock"
              : added
                ? "Added ✓"
                : `Add to Cart — ${formatPrice(product.price * qty)}`}
          </Button>
          <Button
            variant={wished ? "dark" : "outline-dark"}
            onClick={() => toggleWishlist(product.id)}
          >
            {wished ? "♥ Wishlisted" : "♡ Wishlist"}
          </Button>
        </div>

        {!out && (
          <p className="small text-muted mt-3 mb-0">
            Stock is live — open the Admin dashboard and change stock to see this number update
            without a refresh.
          </p>
        )}
      </div>
    </div>
  );
}
