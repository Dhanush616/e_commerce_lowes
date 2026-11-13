const TOKEN_KEY = "fs_token";

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — the session still works for this tab */
  }
}

function queryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/**
 * Built-in fetch wrapper. Adds JSON headers, the opaque session token,
 * and turns non-2xx responses into ApiError instances.
 */
export async function api(path, { method = "GET", body, headers = {}, signal } = {}) {
  const token = getToken();
  const requestHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the server. Is the Express API running?", 0);
  }

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message || `Request failed with status ${response.status}`,
      response.status,
      payload?.error?.details || null
    );
  }

  return payload;
}

/* ------------------------------ products ------------------------------ */
export function listProducts(params = {}) {
  return api(`/products${queryString(params)}`);
}

export function getProduct(id) {
  return api(`/products/${encodeURIComponent(id)}`);
}

export function getCategories() {
  return api("/products/categories");
}

/* -------------------------------- auth -------------------------------- */
export function requestLogin(email, password) {
  return api("/auth/login", { method: "POST", body: { email, password } });
}

export function requestRegister(name, email, password) {
  return api("/auth/register", { method: "POST", body: { name, email, password } });
}

export function requestMe() {
  return api("/auth/me");
}

export function requestLogout() {
  return api("/auth/logout", { method: "POST" });
}

/* -------------------------------- cart -------------------------------- */
export function getCart() {
  return api("/cart");
}

export function addCartItem(productId, size, qty = 1) {
  return api("/cart", { method: "POST", body: { productId, size, qty } });
}

export function updateCartItem(key, qty) {
  return api(`/cart/${encodeURIComponent(key)}`, { method: "PATCH", body: { qty } });
}

export function removeCartItem(key) {
  return api(`/cart/${encodeURIComponent(key)}`, { method: "DELETE" });
}

export function clearCartRequest() {
  return api("/cart", { method: "DELETE" });
}

export function mergeCartRequest(items) {
  return api("/cart/merge", { method: "POST", body: { items } });
}

export function reorderCartRequest(keys) {
  return api("/cart/order", { method: "PUT", body: { keys } });
}

/* ------------------------------ wishlist ------------------------------ */
export function getWishlist() {
  return api("/wishlist");
}

export function addWishlistItem(productId) {
  return api("/wishlist", { method: "POST", body: { productId } });
}

export function removeWishlistItem(productId) {
  return api(`/wishlist/${encodeURIComponent(productId)}`, { method: "DELETE" });
}

export function mergeWishlistRequest(ids) {
  return api("/wishlist/merge", { method: "POST", body: { ids } });
}

/* ------------------------------- orders ------------------------------- */
export function createOrder(customer) {
  return api("/orders", { method: "POST", body: customer });
}

export function listOrders() {
  return api("/orders");
}

export function getOrder(id) {
  return api(`/orders/${encodeURIComponent(id)}`);
}

/* -------------------------------- admin ------------------------------- */
export function getAdminStats() {
  return api("/admin/stats");
}

export function listAllOrders(status) {
  return api(`/admin/orders${queryString({ status })}`);
}

export function updateOrderStatus(id, status) {
  return api(`/admin/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export function updateAdminProduct(id, updates) {
  return api(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: updates,
  });
}

export function reorderAdminProducts(ids) {
  return api("/admin/products/order", { method: "PUT", body: { ids } });
}
