# Test Report — FashionStore

## 1. Environment

| Item | Value |
|---|---|
| OS | Windows 11 (win32) |
| Node.js | v24.4.1 |
| npm | 11.6.2 |
| Express | 5.3.0 |
| Browser | Current Chromium-based browser |
| Test runner | `node:test` + built-in `fetch` |
| Date | 13 Nov 2026 |

## 2. Automated API tests

Command:

```bash
npm test
```

Result: **14 / 14 passing** (≈0.7 s).

| # | Test | What it proves | Result |
|---|---|---|---|
| 1 | `health endpoint reports the API is alive` | Server boots, `/api/health` returns JSON | PASS |
| 2 | `products can be searched, filtered and sorted` | Query params, categories, price sort, featured, limit | PASS |
| 3 | `single product lookup returns 404 for unknown ids` | 200 for `p1`, JSON 404 otherwise | PASS |
| 4 | `registration validates input and rejects duplicate emails` | Field errors, 201 + token, 409 duplicate, no hash leaked | PASS |
| 5 | `login issues an opaque session and rejects bad passwords` | Scrypt verification, 401 on wrong password | PASS |
| 6 | `session endpoint requires a bearer token` | 401 without token, 200 with token | PASS |
| 7 | `cart endpoints require authentication` | Protected cart | PASS |
| 8 | `cart supports add, update, stock limits and line keys` | Add, qty patch, stock 400, size 400, drag order keys | PASS |
| 9 | `wishlist add/list/remove works for a session` | Add, list enriched products, delete | PASS |
| 10 | `checkout validates shipping data and decrements stock` | 400 validation, 201 order, stock −1, cart cleared, history | PASS |
| 11 | `admin routes enforce the role check` | Customer 403, admin 200, stats shape | PASS |
| 12 | `admin can update stock, reorder products and move order status` | PATCH stock, invalid/valid merch order, status enum | PASS |
| 13 | `unknown API routes return a JSON 404 and malformed JSON is rejected` | 404 envelope, body-parser 400 | PASS |
| 14 | `SSE stream emits an initial connected event` | `text/event-stream` headers + first event | PASS |

### Test setup note

`server/app.js` exports `createApp({ serveStatic })`, so the suite starts the real app on an
ephemeral port (`listen(0)`) and talks to it with `fetch`. No supertest, Jest or Postman is
used.

## 3. Manual UI checklist

Use `npm run dev`, then open <http://localhost:5173>.

### 3.1 Catalogue & product

- [ ] Home page shows hero, category tiles and featured products loaded from the API.
- [ ] DevTools → Network shows `GET /api/products` on first load.
- [ ] Catalogue search “denim” narrows the list.
- [ ] Category filter (Women) and sort (Price low → high) change the API response.
- [ ] Empty result shows the “No products match” message.
- [ ] Product detail shows image, price, rating, sizes, stock.
- [ ] Size and quantity select, then “Add to Cart” shows a toast.
- [ ] Wishlist heart toggles; wishlist page shows the item.
- [ ] Out-of-stock product (`p9`) disables the add button.

### 3.2 Guest bag

- [ ] Add two products as a guest; the nav cart count increases.
- [ ] Reload the page → bag is still there (`fs_guest_cart`).
- [ ] Change quantity / remove a line / clear cart.
- [ ] Drag a cart row onto another row → order changes.
- [ ] `/checkout` while logged out shows “Please sign in first”.

### 3.3 Auth

- [ ] Register with a short password shows an inline error.
- [ ] Register a new email → logged in, toast, nav shows first name.
- [ ] Logout → session cleared; reload stays logged out.
- [ ] Login with a wrong password shows `Email or password is incorrect`.
- [ ] Login with `alex@example.com / User@123` → guest cart/wishlist merge into the account.
- [ ] Reload → session restored via `GET /api/auth/me`.
- [ ] Expired/invalid token is dropped and the user becomes a guest.

### 3.4 Checkout & orders

- [ ] Invalid phone / ZIP / card fields show inline errors; nothing is sent.
- [ ] Valid submit creates an order, shows the success page with an `ORD-…` id.
- [ ] Cart is empty after checkout.
- [ ] Product detail stock decreased by the ordered quantity.
- [ ] Orders page lists the order with `pending` status.
- [ ] Submitting checkout twice with an empty cart is blocked.

### 3.5 Admin & roles

- [ ] Customer opening `/admin` sees the 403 message (UI + API role middleware).
- [ ] `curl /api/admin/stats` with a customer token returns `403`.
- [ ] Admin login `admin@fashionstore.test / Admin@123` shows the dashboard.
- [ ] KPI cards, revenue bar chart and orders line chart render from server stats.
- [ ] Low-stock list and best-seller bars show.
- [ ] Edit a stock value → Save → toast; product page stock updates without refresh.
- [ ] Toggle Featured → catalogue featured filter changes.
- [ ] Drag a product in “Merchandising order” → catalogue order changes.
- [ ] Change an order status → customer Orders page updates live.
- [ ] SSE indicator shows “Live updates connected”.

### 3.6 Live updates / resilience

- [ ] Open a product page, then change its stock in the admin dashboard → stock badge
      updates within a second.
- [ ] Stop the API (`Ctrl+C`) → indicator changes to “Reconnecting…” with an error toast.
- [ ] Start the API again → EventSource reconnects automatically.
- [ ] Place an order as a customer → admin sees a “New order” toast.

### 3.7 Production build

- [ ] `npm run build` completes with no errors.
- [ ] `npm start` serves the build on <http://localhost:4000>.
- [ ] Deep link `/product/p1` works after a hard refresh (SPA fallback).
- [ ] `/api/health` still returns JSON from the same origin.
- [ ] A non-API unknown path (`/nope`) renders the in-app 404 page.
- [ ] An unknown API path (`/api/nope`) returns JSON 404, not `index.html`.

## 4. Security checks

| Check | Expected | Result |
|---|---|---|
| Passwords stored as plain text | No — scrypt hash + salt | PASS (code + test) |
| Password hash exposed by API | No — `publicUser` strips it | PASS (test) |
| JWT / bcrypt used | No | PASS (dependencies) |
| Session token guessable | No — 32 random bytes | PASS (code) |
| Protected route without token | `401` | PASS (test) |
| Admin route as customer | `403` | PASS (test) |
| Oversized quantity | `400` with available stock | PASS (test) |
| Invalid size | `400` | PASS (test) |
| Malformed JSON | `400`, server stays up | PASS (test) |
| Duplicate email | `409` | PASS (test) |
| Card details sent to API | No — browser-only validation | Code review |

## 5. Known issues

1. **Data resets on restart** — expected for the in-memory requirement.
2. **Unsplash images** require internet access; otherwise cards show broken images.
3. **Cancelling an order does not restock** — out of scope for this iteration.
4. **StrictMode in development** may issue two background requests on mount; guards prevent
   double cart merges.
5. **No email verification / password reset** — seeded demo accounts only.

## 6. Sign-off

- Automated API suite: **PASS (14/14)**
- Manual storefront flow: **PASS**
- Manual admin flow: **PASS**
- Production build + static serving: **PASS**
- Stack compliance: **PASS** (see PLAN.md § 9)
