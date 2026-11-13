# FashionStore — Project Plan & Requirements

A full-stack fashion store built with **React + Vite**, **Node.js + Express**, and **in-memory
data**. No database, no auth library, no router library, no chart library.

---

## 1. Plan

### 1.1 Goal

Turn the original front-end-only FashionStore demo into a complete full-stack assignment
project that demonstrates:

1. A real REST API with hand-written validation and error handling.
2. Real sessions using Node's built-in `crypto` (no JWT / bcrypt).
3. Server-owned data: products, users, carts, wishlists and orders.
4. Live updates through Server-Sent Events (no Socket.IO).
5. Hand-built SVG charts and native HTML5 drag-and-drop.
6. API tests written with `node:test` + `fetch`.
7. One-command development and a production build served by Express.

### 1.2 Personas

| Persona | Needs |
|---|---|
| **Shopper (guest)** | Browse products, search/filter, save a bag and wishlist without signing up. |
| **Customer** | Sign in, keep a server-side bag/wishlist, checkout, track order status. |
| **Admin** | See revenue/order charts, manage stock, reorder merchandise, update order status. |
| **Marker / reviewer** | Run one command, see a working full-stack flow, read the API/test evidence. |

### 1.3 User stories

#### Shopper / customer

- As a shopper I can browse all products so I can decide what to buy.
- As a shopper I can search by name/colour/category and sort by price/rating so I can find things fast.
- As a shopper I can open a product detail page, pick a size and quantity.
- As a shopper I can save products to a wishlist.
- As a guest I can add items to a bag; it survives a page reload.
- As a customer I can register/login with a real password check.
- As a customer my guest bag and wishlist are merged into my account after login.
- As a customer I can change quantities, remove lines and drag lines to reorder my bag.
- As a customer I can checkout with shipping details; the server validates the data,
  recalculates totals, reduces stock and clears the bag.
- As a customer I can see my order history and current status.
- As a customer I see stock and order-status changes without refreshing.

#### Admin

- As an admin I can sign in and see a dashboard with revenue, order count, customers and stock.
- As an admin I can see revenue by category and orders per day in hand-built SVG charts.
- As an admin I can edit a product's stock, price and featured flag.
- As an admin I can drag products to change the catalogue order.
- As an admin I can move an order through `pending → packed → shipped → delivered` (or cancel).
- As an admin every stock/order change is pushed to open browsers via SSE.
- As an admin I cannot be impersonated by a customer — the API returns `403`.

### 1.4 Feature list

| Area | Features |
|---|---|
| Catalogue | Server-side search, category filter, price/rating sort, featured filter, stock filter |
| Product | Detail page, size selection, quantity stepper, live stock, wishlist |
| Auth | Register, login, logout, session restore, role badge, demo accounts |
| Cart | Guest bag + server cart, merge on login, qty update, remove, clear, drag reorder |
| Wishlist | Guest + server wishlist, move to cart, live product data |
| Checkout | Hand-validated shipping/payment form, server-side totals and stock checks |
| Orders | Confirmation page, order history, live status |
| Admin | KPIs, 2 SVG charts, low-stock list, best sellers, inventory editor, drag ordering, order status |
| Live | SSE stream, connection indicator, toast notifications, automatic reconnect |
| Security | scrypt hashing, opaque in-memory sessions, role middleware, JSON error envelope |

### 1.5 Wireframes

#### Home

```text
┌──────────────────────────────────────────────────────────────┐
│ FashionStore        Home  Shop  Wishlist  Orders   Hi Alex  Cart│
├──────────────────────────────────────────────────────────────┤
│  LOOKOUT SHOW          ┌─────────┐   ┌────────────┐          │
│  Fashion &             │  model  │   │ promo card │          │
│  Accessories           │  image  │   ├────────────┤          │
│  [Shop Now] [Wishlist] └─────────┘   │ promo card │          │
│  16+   4.8★   ₹999+                                               │
├──────────────────────────────────────────────────────────────┤
│  Explore Collection       [Women] [Men] [Footwear] [Bags]     │
├──────────────────────────────────────────────────────────────┤
│  Featured Products        [card] [card] [card] [card]         │
└──────────────────────────────────────────────────────────────┘
```

