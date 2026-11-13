import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../services/api";
import { formatPrice } from "../utils/calculations";

const LiveUpdatesContext = createContext(null);

/**
 * Owns the EventSource connection to Express and exposes:
 *  - connected: SSE stream status
 *  - version: increments on every server event (pages can refetch)
 *  - notifications + notify(): small toast queue
 */
export function LiveUpdatesProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const seq = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    (message, tone = "info") => {
      const id = ++seq.current;
      setNotifications((current) => [...current.slice(-3), { id, message, tone }]);
      const timer = setTimeout(() => {
        setNotifications((current) => current.filter((item) => item.id !== id));
        timers.current.delete(id);
      }, 5000);
      timers.current.set(id, timer);
      return id;
    },
    []
  );

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/events`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    const onEvent = (event) => {
      let data = {};
      try {
        data = JSON.parse(event.data || "{}");
      } catch {
        data = {};
      }

      setConnected(true);
      setVersion((value) => value + 1);

      if (event.type === "stock") {
        notify(`${data.name} — stock updated to ${data.stock}`, "info");
      } else if (event.type === "order") {
        if (data.updated) {
          notify(`Order ${data.orderId} is now ${data.status}`, "info");
        } else {
          notify(`New order ${data.orderId} • ${formatPrice(data.total || 0)}`, "success");
        }
      } else if (event.type === "product") {
        notify(
          data.action === "reordered"
            ? "Merchandising order updated"
            : `${data.name || "Product"} updated`,
          "info"
        );
      }
    };

    const eventNames = ["stock", "order", "product"];
    for (const name of eventNames) source.addEventListener(name, onEvent);

    return () => {
      for (const name of eventNames) source.removeEventListener(name, onEvent);
      source.close();
    };
  }, [notify]);

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      for (const timer of activeTimers.values()) clearTimeout(timer);
      activeTimers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ connected, version, notifications, notify, dismiss }),
    [connected, version, notifications, notify, dismiss]
  );

  return <LiveUpdatesContext.Provider value={value}>{children}</LiveUpdatesContext.Provider>;
}

export function useLiveUpdates() {
  const ctx = useContext(LiveUpdatesContext);
  if (!ctx) throw new Error("useLiveUpdates must be used inside LiveUpdatesProvider");
  return ctx;
}
