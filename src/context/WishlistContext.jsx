import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useLiveUpdates } from "./LiveUpdatesContext";
import {
  addWishlistItem,
  getWishlist,
  mergeWishlistRequest,
  removeWishlistItem,
} from "../services/api.js";

const WishlistContext = createContext(null);
const GUEST_WISHLIST_KEY = "fs_guest_wishlist";

function readGuestIds() {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { notify } = useLiveUpdates();
  const [guestIds, setGuestIds] = useState(readGuestIds);
  const [serverIds, setServerIds] = useState([]);
  const syncedForRef = useRef(null);

  const ids = user ? serverIds : guestIds;

  useEffect(() => {
    if (user) return;
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(guestIds));
    } catch {
      /* ignore */
    }
  }, [guestIds, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      syncedForRef.current = null;
      setServerIds([]);
      return;
    }
    if (syncedForRef.current === user.id) return;
    syncedForRef.current = user.id;

    let alive = true;
    const guest = readGuestIds();
    if (guest.length) localStorage.removeItem(GUEST_WISHLIST_KEY);

    const request = guest.length ? mergeWishlistRequest(guest) : getWishlist();

    request
      .then((data) => {
        if (!alive) return;
        setServerIds(data.ids || []);
        setGuestIds([]);
      })
      .catch((error) => {
        if (!alive) return;
        syncedForRef.current = null;
        notify(error.message, "danger");
      });

    return () => {
      alive = false;
    };
  }, [user, authLoading, notify]);

  const toggleWishlist = useCallback(
    async (productId) => {
      const has = ids.includes(productId);

      if (!user) {
        setGuestIds((current) =>
          current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId]
        );
        return !has;
      }

      try {
        const data = has
          ? await removeWishlistItem(productId)
          : await addWishlistItem(productId);
        setServerIds(data.ids);
        return !has;
      } catch (error) {
        notify(error.message, "danger");
        return has;
      }
    },
    [ids, user, notify]
  );

  const addToWishlist = useCallback(
    async (productId) => {
      if (ids.includes(productId)) return;
      if (!user) {
        setGuestIds((current) => [...current, productId]);
        return;
      }
      try {
        const data = await addWishlistItem(productId);
        setServerIds(data.ids);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [ids, user, notify]
  );

  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!user) {
        setGuestIds((current) => current.filter((id) => id !== productId));
        return;
      }
      try {
        const data = await removeWishlistItem(productId);
        setServerIds(data.ids);
      } catch (error) {
        notify(error.message, "danger");
      }
    },
    [user, notify]
  );

  const isWishlisted = useCallback((productId) => ids.includes(productId), [ids]);

  const value = useMemo(
    () => ({
      wishlist: ids,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      isWishlisted,
      isServerWishlist: Boolean(user),
    }),
    [ids, toggleWishlist, addToWishlist, removeFromWishlist, isWishlisted, user]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
