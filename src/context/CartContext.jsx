import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLiveUpdates } from "./LiveUpdatesContext";
import {
  addCartItem,
  clearCartRequest,
  getCart,
  mergeCartRequest,
  removeCartItem,
  reorderCartRequest,
  updateCartItem,
} from "../services/api.js";
import { cartCount } from "../utils/calculations";

const CartContext = createContext(null);
const GUEST_CART_KEY = "fs_guest_cart";

function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    /* quota / private mode — in-memory state still works */
  }
}

function guestKey(productId, size) {
  return `${productId}::${size}`;
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { notify } = useLiveUpdates();
  const [guestItems, setGuestItems] = useState(readGuestCart);
  const [serverItems, setServerItems] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const syncedForRef = useRef(null);

  const items = user ? serverItems : guestItems;

  useEffect(() => {
    if (user) return;
    writeGuestCart(guestItems);
  }, [guestItems, user]);

  // Merge a guest cart into the server cart after login, then load it.
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      syncedForRef.current = null;
      setServerItems([]);
      return;
    }
    if (syncedForRef.current === user.id) return;
    syncedForRef.current = user.id;

    let alive = true;
    setSyncing(true);

    const guest = readGuestCart();
    if (guest.length) {
      // Remove synchronously so a second effect pass cannot double-merge.
      localStorage.removeItem(GUEST_CART_KEY);
      setGuestItems([]);
    }

    const request = guest.length
      ? mergeCartRequest(guest.map((line) => ({ productId: line.productId, size: line.size, qty: line.qty })))
      : getCart();

    request
      .then((data) => {
        if (alive) setServerItems(data.items || []);
      })
      .catch((error) => {
        if (!alive) return;
        syncedForRef.current = null;
        notify(error.message, "danger");
      })
      .finally(() => {
        if (alive) setSyncing(false);
      });

    return () => {
      alive = false;
    };
  }, [user, authLoading, notify]);

  const addToCart = useCallback(
    async (product, qty = 1, variant = {}) => {
      if (!product || product.stock === 0) return false;
      const size = variant.size || product.sizes?.[0] || "One Size";

      if (!user) {
        if (qty > product.stock) {
          notify(`Only ${product.stock} of ${product.name} left`, "danger");
          return false;
        }
        setGuestItems((current) => {
          const key = guestKey(product.id, size);
          const existing = current.find((line) => line.key === key);
          if (existing) {
            return current.map((line) =>
              line.key === key
                ? { ...line, qty: Math.min(line.qty + qty, product.stock), product }
                : line
            );
          }
          return [...current, { key, productId: product.id, size, qty, product }];
        });
        notify(`${product.name} added to bag`, "success");
        return true;
      }

      try {
        const data = await addCartItem(product.id, size, qty);
        setServerItems(data.items);
        notify(`${product.name} added to bag`, "success");
        return true;
      } catch (error) {
        notify(error.message, "danger");
        return false;
      }
    },
    [user, notify]
  );

  const updateQty = useCallback(
    async (key, qty) => {
      if (!user) {
        setGuestItems((current) =>
          qty <= 0
            ? current.filter((line) => line.key !== key)
            : current.map((line) =>
                line.key === key
                  ? { ...line, qty: Math.max(1, Math.min(qty, line.product?.stock || 99)) }
                  : line
              )
        );
        return;
      }

      try {
        const data = qty <= 0 ? await removeCartItem(key) : await updateCartItem(key, qty);
        setServerItems(data.items);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [user, notify]
  );

  const removeItem = useCallback(
    async (key) => {
      if (!user) {
        setGuestItems((current) => current.filter((line) => line.key !== key));
        return;
      }
      try {
        const data = await removeCartItem(key);
        setServerItems(data.items);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [user, notify]
  );

  const clearCart = useCallback(async () => {
    if (!user) {
      setGuestItems([]);
      return;
    }
    try {
      const data = await clearCartRequest();
      setServerItems(data.items);
    } catch (error) {
      notify(error.message, "danger");
    }
  }, [user, notify]);

  const reorderItems = useCallback(
    async (keys) => {
      if (!user) {
        setGuestItems((current) => {
          const byKey = new Map(current.map((line) => [line.key, line]));
          return keys.map((key) => byKey.get(key)).filter(Boolean);
        });
        return;
      }
      try {
        const data = await reorderCartRequest(keys);
        setServerItems(data.items);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [user, notify]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCart();
      setServerItems(data.items || []);
    } catch (error) {
      notify(error.message, "danger");
    }
  }, [user, notify]);

  const value = useMemo(
    () => ({
      items,
      count: cartCount(items),
      syncing: authLoading || syncing,
      isServerCart: Boolean(user),
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      reorderItems,
      refresh,
    }),
    [
      items,
      authLoading,
      syncing,
      user,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      reorderItems,
      refresh,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
