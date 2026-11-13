import { Link } from "../router.jsx";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import { listProducts } from "../services/api";
import { formatPrice } from "../utils/calculations";
import { useAsync } from "../hooks/useAsync";
import { PageError, PageLoading } from "../components/States";

export default function WishlistView() {
  const { wishlist, removeFromWishlist, isServerWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { version } = useLiveUpdates();
  const idsKey = wishlist.join(",");

  const { data, loading, error, reload } = useAsync(
    () => (idsKey ? listProducts({ ids: idsKey }) : Promise.resolve({ items: [] })),
    [idsKey, version]
  );

  const saved = data?.items || [];

  if (loading && saved.length === 0) return <PageLoading label="Loading your wishlist…" />;
  if (error) return <PageError error={error} onRetry={reload} />;

  if (saved.length === 0) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 520 }}>
        <div className="fs-eyebrow">Saved</div>
        <h3 className="mt-1">Your wishlist is empty</h3>
        <p className="text-muted">Save products for later by tapping ♡ on any product.</p>
        <Link to="/catalogue" className="btn btn-dark">
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="fs-eyebrow">Saved</div>
        <h2 className="mt-1">Wishlist ({saved.length})</h2>
        <p className="small text-muted mb-0">
          {isServerWishlist ? "Synced to your account." : "Guest wishlist — saved in this browser."}
        </p>
      </div>
      <div className="row g-4">
        {saved.map((product) => (
          <div className="col-6 col-md-4 col-lg-3" key={product.id}>
            <div className="card h-100 fs-product-card">
              <div className="fs-img-wrap">
                <Link to={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} loading="lazy" />
                </Link>
              </div>
              <div className="card-body d-flex flex-column">
                <div className="fs-eyebrow-sm mb-1">{product.category}</div>
                <Link to={`/product/${product.id}`} className="text-decoration-none">
                  <h6 className="fs-product-title">{product.name}</h6>
                </Link>
                <div className="fs-price mb-3">{formatPrice(product.price)}</div>
                <div className="mt-auto d-grid gap-2">
                  <button
                    className="btn btn-sm btn-dark"
                    disabled={product.stock === 0}
                    onClick={async () => {
                      const ok = await addToCart(product, 1);
                      if (ok) removeFromWishlist(product.id);
                    }}
                  >
                    {product.stock === 0 ? "Out of Stock" : "Move to Cart"}
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