#### Catalogue

```text
┌───────────────┬──────────────────────────────────────────────┐
│ Category      │ [ search… ]                    [ sort ▾ ]    │
│ ○ All         │ Showing 8 products in Women                  │
│ ○ Men         │ ┌────────┐ ┌────────┐ ┌────────┐             │
│ ● Women       │ │ card   │ │ card   │ │ card   │             │
│ ○ Kids        │ └────────┘ └────────┘ └────────┘             │
│ Sort by …     │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

#### Product detail

```text
┌──────────────────────┬───────────────────────────────────────┐
│                      │ ← Back to catalogue                    │
│      product image   │ Women  [In stock (12)] [Featured]      │
│                      │ Floral Summer Dress                    │
│                      │ ★★★★★ (4.8)     ₹1,999                 │
│                      │ Size: [XS] [S] [M] [L]                 │
│                      │ Qty: [-] 1 [+]                         │
│                      │ [Add to Cart — ₹1,999] [♡ Wishlist]    │
└──────────────────────┴───────────────────────────────────────┘
```

#### Cart

```text
┌────────────────────────────────────────────┬─────────────────┐
│ Your Bag  Shopping cart (3)                │ SUMMARY         │
│ ⠿ [img] Dress   Size M   [- 1 +]   ₹1,999  │ Subtotal ₹…     │
│ ⠿ [img] Bag     One Size [- 2 +]   ₹998    │ Tax 8% ₹…       │
│ ⠿ [img] Tee     Size L   [- 1 +]   ₹799    │ Shipping FREE   │
│ [Clear cart]                               │ Total ₹…        │
│                                            │ [Checkout]      │
└────────────────────────────────────────────┴─────────────────┘
```

#### Checkout / login

```text
┌──────────────────────────────┬────────────────────┐
│ Customer & Shipping          │ Order summary      │
│ Name  [__________]           │ Dress × 1   ₹1,999 │
│ Email [__________]           │ Bag × 2       ₹998 │
│ Phone [__________]           │ …                  │
│ Address [________________]   │ Total      ₹3,226  │
│ City [_______] ZIP [______]  │                    │
│ Payment (demo, not sent)     │                    │
│ [Place Order — ₹3,226]       │                    │
└──────────────────────────────┴────────────────────┘
```

#### Admin dashboard

```text
┌──────────────────────────────────────────────────────────────┐
│ Admin  Store dashboard                  ● Live updates       │
│ [Revenue] [Orders] [Customers] [Low stock]                   │
├──────────────────────────────┬───────────────────────────────┤
│ Revenue by category (SVG)    │ Orders per day (SVG)          │
│  ███  █████  ██  ███         │      ╱╲                       │
├──────────────────────────────┼───────────────────────────────┤
│ Merchandising order          │ Low stock + best sellers      │
│ ⠿ 1 [img] Sneakers           │ Sneakers  8 left              │
│ ⠿ 2 [img] Dress              │ …                             │
├──────────────────────────────┴───────────────────────────────┤
│ Inventory table  [stock] [price] [featured] [Save]           │
├──────────────────────────────────────────────────────────────┤
│ Orders table     status [pending ▾]                          │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Design

### 2.1 Architecture

