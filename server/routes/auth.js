import { Router } from "express";
import { cartCount, nextUserId, publicUser, users, wishlists } from "../data/db.js";
import { createSession, destroySession } from "../lib/auth.js";
import { ApiError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { validateLogin, validateRegister } from "../lib/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", (req, res) => {
  const { name, email, password } = validateRegister(req.body);

  if (users.some((user) => user.email === email)) {
    throw new ApiError(409, "An account with this email already exists", { field: "email" });
  }

  const user = {
    id: nextUserId(),
    name,
    email,
    role: "customer",
    phone: "",
    address: "",
    city: "",
    zip: "",
    ...hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  const token = createSession(user.id);

  res.status(201).json({ token, user: publicUser(user) });
});

router.post("/login", (req, res) => {
  const { email, password } = validateLogin(req.body);
  const user = users.find((candidate) => candidate.email === email);

  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  const token = createSession(user.id);
  res.json({ token, user: publicUser(user) });
});

router.post("/logout", requireAuth, (req, res) => {
  destroySession(req.authToken);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: publicUser(req.user),
    cartCount: cartCount(req.user.id),
    wishlistCount: (wishlists.get(req.user.id) || []).length,
  });
});

export default router;
