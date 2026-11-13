import { useState } from "react";
import { Link } from "../router.jsx";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/calculations";

const COLOUR_HEX = {
  white: "#ffffff",
  black: "#0a0a0a",
  navy: "#1d2a44",
  blue: "#3f6389",
  grey: "#8c8c86",
  gray: "#8c8c86",
  red: "#a5332b",
  "floral red": "#a85656",
  "floral blue": "#5d7f9f",
  camel: "#b3946f",
  natural: "#dbd1c0",
  tan: "#b98a5e",
  brown: "#6b4b33",
  cream: "#efe7d6",
  beige: "#d9cbb3",
  gold: "#c0a052",
  silver: "#c3c3c3",
  "light blue": "#aec6d8",
  "floral white": "#efe8e9",
  "floral pink": "#d49aa8",
  pink: "#d49aa8",
};

function colourHex(name = "") {
  return COLOUR_HEX[name.toLowerCase()] || "#d2d2cc";
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [busy, setBusy] = useState(false);
  const wished = isWishlisted(product.id);
  const out = product.stock === 0;

  async function handleAdd() {
    setBusy(true);
    await addToCart(product, 1);
    setBusy(false);
  }

  return (
    <article className="fs-product-card">
      <div className="fs-img-wrap">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>

        {out && <span className="fs-soldout">Sold out</span>}

        <button
          className={`fs-wish-btn${wished ? " is-active" : ""}`}
          type="button"
          title={wished ? "Remove from wishlist" : "Save to wishlist"}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          onClick={() => toggleWishlist(product.id)}
        >
          {wished ? "♥" : "♡"}
        </button>

        <button
          className="fs-quick-add"
          type="button"
          disabled={out || busy}
          onClick={handleAdd}
        >
          {out ? "Sold out" : busy ? "Adding…" : "Add to bag +"}
        </button>
      </div>

      <div className="fs-product-info">
        <span className="fs-product-cat">{product.category}</span>
        <Link to={`/product/${product.id}`} className="fs-product-title">
          {product.name}
        </Link>
        <div className="fs-product-row">
          <span className="fs-price">{formatPrice(product.price)}</span>
          <span className="fs-colors" aria-hidden="true">
            {(product.colours || []).slice(0, 4).map((colour) => (
              <span
                key={colour}
                className="fs-color-dot"
                style={{ background: colourHex(colour) }}
                title={colour}
              />
            ))}
          </span>
        </div>
      </div>
    </article>
  );
}
