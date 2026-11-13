import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getToken,
  requestLogin,
  requestLogout,
  requestMe,
  requestRegister,
  saveToken,
} from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // Validate a stored opaque session token with the Express API.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    let alive = true;
    setLoading(true);
    requestMe()
      .then((data) => {
        if (alive) setUser(data.user);
      })
      .catch(() => {
        if (!alive) return;
        saveToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [token]);

  const applySession = useCallback((data) => {
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await requestLogin(email, password);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await requestRegister(name, email, password);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await requestLogout();
    } catch {
      /* token may already be expired — clear locally anyway */
    }
    saveToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isLoggedIn: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
