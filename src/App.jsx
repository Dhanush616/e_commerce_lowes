import "./styles/framework.css";
import "./App.css";
import "./index.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Toasts from "./components/Toasts";
import { Link, RouterProvider, useRouter } from "./router.jsx";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { LiveUpdatesProvider } from "./context/LiveUpdatesContext";
import HomeView from "./pages/HomeView";
import CatalogueView from "./pages/CatalogueView";
import ProductDetailView from "./pages/ProductDetailView";
import CartView from "./pages/CartView";
import WishlistView from "./pages/WishlistView";
import LoginView from "./pages/LoginView";
import CheckoutView from "./pages/CheckoutView";
import SuccessView from "./pages/SuccessView";
import OrdersView from "./pages/OrdersView";
import AdminView from "./pages/AdminView";

function NotFoundView() {
  return (
    <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 520 }}>
      <div className="fs-eyebrow">404</div>
      <h2 className="mt-1">Page not found</h2>
      <p className="text-muted">That page does not exist in this store.</p>
      <Link to="/" className="btn btn-dark">
        Go home
      </Link>
    </div>
  );
}

function RouteView() {
  const { path } = useRouter();
  const cleanPath = path.replace(/\/+$/, "") || "/";

  if (cleanPath === "/") return <HomeView />;
  if (cleanPath === "/catalogue") return <CatalogueView />;
  if (cleanPath === "/cart") return <CartView />;
  if (cleanPath === "/wishlist") return <WishlistView />;
  if (cleanPath === "/login") return <LoginView />;
  if (cleanPath === "/checkout") return <CheckoutView />;
  if (cleanPath === "/orders") return <OrdersView />;
  if (cleanPath === "/admin") return <AdminView />;
  if (cleanPath === "/success") return <SuccessView orderId={null} />;

  const productMatch = cleanPath.match(/^\/product\/([^/]+)$/);
  if (productMatch) return <ProductDetailView productId={decodeURIComponent(productMatch[1])} />;

  const successMatch = cleanPath.match(/^\/success\/([^/]+)$/);
  if (successMatch) return <SuccessView orderId={decodeURIComponent(successMatch[1])} />;

  return <NotFoundView />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <LiveUpdatesProvider>
          <CartProvider>
            <WishlistProvider>
              <Navbar />
              <main className="container py-4">
                <RouteView />
              </main>
              <Footer />
              <Toasts />
            </WishlistProvider>
          </CartProvider>
        </LiveUpdatesProvider>
      </AuthProvider>
    </RouterProvider>
  );
}
