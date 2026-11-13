# FashionStore

A full-stack fashion e-commerce demo built with **React + Vite** on the front end and
**Node.js + Express** on the back end. Data lives in memory on the Express server (seeded
with sample products, users and orders) — no database, no auth library, no router library,
no chart library.

> **Project docs:** [PLAN.md](./PLAN.md) (requirements, wireframes, data model, API table,
> demo script) · [TEST_REPORT.md](./TEST_REPORT.md) (automated results + manual checklist).

## Features

### Storefront
- Product catalogue with **server-side** search, category filter, price/rating sort and
  stock/featured filters.
- Product detail page with size selection, quantity stepper, live stock and wishlist.
- Guest bag and guest wishlist that survive a reload and **merge into the account** after
  login.
- Drag-and-drop cart reordering with native HTML5 drag events.
- Real checkout: shipping form validation, server-calculated totals, stock checks,
  order creation, stock decrement and cart clear.
- Order history with live status badges.
- Server-Sent Events (SSE) push stock changes, new orders and status updates to every open
  browser, with toast notifications and an automatic reconnect.

### Admin
- Role-protected dashboard (`requireRole("admin")`).
- KPI cards: revenue, orders, customers, low stock.
- Hand-built **SVG bar chart** (revenue by category) and **SVG line chart** (orders per day).
- Inventory editor for stock, price and featured flag.
- Drag-and-drop merchandising order for the catalogue.
- Order status management (`pending → packed → shipped → delivered / cancelled`).

> Note: status changes are visual only. Cancelling does not automatically restock items —
> that is listed as a known limitation.

## Tech stack (assignment-compliant)

| Layer | Used |
|---|---|
| Frontend | React 19 (hooks + Context), built-in `fetch`, Vite build tool |
| Routing | Hand-written History API state router (`src/router.jsx`) |
| Backend | Node.js + Express 5 (`express.json()`, `express.static()`, custom middleware) |
| Data | In-memory arrays/maps seeded in `server/data/` |
| Auth | Node `crypto` scrypt + random opaque tokens + in-memory `sessions Map` |
| Live updates | Server-Sent Events from Express + browser `EventSource` |
| Charts / DnD | Hand-built SVG/CSS + native HTML5 drag-and-drop |
| Tests | `node:test` + built-in `fetch` |

No React Router, Axios, Redux, Bootstrap, react-hook-form, JWT, bcrypt, Socket.IO,
Recharts, dnd-kit, Jest or Postman.

## Quick start

```bash
npm install
npm run dev
```

- UI → <http://localhost:5173>
- API → <http://localhost:4000/api/health>

`npm run dev` starts **both** processes with a small `node:child_process` script
(`scripts/dev.js`). Vite proxies `/api` (including the SSE stream) to Express.

### Production (one command, one port)

```bash
npm run build
npm start
```

Express serves the Vite build from `dist/` and the API from the same origin:
<http://localhost:4000>. Non-API routes fall back to `index.html`, so deep links such as
`/product/p1` and `/admin` work after a refresh.

## Deployment (Vercel front end + Render API)

The API keeps sessions, carts and the SSE client list in memory, so it needs a **persistent
Node process**. Serverless functions on Vercel would reset that state between requests and break
login, cart and live updates. The reliable split is:

| Piece | Host | Why |
|---|---|---|
| React build (`dist/`) | Vercel | Static CDN, instant loads |
| Express API | Render web service | One long-lived process → memory state and SSE work |

### 1. Deploy the API to Render

1. Push this repo to GitHub (already done).
2. Render dashboard → **New → Blueprint** → pick the repo. `render.yaml` is detected.
3. Deploy. The service runs `npm ci && npm run build`, then `npm start` on `$PORT`.
4. Note the URL, e.g. `https://ecommerce-lowes-api.onrender.com`.
5. Check `https://<your-api>.onrender.com/api/health`.

Optional: set `CLIENT_ORIGIN` (comma-separated) to your exact Vercel URL(s). Without it the API
allowlists `https://*.vercel.app` and local dev origins.

### 2. Deploy the front end to Vercel

1. Vercel dashboard → **Add New → Project** → import the same repo.
2. Framework preset: **Vite**. Build `npm run build`, output `dist`.
3. Environment variable: `VITE_API_URL = https://<your-api>.onrender.com` (no trailing slash).
4. Deploy. `vercel.json` already rewrites client-side routes to `index.html`.

Redeploy the Vercel project whenever `VITE_API_URL` changes, because Vite inlines it at build
time.

