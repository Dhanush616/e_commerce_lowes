import assert from "node:assert/strict";
import { once } from "node:events";
import test, { after, before } from "node:test";

import { createApp } from "../app.js";

let server;
let base;
let customerToken;
let adminToken;
let createdOrderId;
let uniqueEmail;

before(async () => {
  process.env.NODE_ENV = "test";
  const app = createApp({ serveStatic: false });
  server = app.listen(0);
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
  uniqueEmail = `tester${Date.now()}@example.com`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(resolve));
});

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${base}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return { status: response.status, body: payload, headers: response.headers };
}

test("health endpoint reports the API is alive", async () => {
  const res = await request("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.service, "fashion-store-api");
});

test("products can be searched, filtered and sorted", async () => {
  const all = await request("/products");
  assert.equal(all.status, 200);
  assert.equal(all.body.items.length, 16);
  assert.deepEqual(all.body.categories, ["Men", "Women", "Kids", "Footwear", "Accessories"]);

  const women = await request("/products?category=Women&sort=price-low");
  assert.equal(women.status, 200);
  assert.ok(women.body.items.length >= 3);
  assert.ok(women.body.items.every((product) => product.category === "Women"));
  const prices = women.body.items.map((product) => product.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));

  const search = await request("/products?search=denim");
  assert.ok(search.body.items.some((product) => product.name.includes("Denim")));

  const featured = await request("/products?featured=true&limit=3");
  assert.equal(featured.body.items.length, 3);
  assert.ok(featured.body.items.every((product) => product.featured));
});

test("single product lookup returns 404 for unknown ids", async () => {
  const found = await request("/products/p1");
  assert.equal(found.status, 200);
  assert.equal(found.body.product.id, "p1");

  const missing = await request("/products/nope");
  assert.equal(missing.status, 404);
  assert.match(missing.body.error.message, /not found/i);
});

test("registration validates input and rejects duplicate emails", async () => {
  const invalid = await request("/auth/register", {
    method: "POST",
    body: { name: "A", email: "not-an-email", password: "123" },
  });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.error.details.field);

  const created = await request("/auth/register", {
    method: "POST",
    body: { name: "Test Shopper", email: uniqueEmail, password: "Secret123" },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.email, uniqueEmail);
  assert.equal(created.body.user.role, "customer");
  assert.ok(created.body.token.length > 20);
  assert.equal(created.body.user.passwordHash, undefined);

  const duplicate = await request("/auth/register", {
    method: "POST",
    body: { name: "Test Shopper", email: uniqueEmail, password: "Secret123" },
  });
  assert.equal(duplicate.status, 409);
});

test("login issues an opaque session and rejects bad passwords", async () => {
  const bad = await request("/auth/login", {
    method: "POST",
    body: { email: "alex@example.com", password: "wrong-password" },
  });
  assert.equal(bad.status, 401);

  const ok = await request("/auth/login", {
    method: "POST",
    body: { email: "alex@example.com", password: "User@123" },
  });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.user.role, "customer");
  customerToken = ok.body.token;
});

test("session endpoint requires a bearer token", async () => {
  const anonymous = await request("/auth/me");
  assert.equal(anonymous.status, 401);

  const me = await request("/auth/me", { token: customerToken });
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "alex@example.com");
  assert.equal(typeof me.body.cartCount, "number");
});

test("cart endpoints require authentication", async () => {
  const res = await request("/cart");
  assert.equal(res.status, 401);
  assert.match(res.body.error.message, /log in/i);
});

