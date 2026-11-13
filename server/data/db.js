import { hashPassword } from "../lib/passwords.js";
import { totalsFor } from "../lib/money.js";
import { productSeed } from "./products.js";

/* ------------------------------------------------------------------ *
 * In-memory data store. Everything is reset when the server restarts.
 * ------------------------------------------------------------------ */

export const products = productSeed.map((product) => ({ ...product }));

const credentials = (password) => {
  const { salt, hash } = hashPassword(password);
  return { salt, passwordHash: hash };
};

export const users = [
  {
    id: "usr_admin",
    name: "Store Admin",
    email: "admin@fashionstore.test",
    role: "admin",
    phone: "9876500000",
    address: "1 Market Street",
    city: "Bengaluru",
    zip: "560001",
    ...credentials("Admin@123"),
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr_alex",
    name: "Alex Carter",
    email: "alex@example.com",
    role: "customer",
    phone: "9876543210",
    address: "21 Rose Lane, Apt 4",
    city: "Mumbai",
    zip: "400001",
    ...credentials("User@123"),
    createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr_priya",
    name: "Priya Nair",
    email: "priya@example.com",
    role: "customer",
    phone: "9812345678",
    address: "8 Lake View Road",
    city: "Kochi",
    zip: "682001",
    ...credentials("User@123"),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "usr_sam",
    name: "Sam Fernandes",
    email: "sam@example.com",
    role: "customer",
    phone: "9765432109",
    address: "44 Hill Street",
    city: "Goa",
    zip: "403001",
    ...credentials("User@123"),
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const sessions = new Map(); // token -> { userId, createdAt, expiresAt }

export const carts = new Map(); // userId -> [{ key, productId, size, qty }]

export const wishlists = new Map([
  ["usr_alex", ["p2", "p12"]],
  ["usr_priya", ["p5"]],
]);

/* ------------------------------------------------------------------ *
 * Seeded orders give the admin dashboard something to chart.
 * ------------------------------------------------------------------ */

const orderSpecs = [
  {
    daysAgo: 6,
    userId: "usr_priya",
    status: "delivered",
    items: [
      ["p5", 1, "UK 7"],
      ["p7", 2, "One Size"],
    ],
  },
  {
    daysAgo: 5,
    userId: "usr_sam",
    status: "delivered",
    items: [["p2", 1, "M"]],
  },
  {
    daysAgo: 4,
    userId: "usr_alex",
    status: "shipped",
    items: [
      ["p12", 1, "One Size"],
      ["p1", 2, "L"],
    ],
  },
  {
    daysAgo: 2,
    userId: "usr_priya",
    status: "packed",
    items: [["p8", 1, "UK 8"]],
  },
  {
    daysAgo: 1,
    userId: "usr_sam",
    status: "pending",
    items: [
      ["p15", 1, "UK 9"],
      ["p14", 1, "One Size"],
    ],
  },
  {
    daysAgo: 1,
    userId: "usr_alex",
    status: "cancelled",
    items: [["p6", 1, "S"]],
  },
  {
    daysAgo: 0,
    userId: "usr_priya",
    status: "pending",
    items: [
      ["p10", 2, "M"],
      ["p16", 1, "M"],
    ],
  },
];

function buildSeedOrder(spec, index) {
  const user = users.find((candidate) => candidate.id === spec.userId);
  const items = spec.items
    .map(([productId, qty, size]) => {
      const product = products.find((candidate) => candidate.id === productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        size,
        qty,
      };
    })
    .filter(Boolean);

  return {
    id: `ORD-${1001 + index}`,
    userId: user.id,
    customer: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      city: user.city,
      zip: user.zip,
    },
    items,
    ...totalsFor(items),
    status: spec.status,
    createdAt: new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000 + index * 60000).toISOString(),
  };
}

export const orders = orderSpecs.map(buildSeedOrder);

let orderCounter = 1001 + orderSpecs.length;
let userCounter = users.length;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export function nextOrderId() {
  return `ORD-${orderCounter++}`;
}

export function nextUserId() {
  return `usr_${++userCounter}`;
}

export function publicUser(user) {
  if (!user) return null;
  const safe = { ...user };
  delete safe.passwordHash;
  delete safe.salt;
  return safe;
}

export function publicProduct(product) {
  return product ? { ...product } : null;
}

export function findProduct(id) {
  return products.find((product) => product.id === id);
}

export function cartKey(productId, size) {
  return `${productId}::${size}`;
}

/** Cart lines enriched with a product snapshot for the client. */
export function buildCart(userId) {
  const lines = carts.get(userId) || [];
  return lines
    .map((line) => {
      const product = findProduct(line.productId);
      if (!product) return null;
      return {
        key: line.key,
        productId: line.productId,
        size: line.size,
        qty: line.qty,
        product: publicProduct(product),
      };
    })
    .filter(Boolean);
}

export function cartSummary(userId) {
  const lines = buildCart(userId);
  return totalsFor(lines.map((line) => ({ price: line.product.price, qty: line.qty })));
}

export function cartCount(userId) {
  return (carts.get(userId) || []).reduce((count, line) => count + line.qty, 0);
}

export function createSessionRecord(userId) {
  return {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

/* ------------------------------------------------------------------ *
 * Merchandising order (admin drag-and-drop)
 * ------------------------------------------------------------------ */

let merchOrder = products.map((product) => product.id);

export function getMerchOrder() {
  return [...merchOrder];
}

export function setMerchOrder(ids) {
  merchOrder = [...ids];
  products.forEach((product) => {
    product.rank = merchOrder.indexOf(product.id);
  });
}

export function resetMerchOrder() {
  setMerchOrder(products.map((product) => product.id));
}
