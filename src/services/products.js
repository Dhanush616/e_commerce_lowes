// The catalogue now lives on the Express server. This module keeps the
// category list and re-exports the tiny fetch helpers used by pages.
export { getCategories, getProduct, listProducts } from "./api.js";

export const CATEGORIES = ["Men", "Women", "Kids", "Footwear", "Accessories"];

export const CATEGORY_TILES = [
  {
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Footwear",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
  },
];
