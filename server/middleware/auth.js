import { publicUser, users } from "../data/db.js";
import { getSession } from "../lib/auth.js";
import { ApiError } from "../lib/errors.js";


export function attachUser(req, _res, next) {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  req.authToken = token;

  const session = getSession(token);
  if (session) {
    const user = users.find((candidate) => candidate.id === session.userId);
    if (user) req.user = user;
  }

  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new ApiError(401, "Please log in to continue"));
  }
  next();
}

export function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) return next(new ApiError(401, "Please log in to continue"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}

export function currentUser(req) {
  return publicUser(req.user);
}
