/**
 * Minimal hand-written CORS layer for split hosting (Vercel front end +
 * persistent Express API). No external middleware package.
 *
 * Allowed origins:
 *  - CLIENT_ORIGIN env var (comma-separated, e.g. "https://foo.vercel.app")
 *  - local Vite dev/preview servers
 *  - any https://*.vercel.app deployment (production or preview)
 */
const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function configuredOrigins() {
  return (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((value) => value.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function isVercelOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function cors(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();

  const allowed =
    configuredOrigins().includes(origin) || LOCAL_ORIGINS.has(origin) || isVercelOrigin(origin);

  if (!allowed) return next();

  res.set({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });

  if (req.method === "OPTIONS") return res.status(204).end();
  return next();
}
