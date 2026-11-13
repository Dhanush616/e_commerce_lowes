import { SESSION_TTL_MS } from "../config.js";
import { sessions } from "../data/db.js";
import { randomToken } from "./passwords.js";

export function createSession(userId) {
  const token = randomToken();
  const now = Date.now();
  sessions.set(token, {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export function getSession(token) {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}