test("cart supports add, update, stock limits and line keys", async () => {
  const added = await request("/cart", {
    method: "POST",
    token: customerToken,
    body: { productId: "p1", size: "M", qty: 2 },
  });
  assert.equal(added.status, 201);
  assert.equal(added.body.items.length, 1);
  assert.equal(added.body.items[0].qty, 2);
  assert.equal(added.body.items[0].key, "p1::M");
  assert.equal(added.body.summary.subtotal, 1598);

  const key = encodeURIComponent(added.body.items[0].key);
  const updated = await request(`/cart/${key}`, {
    method: "PATCH",
    token: customerToken,
    body: { qty: 1 },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.items[0].qty, 1);
  assert.equal(updated.body.summary.subtotal, 799);

  const tooMany = await request("/cart", {
    method: "POST",
    token: customerToken,
    body: { productId: "p1", size: "M", qty: 99 },
  });
  assert.equal(tooMany.status, 400);
  assert.equal(tooMany.body.error.details.field, "qty");

  const badSize = await request("/cart", {
    method: "POST",
    token: customerToken,
    body: { productId: "p1", size: "XXL", qty: 1 },
  });
  assert.equal(badSize.status, 400);

  const reordered = await request("/cart/order", {
    method: "PUT",
    token: customerToken,
    body: { keys: [added.body.items[0].key] },
  });
  assert.equal(reordered.status, 200);
});

test("wishlist add/list/remove works for a session", async () => {
  const added = await request("/wishlist", {
    method: "POST",
    token: customerToken,
    body: { productId: "p5" },
  });
  assert.equal(added.status, 201);
  assert.ok(added.body.ids.includes("p5"));

  const listed = await request("/wishlist", { token: customerToken });
  assert.ok(listed.body.items.some((product) => product.id === "p5"));

  const removed = await request("/wishlist/p5", { method: "DELETE", token: customerToken });
  assert.ok(!removed.body.ids.includes("p5"));
});

test("checkout validates shipping data and decrements stock", async () => {
  const before = await request("/products/p1");
  const stockBefore = before.body.product.stock;

  const invalid = await request("/orders", {
    method: "POST",
    token: customerToken,
    body: { name: "A", email: "bad", phone: "1", address: "x", city: "", zip: "!" },
  });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.error.details.field);

  const created = await request("/orders", {
    method: "POST",
    token: customerToken,
    body: {
      name: "Alex Carter",
      email: "alex@example.com",
      phone: "9876543210",
      address: "21 Rose Lane, Apt 4",
      city: "Mumbai",
      zip: "400001",
    },
  });
  assert.equal(created.status, 201);
  assert.match(created.body.order.id, /^ORD-\d+$/);
  assert.equal(created.body.order.status, "pending");
  createdOrderId = created.body.order.id;

  const after = await request("/products/p1");
  assert.equal(after.body.product.stock, stockBefore - 1);

  const cart = await request("/cart", { token: customerToken });
  assert.equal(cart.body.items.length, 0);

  const mine = await request("/orders", { token: customerToken });
  assert.ok(mine.body.orders.some((order) => order.id === createdOrderId));

  const order = await request(`/orders/${createdOrderId}`, { token: customerToken });
  assert.equal(order.status, 200);
  assert.equal(order.body.order.id, createdOrderId);
});

test("admin routes enforce the role check", async () => {
  const forbidden = await request("/admin/stats", { token: customerToken });
  assert.equal(forbidden.status, 403);
  assert.match(forbidden.body.error.message, /permission/i);

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: "admin@fashionstore.test", password: "Admin@123" },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, "admin");
  adminToken = login.body.token;

  const stats = await request("/admin/stats", { token: adminToken });
  assert.equal(stats.status, 200);
  assert.ok(stats.body.totals.orders >= 8);
  assert.equal(stats.body.ordersByDay.length, 7);
  assert.ok(stats.body.revenueByCategory.length > 0);
});

test("admin can update stock, reorder products and move order status", async () => {
  const stock = await request("/admin/products/p16", {
    method: "PATCH",
    token: adminToken,
    body: { stock: 7 },
  });
  assert.equal(stock.status, 200);
  assert.equal(stock.body.product.stock, 7);

  const invalidOrder = await request("/admin/products/order", {
    method: "PUT",
    token: adminToken,
    body: { ids: ["p1"] },
  });
  assert.equal(invalidOrder.status, 400);

  const all = await request("/products");
  const ids = all.body.items.map((product) => product.id).reverse();
  const reordered = await request("/admin/products/order", {
    method: "PUT",
    token: adminToken,
    body: { ids },
  });
  assert.equal(reordered.status, 200);
  assert.deepEqual(reordered.body.order, ids);

  const status = await request(`/admin/orders/${createdOrderId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "packed" },
  });
  assert.equal(status.status, 200);
  assert.equal(status.body.order.status, "packed");

  const badStatus = await request(`/admin/orders/${createdOrderId}/status`, {
    method: "PATCH",
    token: adminToken,
    body: { status: "teleported" },
  });
  assert.equal(badStatus.status, 400);
});

test("unknown API routes return a JSON 404 and malformed JSON is rejected", async () => {
  const missing = await request("/does-not-exist");
  assert.equal(missing.status, 404);
  assert.match(missing.body.error.message, /not found/i);

  const malformed = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"email":',
  });
  assert.equal(malformed.status, 400);
  const payload = await malformed.json();
  assert.match(payload.error.message, /valid JSON/i);
});

test("SSE stream emits an initial connected event", async () => {
  const controller = new AbortController();
  let timer;

  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("SSE stream timed out")), 4000);
    });

    const response = await fetch(`${base}/api/events`, { signal: controller.signal });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/event-stream/);

    const reader = response.body.getReader();
    const { value } = await Promise.race([reader.read(), timeout]);
    const chunk = new TextDecoder().decode(value);
    assert.match(chunk, /connected|retry/i);
    await reader.cancel();
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
});