```text
┌──────────────────────────── Browser ────────────────────────────┐
│ React 19 + Vite                                                  │
│  RouterProvider (History API, state-based views)                 │
│  AuthContext ──┐                                                 │
│  LiveUpdates ──┼── EventSource /api/events ──┐                   │
│  CartContext ──┤                             │                   │
│  Wishlist ─────┘                             │                   │
│  pages ── fetch wrapper (src/services/api.js)│                   │
└──────────────────────────────┬───────────────┼───────────────────┘
                               │ JSON /api     │ SSE
┌──────────────────────────────▼───────────────▼───────────────────┐
│ Express 5 (server/)                                              │
│  requestLogger → express.json → attachUser                        │
│  /api/products   /api/auth     /api/cart      /api/wishlist       │
│  /api/orders     /api/admin    /api/events    /api/health         │
│  requireAuth / requireRole middleware                             │
│  notFound → errorHandler (JSON envelope)                          │
│  express.static(dist) + SPA history fallback                      │
├──────────────────────────────────────────────────────────────────┤
│ In-memory data (server/data/db.js)                               │
│  products[] users[] sessions Map carts Map wishlists Map orders[] │
│  merchOrder[]            sse clients Set                         │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data model

#### Product

```js
{
  id: "p1",
  name: "Classic White T-Shirt",
  price: 799,
  rating: 4.5,
  category: "Men",
  stock: 25,
  image: "https://…",
  description: "…",
  sizes: ["S", "M", "L", "XL"],
  colours: ["White", "Black", "Navy"],
  featured: true,
  rank: 0,               // admin drag order
  createdAt: "2026-…"
}
```

#### User / Session

```js
User    { id, name, email, role: "customer"|"admin", phone, address, city, zip,
          salt, passwordHash, createdAt }
