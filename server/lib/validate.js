import { ApiError } from "./errors.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;
const ZIP_RE = /^[0-9A-Za-z -]{4,10}$/;

function fail(message, field) {
  throw new ApiError(400, message, field ? { field } : null);
}

export function text(value, { field, label = field, min = 1, max = 200 } = {}) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} is required`, field);
  const clean = value.trim();
  if (clean.length < min) fail(`${label} must be at least ${min} characters`, field);
  if (clean.length > max) fail(`${label} must be at most ${max} characters`, field);
  return clean;
}

export function email(value, { field = "email" } = {}) {
  const clean = text(value, { field, label: "Email", max: 120 }).toLowerCase();
  if (!EMAIL_RE.test(clean)) fail("Enter a valid email address", field);
  return clean;
}

export function strongPassword(value, { field = "password" } = {}) {
  if (typeof value !== "string" || value.length < 6) {
    fail("Password must be at least 6 characters", field);
  }
  if (value.length > 100) fail("Password must be at most 100 characters", field);
  return value;
}

export function int(value, { field, label = field, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) fail(`${label} must be a whole number`, field);
  if (parsed < min) fail(`${label} must be at least ${min}`, field);
  if (parsed > max) fail(`${label} must be at most ${max}`, field);
  return parsed;
}

export function number(value, { field, label = field, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) fail(`${label} must be a number`, field);
  if (parsed < min) fail(`${label} must be at least ${min}`, field);
  if (parsed > max) fail(`${label} must be at most ${max}`, field);
  return parsed;
}

export function oneOf(value, allowed, { field, label = field } = {}) {
  if (!allowed.includes(value)) {
    fail(`${label} must be one of: ${allowed.join(", ")}`, field);
  }
  return value;
}

export function boolean(value, { field, label = field } = {}) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  fail(`${label} must be true or false`, field);
}

export function validateRegister(body = {}) {
  return {
    name: text(body.name, { field: "name", label: "Name", min: 2, max: 60 }),
    email: email(body.email),
    password: strongPassword(body.password),
  };
}

export function validateLogin(body = {}) {
  return {
    email: email(body.email),
    password: strongPassword(body.password),
  };
}

export function validateCustomer(body = {}) {
  return {
    name: text(body.name, { field: "name", label: "Full name", min: 2, max: 80 }),
    email: email(body.email),
    phone: text(body.phone, { field: "phone", label: "Phone", min: 7, max: 15 }),
    address: text(body.address, { field: "address", label: "Address", min: 5, max: 160 }),
    city: text(body.city, { field: "city", label: "City", min: 2, max: 60 }),
    zip: text(body.zip, { field: "zip", label: "ZIP / Pincode", min: 4, max: 10 }),
  };
}

export function assertPhone(phone) {
  if (!PHONE_RE.test(phone)) fail("Enter a valid phone number", "phone");
}

export function assertZip(zip) {
  if (!ZIP_RE.test(zip)) fail("Enter a valid ZIP / Pincode", "zip");
}

export function validateCartLine(body = {}, product) {
  const productId = text(body.productId, { field: "productId", label: "Product ID", max: 40 });
  const qty = int(body.qty ?? 1, { field: "qty", label: "Quantity", min: 1, max: 99 });

  let size = body.size;
  if (size === undefined || size === null || size === "") {
    size = product.sizes[0];
  }
  size = text(size, { field: "size", label: "Size", max: 20 });
  if (!product.sizes.includes(size)) {
    throw new ApiError(400, `Size "${size}" is not available for ${product.name}`, { field: "size" });
  }

  return { productId, size, qty };
}

export { PHONE_RE, ZIP_RE };
