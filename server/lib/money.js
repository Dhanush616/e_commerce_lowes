import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT, TAX_RATE } from "../config.js";

export function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** items: [{ price, qty }] */
export function totalsFor(items) {
  const subtotal = round2(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const tax = round2(subtotal * TAX_RATE);
  const shipping = subtotal === 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  const total = round2(subtotal + tax + shipping);
  return { subtotal, tax, shipping, total };
}
