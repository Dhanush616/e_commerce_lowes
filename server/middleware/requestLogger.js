/** Tiny custom access log — no external middleware package. */
export function requestLogger(req, res, next) {
  if (process.env.NODE_ENV === "test") return next();

  const startedAt = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const stamp = new Date().toISOString().slice(11, 19);
    console.log(
      `[${stamp}] ${req.method.padEnd(6)} ${res.statusCode} ${req.originalUrl} ${durationMs.toFixed(1)}ms`
    );
  });

  next();
}
