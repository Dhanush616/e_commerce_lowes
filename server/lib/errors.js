export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function notFound(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = Number(err.status) || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Body parser errors (malformed JSON, payload too large)
  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Request body must be valid JSON";
  }
  if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  }
  if (status >= 500) {
    console.error("[error]", err);
    message = "Internal server error";
    details = null;
  }

  res.status(status).json({ error: { message, details } });
}
