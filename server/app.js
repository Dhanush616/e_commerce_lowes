import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { errorHandler, notFound } from "./lib/errors.js";
import { liveClientCount } from "./lib/sse.js";
import { attachUser } from "./middleware/auth.js";
import { cors } from "./middleware/cors.js";
import { requestLogger } from "./middleware/requestLogger.js";

import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import eventsRoutes from "./routes/events.js";
import ordersRoutes from "./routes/orders.js";
import productsRoutes from "./routes/products.js";
import wishlistRoutes from "./routes/wishlist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

export function createApp({ serveStatic = true } = {}) {
  const app = express();
  app.disable("x-powered-by");

  app.use(cors);
  app.use(requestLogger);
  app.use(express.json({ limit: "100kb" }));
  app.use(attachUser);

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "fashion-store-api",
      liveClients: liveClientCount(),
      uptimeSeconds: Math.round(process.uptime()),
      at: new Date().toISOString(),
    });
  });

  app.use("/api/products", productsRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/events", eventsRoutes);

  // Unknown /api path -> JSON 404 (must come before the SPA fallback).
  app.use("/api", notFound);

  if (serveStatic && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    // History API fallback: every non-API GET returns the SPA shell.
    app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
      res.sendFile(path.join(distDir, "index.html"), (error) => {
        if (error) next(error);
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export { distDir };
