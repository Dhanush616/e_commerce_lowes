import { Link } from "../router.jsx";
import { useAuth } from "../context/AuthContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import { listOrders } from "../services/api";
import { formatPrice } from "../utils/calculations";
import { useAsync } from "../hooks/useAsync";
import { OrderStatusBadge, PageError, PageLoading } from "../components/States";

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersView() {
  const { user, loading: authLoading } = useAuth();
  const { version } = useLiveUpdates();

  const { data, loading, error, reload } = useAsync(
    () => (user ? listOrders() : Promise.resolve({ orders: [] })),
    [user?.id, version]
  );

  if (authLoading) return <PageLoading label="Checking your session…" />;

  if (!user) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 540 }}>
        <div className="fs-eyebrow">Orders</div>
        <h3 className="mt-1">Sign in to see your orders</h3>
        <p className="text-muted">Order history is stored against your in-memory session.</p>
        <Link to="/login" className="btn btn-dark">
          Login
        </Link>
      </div>
    );
  }

  const orders = data?.orders || [];

  return (
    <>
      <div className="mb-4">
        <div className="fs-eyebrow">Account</div>
        <h2 className="mt-1">Your orders</h2>
        <p className="small text-muted mb-0">
          Status changes made in the admin dashboard appear here live.
        </p>
      </div>

      {loading && orders.length === 0 && <PageLoading label="Loading orders…" />}
      {error && <PageError error={error} onRetry={reload} />}

      {!loading && !error && orders.length === 0 && (
        <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 540 }}>
          <h4>No orders yet</h4>
          <p className="text-muted">Your first order will appear here after checkout.</p>
          <Link to="/catalogue" className="btn btn-dark">
            Start shopping
          </Link>
        </div>
      )}

      <div className="d-flex flex-column gap-3">
        {orders.map((order) => (
          <article className="card p-3 fs-order-card" key={order.id}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-2 mb-2">
              <div>
                <strong>{order.id}</strong>
                <div className="small text-muted">{formatDate(order.createdAt)}</div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <strong>{formatPrice(order.total)}</strong>
              </div>
            </div>
            <div className="small text-muted mb-2">
              Ship to {order.customer.name}, {order.customer.address}, {order.customer.city}{" "}
              {order.customer.zip}
            </div>
            <div className="d-flex flex-column gap-1">
              {order.items.map((item) => (
                <div
                  className="d-flex justify-content-between small"
                  key={`${order.id}-${item.productId}-${item.size}`}
                >
                  <span>
                    {item.name} · {item.size} × {item.qty}
                  </span>
                  <span>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="small text-muted mt-2">
              Subtotal {formatPrice(order.subtotal)} · Tax {formatPrice(order.tax)} · Shipping{" "}
              {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
