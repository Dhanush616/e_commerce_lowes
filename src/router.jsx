import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * A tiny state-based router built on the History API.
 * No React Router — this is the "state-based views" approach from the brief.
 */
const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => window.location.pathname || "/");

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (!to || typeof to !== "string") return;
    if (to === window.location.pathname) return;
    window.history[replace ? "replaceState" : "pushState"]({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used inside RouterProvider");
  return ctx;
}

export function Link({ to, children, onClick, ...rest }) {
  const { navigate } = useRouter();

  function handleClick(event) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export function NavLink({ to, end = false, activeClassName = "active", className = "", children, ...rest }) {
  const { path } = useRouter();
  const active = end || to === "/" ? path === to : path === to || path.startsWith(`${to}/`);
  const classes = [className, active ? activeClassName : ""].filter(Boolean).join(" ");
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  );
}
