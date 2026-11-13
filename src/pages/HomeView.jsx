import { Link } from "../router.jsx";
import ProductCard from "../components/ProductCard";
import { PageError, PageLoading } from "../components/States";
import { CATEGORY_TILES, listProducts } from "../services/products";
import { useAsync } from "../hooks/useAsync";

const CATEGORY_COPY = {
  Women: "Effortless everyday style",
  Men: "Sharp, relaxed essentials",
  Footwear: "Step up your rotation",
  Accessories: "The finishing touch",
};

const BENEFITS = [
  {
    icon: "truck",
    title: "Fast delivery",
    copy: "1–3 days across India",
  },
  {
    icon: "return",
    title: "Easy returns",
    copy: "7-day return window",
  },
  {
    icon: "shield",
    title: "Quality guarantee",
    copy: "Curated pieces only",
  },
  {
    icon: "lock",
    title: "Secure payment",
    copy: "100% protected checkout",
  },
];

function BenefitIcon({ name }) {
  if (name === "truck") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M1.5 6.5h11v9h-11z" />
        <path d="M12.5 9.5h4l3 3v3h-7" />
        <circle cx="6" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </svg>
    );
  }
  if (name === "return") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5a8 8 0 1 1 1.8 8.2" />
        <path d="M4 4.5v5h5" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5 20 6v6c0 5-4 8-8 9.5C8 20 4 17 4 12V6z" />
        <path d="m8.5 12 2.4 2.4 4.6-4.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.5" y="10" width="15" height="11" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v3" />
    </svg>
  );
}

export default function HomeView() {
  const { data, loading, error, reload } = useAsync(() => listProducts(), []);
  const products = data?.items || [];
  const featured = products.filter((product) => product.featured).slice(0, 8);

  return (
    <>
      <section className="fs-hero fs-bleed">
        <div className="fs-hero-inner">
          <h1 className="fs-hero-eyebrow">
            Fashion that
            <br />
            moves with you
          </h1>

          <div className="fs-hero-word" aria-hidden="true">
            FASHION
          </div>

          <div className="fs-hero-figure">
            <img
              src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=900&q=80"
              alt="Model wearing a FashionStore seasonal look"
            />
          </div>

          <div className="fs-hero-cta">
            <Link to="/catalogue" className="btn btn-dark">
              Shop the collection <span aria-hidden="true">↗</span>
            </Link>
            <Link to="/wishlist" className="fs-hero-link">
              View wishlist <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="fs-hero-season">
            <span>Spring / Summer</span>
            <strong>2026</strong>
          </div>

          <div className="fs-hero-badge" aria-hidden="true">
            <span>New collection</span>
            <strong>26</strong>
            <span>Fashionstore</span>
          </div>
        </div>
      </section>

      <section className="fs-cat-grid" aria-label="Shop by category">
        {CATEGORY_TILES.map((category, index) => (
          <Link to="/catalogue" className="fs-cat-card" key={category.name}>
            <span className="fs-cat-num" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <img src={category.image} alt="" loading="lazy" />
            <div className="fs-cat-info">
              <h3>{category.name}</h3>
              <p>{CATEGORY_COPY[category.name] || "Shop the edit"}</p>
              <span className="fs-cat-link">
                Shop now <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="fs-banner fs-bleed">
        <img
          src="https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=80"
          alt=""
          loading="lazy"
        />
        <div className="container fs-banner-inner">
          <p className="fs-banner-eyebrow">New season</p>
          <h2>
            New
            <br />
            impressions
          </h2>
          <p className="fs-banner-copy">
            Discover everything that is relevant right now — new silhouettes, timeless layers and
            accessories that finish the look.
          </p>
          <Link to="/catalogue" className="btn btn-light">
            Shop the collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="fs-benefits" aria-label="Store benefits">
        {BENEFITS.map((benefit) => (
          <div className="fs-benefit" key={benefit.title}>
            <BenefitIcon name={benefit.icon} />
            <div>
              <strong>{benefit.title}</strong>
              <span>{benefit.copy}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="fs-section-head">
        <h2>Best of FashionStore</h2>
        <Link to="/catalogue" className="fs-section-link">
          View all <span aria-hidden="true">→</span>
        </Link>
      </div>

      {loading ? (
        <PageLoading label="Loading the latest edit…" />
      ) : error ? (
        <PageError error={error} onRetry={reload} />
      ) : (
        <div className="fs-product-grid">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