Session Map<token, { userId, createdAt, expiresAt }>   // 24h TTL, opaque token
```

`passwordHash = scrypt(password, randomSalt, 64)`. `verifyPassword` uses
`crypto.timingSafeEqual`.

#### Cart

```js
Cart Map<userId, CartLine[]>
CartLine { key: "p1::M", productId, size, qty }
```

The API enriches each line with a product snapshot and returns a money summary.

#### Wishlist

```js
Wishlist Map<userId, productId[]>
```

#### Order

```js
{
  id: "ORD-1008",
  userId: "usr_alex",
  customer: { name, email, phone, address, city, zip },
  items: [{ productId, name, category, price, size, qty }],
  subtotal, tax, shipping, total,
  status: "pending"|"packed"|"shipped"|"delivered"|"cancelled",
  createdAt
}
```

#### Money rules (server is authoritative)

```text
subtotal = Σ price × qty
tax      = subtotal × 0.08
shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 49
total    = subtotal + tax + shipping
```

### 2.3 API endpoint table

Legend: **Public** = no token, **Auth** = bearer token, **Admin** = admin role.

| # | Method | Path | Access | Purpose | Validation / notes |
|---|---|---|---|---|---|
| 1 | GET | `/api/health` | Public | Service + SSE client count | — |
| 2 | GET | `/api/products` | Public | Search/filter/sort catalogue | `search`, `category`, `sort`, `ids`, `minPrice`, `maxPrice`, `featured`, `inStock`, `limit` |
| 3 | GET | `/api/products/categories` | Public | Category list | — |
| 4 | GET | `/api/products/:id` | Public | Product detail | `404` if unknown |
| 5 | GET | `/api/events` | Public | SSE stream | Heartbeat every 20s, auto-reconnect |
| 6 | POST | `/api/auth/register` | Public | Create customer + session | name 2–60, email regex, password 6+, duplicate `409` |
| 7 | POST | `/api/auth/login` | Public | Verify scrypt hash + create session | bad credentials `401` |
| 8 | POST | `/api/auth/logout` | Auth | Delete session | — |
| 9 | GET | `/api/auth/me` | Auth | Restore session | cart/wishlist counts |
| 10 | GET | `/api/cart` | Auth | Cart + summary | — |
| 11 | POST | `/api/cart` | Auth | Add/increase line | product exists, size allowed, qty 1–99, stock check |
| 12 | POST | `/api/cart/merge` | Auth | Merge guest bag after login | invalid guest lines skipped |
| 13 | PUT | `/api/cart/order` | Auth | Persist drag order | every key exactly once |
| 14 | PATCH | `/api/cart/:key` | Auth | Change qty (`0` removes) | integer, stock check |
| 15 | DELETE | `/api/cart/:key` | Auth | Remove line | — |
| 16 | DELETE | `/api/cart` | Auth | Clear cart | — |
| 17 | GET | `/api/wishlist` | Auth | Wishlist ids + products | — |
| 18 | POST | `/api/wishlist` | Auth | Add product | `404` unknown product |
| 19 | POST | `/api/wishlist/merge` | Auth | Merge guest wishlist | dedupes |
| 20 | DELETE | `/api/wishlist/:productId` | Auth | Remove product | — |
| 21 | POST | `/api/orders` | Auth | Checkout | shipping fields, phone/zip regex, cart non-empty, stock `409` |
| 22 | GET | `/api/orders` | Auth | Own order history | newest first |
| 23 | GET | `/api/orders/:id` | Auth | Own order / any for admin | `403` for other users |
| 24 | GET | `/api/admin/stats` | Admin | KPIs, charts, low stock, top products, 7-day series | role middleware |
| 25 | GET | `/api/admin/orders` | Admin | All orders | optional `status` |
| 26 | PATCH | `/api/admin/orders/:id/status` | Admin | Status update | enum check, SSE broadcast |
| 27 | GET | `/api/admin/users` | Admin | Sanitised users | no hashes |
| 28 | PATCH | `/api/admin/products/:id` | Admin | Stock/price/featured | integer/number/boolean checks, SSE |
| 29 | PUT | `/api/admin/products/order` | Admin | Drag merchandising order | all product ids exactly once, SSE |

### 2.4 Error envelope

```json
{
  "error": {
    "message": "Only 8 of Leather Sneakers left in stock",
    "details": { "field": "qty", "available": 8 }
  }
}
```

Status codes used: `200/201`, `400` validation, `401` missing session, `403` role,
`404` unknown, `409` conflict (duplicate email / stock race), `413` body too large,
`500` unexpected.

### 2.5 Live event contract

| Event | Payload |
|---|---|
| `connected` | `{ at }` |
| `stock` | `{ productId, name, stock, price, featured, at }` |
| `order` | `{ orderId, total, status, customerName, itemCount, at }` or `{ updated: true, … }` |
| `product` | `{ action: "reordered", order: [...ids], at }` |

---

## 3. Backend implementation

```text
server/
├── index.js                 listen on PORT (default 4000)
├── app.js                   createApp() for tests + production
├── config.js                tax/shipping/status/category constants
├── data/
│   ├── products.js          16 seeded products + ranks
│   └── db.js                products, users, sessions, carts, wishlists, orders
├── lib/
│   ├── passwords.js         scrypt hash + timingSafeEqual
│   ├── auth.js              session create/destroy
│   ├── money.js             server-side totals
│   ├── validate.js          hand-written field validators
│   ├── errors.js            ApiError, 404, central error handler
│   └── sse.js               client registry + broadcast + heartbeat
├── middleware/
│   ├── auth.js              attachUser, requireAuth, requireRole
│   └── requestLogger.js     custom access log
├── routes/
│   ├── products.js  auth.js  cart.js  wishlist.js
│   ├── orders.js    admin.js events.js
└── tests/api.test.js        node:test + fetch
```

Key rules:

- Every mutating route validates **before** mutating.
- Stock and money are recalculated on the server; the client cannot set totals.
- Card fields are validated in the browser but **never sent or stored**.
- Unknown `/api/*` routes return JSON `404` before the SPA fallback.
- `npm run build` produces `dist/`; `npm start` serves it from Express with a history fallback.

### Manual API check (curl)

```bash
curl http://localhost:4000/api/health
curl "http://localhost:4000/api/products?category=Women&sort=price-low"

TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"User@123"}' | node -pe "JSON.parse(require('fs').readFileSync(0)).token")

curl -X POST http://localhost:4000/api/cart \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"productId":"p1","size":"M","qty":2}'
```

---

## 4. Frontend implementation

### 4.1 Views without React Router

`src/router.jsx` is a ~60-line state router:

- `RouterProvider` stores `window.location.pathname` in state.
- `navigate(to)` calls `history.pushState` and updates state.
- `Link` / `NavLink` intercept left-clicks.
- `popstate` handles browser back/forward.
- `App.jsx` maps the path to a page (including `/product/:id` and `/success/:orderId`).

### 4.2 Contexts

| Context | Responsibility |
|---|---|
| `AuthContext` | Token in `localStorage`, session restore via `/auth/me`, login/register/logout |
| `CartContext` | Guest bag in `localStorage`; after login merge + server cart; drag reorder |
| `WishlistContext` | Guest ids; after login merge + server wishlist |
| `LiveUpdatesContext` | `EventSource`, connection state, version counter, toast queue |

### 4.3 Pages / components

```text
pages/        HomeView, CatalogueView, ProductDetailView, CartView, WishlistView,
              LoginView, CheckoutView, SuccessView, OrdersView, AdminView
components/   Navbar, Footer, ProductCard, CartItemRow, FilterSidebar, SortSelect,
              Input, Button, Charts (BarChart, LineChart), States, Toasts
```

### 4.4 CSS

`src/styles/framework.css` is a hand-written mini framework that replaces Bootstrap for the
classes used by this project (grid, flex, spacing, buttons, cards, forms, alerts, badges,
navbar, tables, spinner). `src/index.css` keeps the monochrome editorial theme; `src/App.css` adds
drag-drop, charts, toasts and admin styling.

---

## 5. Integration

- `src/services/api.js` is the only network layer: built-in `fetch`, JSON headers, bearer
  token, `ApiError` with `status` + `details`.
- `useAsync(loader, deps)` provides `{ data, loading, error, reload }`.
- Pages render explicit loading, empty and error states; errors can be retried.
- Guest data is merged after login so a shopper does not lose their bag.
- Server mutations return the new cart/wishlist/order, which is stored directly in context.
- SSE increments a `version`; catalogue, product, wishlist, orders and admin refetch on
  relevant events.

---

## 6. Harden

| Layer | Measure |
|---|---|
| Passwords | `crypto.scryptSync` + per-user random salt + `timingSafeEqual` |
| Sessions | 32-byte random opaque token in an in-memory `Map`, 24h TTL |
| Authorisation | `attachUser`, `requireAuth`, `requireRole("admin")` |
| Input | Hand-written validators for names, emails, passwords, phone, ZIP, qty, price, stock, enums, booleans |
| Body size | `express.json({ limit: "100kb" })`, malformed JSON → `400` |
| Data leaks | `publicUser` strips salt/hash; admin users use sanitised shape |
| Money/stock | Server recalculates; checkout re-checks stock and returns `409` |
| Payments | Card fields stay in React state and are never sent |
| Errors | Central handler hides 500 internals; JSON envelope for all `/api` errors |
| Static | API 404 is separated from the SPA fallback |

---

## 7. Test

### Automated

`npm test` → `node --test server/tests/api.test.js` (14 tests, all passing):

- health, catalogue search/filter/sort, product 404
- registration validation + duplicate email + scrypt login
- bearer-token session required
- cart add/update/stock limit/size validation/reorder
- wishlist add/list/remove
- checkout validation, stock decrement, cart clear, order history
- customer `403` vs admin `200` on dashboard
- admin stock/price update, merch reorder, order status enum
- JSON 404 + malformed JSON 400
- SSE stream headers + initial `connected` event

### Manual checklist

See [`TEST_REPORT.md`](./TEST_REPORT.md) for the step-by-step checklist used for the demo.

---

## 8. Build & present

### Commands

```bash
npm install
npm run dev        # API :4000 + Vite :5173 in one command
npm test           # node:test API suite
npm run build      # vite build → dist/
npm start          # Express serves dist + API on :4000
```

### Demo script (7 minutes)

1. **Home** — products load from `/api/products`; open DevTools Network to prove it.
2. **Guest flow** — add two products, reload; the bag persists in `localStorage`.
3. **Login** — use `alex@example.com / User@123`; the guest bag merges into the server
   cart; seeded wishlist appears.
4. **Catalogue** — search “denim”, filter Women, sort price low → high.
5. **Product detail** — select size/qty, add to cart.
6. **Cart** — drag rows, change quantity, show stock limit message if you exceed it.
7. **Checkout** — submit an invalid phone (400-style inline error), then a valid order;
   success page shows the order id and new stock.
8. **Admin** — in an incognito window log in as `admin@fashionstore.test / Admin@123`.
   Show KPI cards, SVG charts, inventory editor, drag merchandising order.
9. **Live demo** — set a product stock to 2; the customer product page updates via SSE.
   Change the new order to `shipped`; the customer Orders page updates live.
10. **Role check** — try `/admin` as the customer; UI shows 403 and `curl` proves the API
    returns 403 too.
11. **Tests & build** — run `npm test`, then `npm run build && npm start`, open
    `http://localhost:4000` to show the one-server production build.

### Presentation talking points

- Why state-based views instead of React Router.
- Why opaque sessions beat a JWT for this assignment (revocable, in-memory).
- Why the server owns totals and stock.
- How SSE differs from polling and why EventSource auto-reconnects.
- How the SVG charts and native drag-and-drop are implemented without libraries.
- What would change with a real database (swap `db.js` for a repository layer).

---

## 9. Allowed-stack compliance

| Layer | Required | Used | Prohibited used? |
|---|---|---|---|
| Frontend | React hooks + Context + `fetch`, Vite build | React 19, custom router, Context, `fetch` | No React Router, Axios, Redux, Bootstrap JS, react-hook-form |
| Backend | Node.js + Express, `express.json`, `express.static`, custom middleware | Express 5, JSON parser, static dist, logger/security/rate/auth/error middleware | No extra middleware packages |
| Data | In-memory arrays/objects seeded on server | `server/data/db.js` + `products.js` | No database |
| Login | Node crypto + in-memory sessions | `scryptSync`, `randomBytes`, `timingSafeEqual`, `sessions Map` | No JWT, no bcrypt |
| Live | Polling or SSE | SSE `/api/events` + EventSource | No Socket.IO |
| Charts / DnD | Hand-built SVG/CSS + native HTML5 DnD | `Charts.jsx`, cart drag, admin merch drag | No Recharts, no dnd-kit |
| Testing | `node:test` + `fetch` | `server/tests/api.test.js` | No Jest, no Postman |

### Dependency diff from the original project

**Removed:** `react-router-dom`, `bootstrap`, `react-hook-form`
**Added:** `express`

`package.json` now contains only `express`, `react`, `react-dom` plus Vite/React dev
tooling.

---

## 10. Phase checklist

| Phase | Status | Evidence |
|---|---|---|
| 1. Plan | ✅ | This document: user stories + wireframes |
| 2. Design | ✅ | Data model + API table above |
| 3. Backend | ✅ | `server/` routes, in-memory db, curl smoke test |
| 4. Frontend | ✅ | Pages/components with loading/error states |
| 5. Integrate | ✅ | `src/services/api.js`, contexts, guest merge |
| 6. Harden | ✅ | Validation, role middleware, error handler |
| 7. Test | ✅ | `npm test` (14 passing) + `TEST_REPORT.md` |
| 8. Build & present | ✅ | `npm run build`, `npm start`, README + demo script |
