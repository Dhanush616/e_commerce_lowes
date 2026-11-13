import { useState } from "react";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/FilterSidebar";
import { PageError } from "../components/States";
import { useDebounce } from "../hooks/useHelpers";
import { useAsync } from "../hooks/useAsync";
import { CATEGORIES } from "../services/products";
import { listProducts } from "../services/api";
import { useLiveUpdates } from "../context/LiveUpdatesContext";

export default function CatalogueView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const debouncedSearch = useDebounce(search, 250);
  const { version } = useLiveUpdates();

  const { data, loading, error, reload } = useAsync(
    () => listProducts({ search: debouncedSearch, category, sort }),
    [debouncedSearch, category, sort, version]
  );

  const products = data?.items || [];
  const categories = data?.categories || CATEGORIES;

  return (
    <>
      <div className="mb-4">
        <div className="fs-eyebrow">Catalogue</div>
        <h2 className="mt-1">Shop all products</h2>
      </div>
      <div className="row g-4">
        <div className="col-12 col-md-3">
          <FilterSidebar
            categories={categories}
            category={category}
            setCategory={setCategory}
            sort={sort}
            setSort={setSort}
          />
        </div>
        <div className="col-12 col-md-9">
          <div className="d-flex flex-column flex-md-row gap-2 mb-3 fs-toolbar-sticky">
            <div className="fs-searchbar flex-grow-1">
              <span className="fs-search-icon">⌕</span>
              <input
                className="form-control"
                placeholder="Search products by name, colour or category…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search products"
              />
            </div>
          </div>

          <p className="text-muted small" aria-live="polite">
            {loading
              ? "Fetching products…"
              : `Showing ${products.length} product${products.length === 1 ? "" : "s"}`}
            {category !== "All" && !loading && (
              <>
                {" "}
                in <strong>{category}</strong>
              </>
            )}
            {debouncedSearch && !loading && (
              <>
                {" "}
                matching “<strong>{debouncedSearch}</strong>”
              </>
            )}
          </p>

          {error ? (
            <PageError error={error} onRetry={reload} />
          ) : loading && products.length === 0 ? (
            <div className="fs-product-skeleton-grid" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="fs-skeleton-card" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="alert alert-info">
              No products match your search/filter. Try clearing filters or a different search
              term.
            </div>
          ) : (
            <div className="fs-shop-grid" style={{ opacity: loading ? 0.55 : 1 }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
