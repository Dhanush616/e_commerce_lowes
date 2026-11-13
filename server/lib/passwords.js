import crypto from "node:crypto";

const KEY_LENGTH = 64;

/** Hash a password with a random salt using Node's built-in scrypt. */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, KEY_LENGTH).toString("hex");
  return { salt, hash };
}

/** Constant-time password comparison. */
export function verifyPassword(password, salt, expectedHash) {
  const candidate = Buffer.from(
    crypto.scryptSync(String(password), salt, KEY_LENGTH).toString("hex")
  );
  const expected = Buffer.from(expectedHash);
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function randomToken() {
  return crypto.randomBytes(32).toString("hex");
}
