import { Router } from "express";
import {
  buildCart,
  cartKey,
  cartSummary,
  carts,
  findProduct,
} from "../data/db.js";
import { ApiError } from "../lib/errors.js";
import { int, validateCartLine } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function payload(userId) {
  return { items: buildCart(userId), summary: cartSummary(userId) };
}

function linesFor(userId) {
  if (!carts.has(userId)) carts.set(userId, []);
  return carts.get(userId);
}

/** Add a line (or increase its quantity) and enforce stock. */
function upsertLine(userId, product, size, qty) {
  const lines = linesFor(userId);
  const key = cartKey(product.id, size);
  const existing = lines.find((line) => line.key === key);
  const nextQty = (existing?.qty || 0) + qty;

  if (nextQty > product.stock) {
    throw new ApiError(
      400,
      product.stock === 0
        ? `${product.name} is out of stock`
        : `Only ${product.stock} of ${product.name} left in stock`,
      { field: "qty", available: product.stock }
    );
  }

  if (existing) existing.qty = nextQty;
  else lines.push({ key, productId: product.id, size, qty });
}

router.get("/", (req, res) => {
  res.json(payload(req.user.id));
});

router.post("/", (req, res) => {
  const product = findProduct(req.body?.productId);
  if (!product) throw new ApiError(404, "Product not found", { field: "productId" });

  const { size, qty } = validateCartLine(req.body, product);
  upsertLine(req.user.id, product, size, qty);

  res.status(201).json(payload(req.user.id));
});

router.post("/merge", (req, res) => {
  const guestItems = Array.isArray(req.body?.items) ? req.body.items.slice(0, 100) : [];
  const skipped = [];

  for (const item of guestItems) {
    const product = findProduct(item?.productId);
    if (!product) {
      skipped.push({ productId: item?.productId, reason: "Product not found" });
      continue;
    }
    try {
      const { size, qty } = validateCartLine(item, product);
      upsertLine(req.user.id, product, size, qty);
    } catch (error) {
      skipped.push({ productId: product.id, reason: error.message });
    }
  }

  res.json({ ...payload(req.user.id), skipped });
});

router.put("/order", (req, res) => {
  const keys = req.body?.keys;
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== "string")) {
    throw new ApiError(400, "keys must be an array of cart line keys", { field: "keys" });
  }

  const lines = linesFor(req.user.id);
  if (keys.length !== lines.length || new Set(keys).size !== keys.length) {
    throw new ApiError(400, "keys must contain every cart line exactly once", { field: "keys" });
  }

  const byKey = new Map(lines.map((line) => [line.key, line]));
  if (keys.some((key) => !byKey.has(key))) {
    throw new ApiError(400, "One or more cart keys are unknown", { field: "keys" });
  }

  carts.set(req.user.id, keys.map((key) => byKey.get(key)));
  res.json(payload(req.user.id));
});

router.patch("/:key", (req, res) => {
  const lines = linesFor(req.user.id);
  const line = lines.find((candidate) => candidate.key === decodeURIComponent(req.params.key));
  if (!line) throw new ApiError(404, "Cart line not found");

  const qty = int(req.body?.qty, { field: "qty", label: "Quantity", min: 0, max: 99 });
  if (qty === 0) {
    carts.set(req.user.id, lines.filter((candidate) => candidate !== line));
    return res.json(payload(req.user.id));
  }

  const product = findProduct(line.productId);
  if (!product) throw new ApiError(404, "Product not found");
  if (qty > product.stock) {
    throw new ApiError(400, `Only ${product.stock} of ${product.name} left in stock`, {
      field: "qty",
      available: product.stock,
    });
  }

  line.qty = qty;
  res.json(payload(req.user.id));
});

router.delete("/:key", (req, res) => {
  const decoded = decodeURIComponent(req.params.key);
  const lines = linesFor(req.user.id);
  carts.set(
    req.user.id,
    lines.filter((line) => line.key !== decoded)
  );
  res.json(payload(req.user.id));
});

router.delete("/", (req, res) => {
  carts.set(req.user.id, []);
  res.json(payload(req.user.id));
});

export default router;
