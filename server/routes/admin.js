import { Router } from "express";
import { ORDER_STATUSES } from "../config.js";
import {
  findProduct,
  getMerchOrder,
  orders,
  products,
  publicProduct,
  publicUser,
  setMerchOrder,
  users,
} from "../data/db.js";
import { ApiError } from "../lib/errors.js";
import { round2 } from "../lib/money.js";
import { broadcast, liveClientCount } from "../lib/sse.js";
import { boolean, int, number, oneOf } from "../lib/validate.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireRole("admin"));

router.get("/stats", (_req, res) => {
  const activeOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = round2(activeOrders.reduce((sum, order) => sum + order.total, 0));
  const unitsSold = activeOrders.reduce(
    (sum, order) => sum + order.items.reduce((count, item) => count + item.qty, 0),
    0
  );

  const categoryRevenue = new Map();
  const productSales = new Map();

  for (const order of activeOrders) {
    for (const item of order.items) {
      categoryRevenue.set(
        item.category,
        round2((categoryRevenue.get(item.category) || 0) + item.price * item.qty)
      );
      const current = productSales.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        units: 0,
        revenue: 0,
      };
      current.units += item.qty;
      current.revenue = round2(current.revenue + item.price * item.qty);
      productSales.set(item.productId, current);
    }
  }

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(Date.now() - offset * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const dayOrders = activeOrders.filter((order) => order.createdAt.slice(0, 10) === key);
    days.push({
      date: key,
      label: `${date.getUTCDate()}/${date.getUTCMonth() + 1}`,
      orders: dayOrders.length,
      revenue: round2(dayOrders.reduce((sum, order) => sum + order.total, 0)),
    });
  }

  res.json({
    totals: {
      revenue,
      orders: orders.length,
      activeOrders: activeOrders.length,
      customers: users.filter((user) => user.role === "customer").length,
      products: products.length,
      unitsSold,
      averageOrderValue: activeOrders.length ? round2(revenue / activeOrders.length) : 0,
      lowStockCount: products.filter((product) => product.stock <= 5).length,
    },
    revenueByCategory: [...categoryRevenue.entries()]
      .map(([category, value]) => ({ category, revenue: value }))
      .sort((a, b) => b.revenue - a.revenue),
    ordersByDay: days,
    topProducts: [...productSales.values()].sort((a, b) => b.units - a.units).slice(0, 5),
    lowStock: products
      .filter((product) => product.stock <= 5)
      .map(publicProduct)
      .sort((a, b) => a.stock - b.stock),
    recentOrders: orders.slice(0, 5),
    liveClients: liveClientCount(),
  });
});

router.get("/orders", (req, res) => {
  const status = req.query.status;
  let list = [...orders];
  if (status) {
    oneOf(status, ORDER_STATUSES, { field: "status", label: "Status" });
    list = list.filter((order) => order.status === status);
  }
  res.json({ orders: list });
});

router.patch("/orders/:id/status", (req, res) => {
  const status = oneOf(req.body?.status, ORDER_STATUSES, { field: "status", label: "Status" });
  const order = orders.find((candidate) => candidate.id === req.params.id);
  if (!order) throw new ApiError(404, "Order not found");

  order.status = status;
  broadcast("order", {
    orderId: order.id,
    status,
    total: order.total,
    customerName: order.customer.name,
    updated: true,
  });

  res.json({ order });
});

router.get("/users", (_req, res) => {
  res.json({ users: users.map(publicUser) });
});

router.patch("/products/:id", (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  const updates = {};
  if (req.body?.stock !== undefined) {
    updates.stock = int(req.body.stock, { field: "stock", label: "Stock", min: 0, max: 10_000 });
  }
  if (req.body?.price !== undefined) {
    updates.price = number(req.body.price, { field: "price", label: "Price", min: 1, max: 1_000_000 });
  }
  if (req.body?.featured !== undefined) {
    updates.featured = boolean(req.body.featured, { field: "featured", label: "Featured" });
  }

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "Provide stock, price or featured to update");
  }

  const stockChanged = updates.stock !== undefined;
  Object.assign(product, updates);

  if (stockChanged) {
    broadcast("stock", {
      productId: product.id,
      name: product.name,
      stock: product.stock,
      price: product.price,
      featured: product.featured,
    });
  } else {
    broadcast("product", {
      action: "updated",
      productId: product.id,
      name: product.name,
      price: product.price,
      featured: product.featured,
      stock: product.stock,
    });
  }

  res.json({ product: publicProduct(product) });
});

router.put("/products/order", (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    throw new ApiError(400, "ids must be an array of product ids", { field: "ids" });
  }
  if (ids.length !== products.length || new Set(ids).size !== ids.length) {
    throw new ApiError(400, "ids must contain every product exactly once", { field: "ids" });
  }
  if (ids.some((id) => !findProduct(id))) {
    throw new ApiError(400, "One or more product ids are unknown", { field: "ids" });
  }

  setMerchOrder(ids);
  broadcast("product", { action: "reordered", order: getMerchOrder() });

  res.json({ order: getMerchOrder() });
});

export default router;
