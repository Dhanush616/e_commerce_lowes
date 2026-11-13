import { Router } from "express";
import { buildCart, carts, findProduct, nextOrderId, orders } from "../data/db.js";
import { ApiError } from "../lib/errors.js";
import { totalsFor } from "../lib/money.js";
import { broadcast } from "../lib/sse.js";
import {
  assertPhone,
  assertZip,
  validateCustomer,
} from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.post("/", (req, res) => {
  const customer = validateCustomer(req.body);
  assertPhone(customer.phone);
  assertZip(customer.zip);

  const lines = buildCart(req.user.id);
  if (lines.length === 0) {
    throw new ApiError(400, "Your cart is empty. Add a product before checkout.");
  }

  // Validate every line before mutating any stock.
  for (const line of lines) {
    if (line.product.stock < line.qty) {
      throw new ApiError(
        409,
        `${line.product.name} only has ${line.product.stock} left. Update your cart to continue.`,
        { productId: line.productId, available: line.product.stock }
      );
    }
  }

  const items = lines.map((line) => ({
    productId: line.productId,
    name: line.product.name,
    category: line.product.category,
    price: line.product.price,
    size: line.size,
    qty: line.qty,
  }));

  const totals = totalsFor(items);

  // The server is the source of truth for stock and money.
  for (const line of lines) {
    const product = findProduct(line.productId);
    product.stock -= line.qty;
  }

  const order = {
    id: nextOrderId(),
    userId: req.user.id,
    customer,
    items,
    ...totals,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);
  carts.set(req.user.id, []);

  broadcast("order", {
    orderId: order.id,
    total: order.total,
    status: order.status,
    customerName: customer.name,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
  });

  res.status(201).json({ order });
});

router.get("/", (req, res) => {
  const mine = orders
    .filter((order) => order.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders: mine });
});

router.get("/:id", (req, res) => {
  const order = orders.find((candidate) => candidate.id === req.params.id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.userId !== req.user.id && req.user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to view this order");
  }
  res.json({ order });
});

export default router;
