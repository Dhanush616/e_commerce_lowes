import { Router } from "express";
import { addSseClient, liveClientCount } from "../lib/sse.js";

const router = Router();

/** Server-Sent Events stream. EventSource reconnects automatically. */
router.get("/", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  res.write(`retry: 3000\n`);
  res.write(`: live clients: ${liveClientCount()}\n\n`);

  const cleanup = addSseClient(res);
  req.on("close", cleanup);
  req.on("error", cleanup);
});

export default router;
