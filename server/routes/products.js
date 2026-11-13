import { Router } from "express";
import { CATEGORIES } from "../config.js";
import { findProduct, getMerchOrder, publicProduct, products } from "../data/db.js";
import { ApiError } from "../lib/errors.js";

const router = Router();

function truthy(value) {
  return value === "true" || value === "1";
}

router.get("/", (req, res) => {
  const { search = "", category = "", sort = "featured", ids = "", minPrice, maxPrice, featured, inStock, limit } = req.query;

  let list = products.map(publicProduct);

  const query = String(search).trim().toLowerCase();
  if (query) {
    list = list.filter((product) =>
      [product.name, product.description, product.category, ...(product.colours || [])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  if (category && category !== "All") {
    list = list.filter((product) => product.category === category);
  }

  if (ids) {
    const wanted = new Set(String(ids).split(",").map((id) => id.trim()).filter(Boolean));
    list = list.filter((product) => wanted.has(product.id));
  }

  if (minPrice !== undefined && minPrice !== "") {
    const min = Number(minPrice);
    if (!Number.isFinite(min)) throw new ApiError(400, "minPrice must be a number");
    list = list.filter((product) => product.price >= min);
  }

  if (maxPrice !== undefined && maxPrice !== "") {
    const max = Number(maxPrice);
    if (!Number.isFinite(max)) throw new ApiError(400, "maxPrice must be a number");
    list = list.filter((product) => product.price <= max);
  }

  if (featured !== undefined && truthy(featured)) {
    list = list.filter((product) => product.featured);
  }

  if (inStock !== undefined && truthy(inStock)) {
    list = list.filter((product) => product.stock > 0);
  }

  const rank = new Map(getMerchOrder().map((id, index) => [id, index]));

  if (sort === "price-low" || sort === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high" || sort === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (sort === "rating") {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === "newest") {
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else {
    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99);
    });
  }

  const total = list.length;
  if (limit !== undefined && limit !== "") {
    const count = Number(limit);
    if (!Number.isInteger(count) || count < 1) throw new ApiError(400, "limit must be a positive whole number");
    list = list.slice(0, count);
  }

  res.json({ items: list, total, categories: CATEGORIES });
});

router.get("/categories", (_req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get("/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ product: publicProduct(product) });
});

export default router;