> Render's free plan spins down after ~15 minutes idle, so the first request can take ~30–50s.
> In-memory data (new users, carts, orders) resets whenever the API restarts or redeploys.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fashionstore.test` | `Admin@123` |
| Customer | `alex@example.com` | `User@123` |
| Customer | `priya@example.com` | `User@123` |

The login screen has one-click buttons that fill these credentials.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Express API (:4000) + Vite dev server (:5173) |
| `npm run dev:server` | API only, with `node --watch` |
| `npm run dev:client` | Vite only |
| `npm test` | `node --test server/tests/api.test.js` |
| `npm run build` | `vite build` → `dist/` |
| `npm start` | Express serves `dist/` + API on :4000 |
| `npm run lint` | Oxlint |

## Project structure

```text
fashion-store/
├── server/
│   ├── app.js                 createApp() (shared by server and tests)
│   ├── index.js               listen (:4000)
│   ├── config.js              tax / shipping / status / categories
│   ├── data/
│   │   ├── products.js        16 seeded products
│   │   └── db.js              users, sessions, carts, wishlists, orders, merch order
│   ├── lib/                   passwords, sessions, money, validation, errors, SSE
│   ├── middleware/            auth, role, logger
│   ├── routes/                products, auth, cart, wishlist, orders, admin, events
│   └── tests/api.test.js      14 node:test + fetch API tests
├── scripts/dev.js             one-command dev runner
├── src/
│   ├── router.jsx             History API state router (Link/NavLink)
│   ├── services/api.js        fetch wrapper + typed API helpers
│   ├── context/               Auth, Cart, Wishlist, LiveUpdates
│   ├── hooks/                 useAsync, useDebounce, useLocalStorage
│   ├── pages/                 Home, Catalogue, Product, Cart, Wishlist, Login,
│   │                          Checkout, Success, Orders, Admin
│   ├── components/            Navbar, ProductCard, CartItemRow, Charts, Toasts, …
│   ├── styles/framework.css   hand-written mini CSS framework
│   ├── index.css              monochrome editorial theme
│   └── App.css                drag-drop, chart, toast and admin styles
├── PLAN.md
├── TEST_REPORT.md
└── vite.config.js
```

## API overview

Full request/response details are in [PLAN.md § 2.3](./PLAN.md#23-api-endpoint-table).
Summary:

| Group | Endpoints |
|---|---|
| Health / live | `GET /api/health`, `GET /api/events` (SSE) |
| Products | `GET /api/products`, `GET /api/products/categories`, `GET /api/products/:id` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Cart | `GET/POST/DELETE /api/cart`, `POST /api/cart/merge`, `PUT /api/cart/order`, `PATCH/DELETE /api/cart/:key` |
| Wishlist | `GET/POST /api/wishlist`, `POST /api/wishlist/merge`, `DELETE /api/wishlist/:productId` |
| Orders | `POST/GET /api/orders`, `GET /api/orders/:id` |
| Admin | `GET /api/admin/stats`, `GET /api/admin/orders`, `GET /api/admin/users`, `PATCH /api/admin/orders/:id/status`, `PATCH /api/admin/products/:id`, `PUT /api/admin/products/order` |

Errors always use:

```json
{ "error": { "message": "Human-readable reason", "details": { "field": "email" } } }
```

## How auth works

1. `POST /api/auth/login` verifies the password with `scrypt` and `timingSafeEqual`.
2. The server creates a 32-byte random token, stores
   `token → { userId, expiresAt }` in a `Map`, and returns the token.
3. The browser stores the token under `fs_token` and sends
   `Authorization: Bearer <token>` with `fetch`.
4. `attachUser` resolves the session on every request; `requireAuth` / `requireRole`
   protect routes.
5. Logout deletes the session from the `Map`; a restart also invalidates every session.

## How live updates work

- `GET /api/events` keeps an SSE response open and registers it in a `Set`.
- The server broadcasts `stock`, `order` and `product` events after the matching mutation.
- `LiveUpdatesContext` listens with `EventSource`, shows toasts and increments a `version`
  counter; pages use that value in `useAsync` dependencies to refetch.
- A heartbeat comment every 20s keeps the connection alive; EventSource reconnects
  automatically after a drop.

## Data & persistence

Everything on the server is **in memory**. Restarting the server resets products, stock,
users, carts, wishlists and orders to the seed data.

Browser storage keys:

| Key | Purpose |
|---|---|
| `fs_token` | Opaque session token |
| `fs_guest_cart` | Guest cart before login |
| `fs_guest_wishlist` | Guest wishlist before login |

After login the guest data is merged into the server and the guest keys are removed.
Card details are never stored or sent to the API.

## Testing

```bash
npm test
```

Expected: **14 tests passing** covering products, auth/sessions, role checks, cart limits,
wishlist, checkout/stock, admin updates, JSON errors and the SSE handshake. The manual
demo checklist lives in [TEST_REPORT.md](./TEST_REPORT.md).

## Known limitations

- In-memory data means a restart resets everything; it is not multi-process safe.
- Sessions are not shared across server instances.
- Payment is simulated; no gateway is integrated and card fields are not transmitted.
- Cancelling an order does not restock items.
- Images are loaded from Unsplash URLs, so the product photos need internet access.
- Registration accepts any valid email; there is no email verification.

## License

Educational project for the full-stack assignment.
