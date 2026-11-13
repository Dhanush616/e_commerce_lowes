import { Router } from "express";
import { findProduct, publicProduct, wishlists } from "../data/db.js";
import { ApiError } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function idsFor(userId) {
  if (!wishlists.has(userId)) wishlists.set(userId, []);
  return wishlists.get(userId);
}

function payload(userId) {
  const ids = idsFor(userId);
  const items = ids
    .map((id) => findProduct(id))
    .filter(Boolean)
    .map(publicProduct);
  return { ids, items };
}

router.get("/", (req, res) => {
  res.json(payload(req.user.id));
});

router.post("/", (req, res) => {
  const product = findProduct(req.body?.productId);
  if (!product) throw new ApiError(404, "Product not found", { field: "productId" });

  const ids = idsFor(req.user.id);
  if (!ids.includes(product.id)) ids.push(product.id);

  res.status(201).json(payload(req.user.id));
});

router.post("/merge", (req, res) => {
  const incoming = Array.isArray(req.body?.ids) ? req.body.ids.slice(0, 100) : [];
  const ids = idsFor(req.user.id);

  for (const id of incoming) {
    if (typeof id === "string" && findProduct(id) && !ids.includes(id)) ids.push(id);
  }

  res.json(payload(req.user.id));
});

router.delete("/:productId", (req, res) => {
  const ids = idsFor(req.user.id).filter((id) => id !== req.params.productId);
  wishlists.set(req.user.id, ids);
  res.json(payload(req.user.id));
});

export default router;
