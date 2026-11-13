import SortSelect from "./SortSelect";

export default function FilterSidebar({ categories = [], category, setCategory, sort, setSort }) {
  return (
    <div className="card p-3 fs-filters">
      <div className="fs-eyebrow-sm mb-2">Category</div>
      <div className="list-group mb-3">
        <button
          className={`list-group-item list-group-item-action ${category === "All" ? "active" : ""}`}
          onClick={() => setCategory("All")}
        >
          All Products
        </button>
        {categories.map((item) => (
          <button
            key={item}
            className={`list-group-item list-group-item-action ${category === item ? "active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="fs-eyebrow-sm mb-2 mt-1">Sort by</div>
      <SortSelect sort={sort} setSort={setSort} />
      {(category !== "All" || sort !== "featured") && (
        <button
          className="btn btn-sm btn-outline-secondary mt-3"
          onClick={() => {
            setCategory("All");
            setSort("featured");
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
