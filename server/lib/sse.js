const clients = new Set();

function writeEvent(res, type, payload) {
  try {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch {
    clients.delete(res);
  }
}

/** Register an Express response as an SSE client. Returns a cleanup function. */
export function addSseClient(res) {
  clients.add(res);
  writeEvent(res, "connected", { at: new Date().toISOString() });

  const heartbeat = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      cleanup();
    }
  }, 20000);

  function cleanup() {
    clearInterval(heartbeat);
    clients.delete(res);
  }

  return cleanup;
}

/** Broadcast an event to every connected browser. */
export function broadcast(type, payload = {}) {
  for (const res of clients) {
    writeEvent(res, type, { ...payload, at: new Date().toISOString() });
  }
}

export function liveClientCount() {
  return clients.size;
}
