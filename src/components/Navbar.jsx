import { useEffect, useState } from "react";
import { Link, NavLink, useRouter } from "../router.jsx";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

function Icon({ name }) {
  const common = {
    viewBox: "0 0 16 16",
    "aria-hidden": "true",
    focusable: "false",
  };

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="7" cy="7" r="4.6" />
        <path d="M10.4 10.4 14 14" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg {...common}>
        <circle cx="8" cy="5.4" r="2.8" />
        <path d="M2.6 14.4c0-2.6 2.4-4.1 5.4-4.1s5.4 1.5 5.4 4.1" />
      </svg>
    );
  }
  if (name === "heart") {
    return (
      <svg {...common}>
        <path d="M8 13.9S2.1 10.4 2.1 6.2a3.2 3.2 0 0 1 5.9-1.6 3.2 3.2 0 0 1 5.9 1.6c0 4.2-5.9 7.7-5.9 7.7Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3.3 5.1h9.4l.9 9.2H2.4l.9-9.2Z" />
      <path d="M5.9 5.1V3.9a2.1 2.1 0 0 1 4.2 0v1.2" />
    </svg>
  );
}

export default function Navbar() {
  const { count } = useCart();
  const { wishlist } = useWishlist();
  const { user, loading, logout, isAdmin } = useAuth();
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const mobileLinks = (
    <>
      <NavLink className="fs-mobile-link" to="/" end>
        Home
      </NavLink>
      <NavLink className="fs-mobile-link" to="/catalogue">
        Shop
      </NavLink>
      {user && (
        <NavLink className="fs-mobile-link" to="/orders">
          Orders
        </NavLink>
      )}
      {isAdmin && (
        <NavLink className="fs-mobile-link" to="/admin">
          Admin dashboard
        </NavLink>
      )}
      {user ? (
        <button className="fs-mobile-link" type="button" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <NavLink className="fs-mobile-link" to="/login">
          Login / Register
        </NavLink>
      )}
    </>
  );

  return (
    <header className="site-header">
      <div className="fs-topbar">
        <div className="container fs-topbar-inner">
          <span>Free shipping over ₹999 · 7-day returns</span>
          <span className="fs-topbar-region">India · INR ₹</span>
        </div>
      </div>

      <div className="fs-header">
        <div className="container fs-header-inner">
          <div className="fs-header-left">
            <button
              className="fs-menu-toggle"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
            >
              <span />
            </button>

            <nav className="fs-header-nav" aria-label="Main navigation">
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/catalogue">Shop</NavLink>
              {user && <NavLink to="/orders">Orders</NavLink>}
              {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              {user ? (
                <button className="fs-nav-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              ) : (
                <NavLink to="/login">Login</NavLink>
              )}
            </nav>
          </div>

          <Link className="fs-brand" to="/" aria-label="FashionStore home">
            FashionStore
          </Link>

          <div className="fs-header-actions">
            <Link className="fs-icon-link" to="/catalogue" aria-label="Search products">
              <Icon name="search" />
            </Link>
            <Link
              className="fs-icon-link"
              to={user ? "/orders" : "/login"}
              aria-label={user ? "Your orders" : "Login"}
            >
              <Icon name="user" />
            </Link>
            <Link
              className="fs-icon-link"
              to="/wishlist"
              aria-label={`Wishlist (${wishlist.length} items)`}
            >
              <Icon name="heart" />
              {wishlist.length > 0 && <span className="fs-icon-count">{wishlist.length}</span>}
            </Link>
            <Link className="fs-cart-link" to="/cart" aria-label={`Cart (${count} items)`}>
              <Icon name="bag" />
              <span>({count})</span>
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div className="fs-mobile-menu" id="mobile-menu">
          <nav aria-label="Mobile navigation">{mobileLinks}</nav>
          <div className="fs-mobile-meta">
            {loading ? (
              <span>Checking session…</span>
            ) : user ? (
              <span>
                Signed in as {user.name.split(" ")[0]}
                {isAdmin ? " · admin" : ""}
              </span>
            ) : (
              <span>Guest customer</span>
            )}
            <Link className="fs-icon-link" to="/cart">
              <Icon name="bag" />
              <span>Cart ({count})</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
