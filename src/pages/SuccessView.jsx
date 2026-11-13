import { Link } from "../router.jsx";
import { useAuth } from "../context/AuthContext";
import { getOrder } from "../services/api";
import { formatPrice } from "../utils/calculations";
import { useAsync } from "../hooks/useAsync";
import { OrderStatusBadge } from "../components/States";

export default function SuccessView({ orderId }) {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(
    () => (user && orderId ? getOrder(orderId) : Promise.resolve(null)),
    [user?.id, orderId]
  );

  const order = data?.order;

  return (
    <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 620 }}>
      <div className="fs-success-mark" aria-hidden="true">
        ✓
      </div>
      <div className="fs-eyebrow mt-3">Thank you</div>
      <h2 className="mt-1">Order placed successfully!</h2>
      <div className="fs-divider-gold" />
      <p className="text-muted mb-1">
        Order ID: <strong className="text-dark">{orderId || "—"}</strong>
      </p>

      {loading && <p className="text-muted">Loading order details…</p>}
      {error && <p className="text-muted small">{error.message}</p>}

      {order && (
        <>
          <p className="fs-price mb-1">Amount paid: {formatPrice(order.total)}</p>
          <p className="mb-2">
            <OrderStatusBadge status={order.status} />
          </p>
          <p className="small text-muted">
            Shipping to {order.customer.name}, {order.customer.address}, {order.customer.city}{" "}
            {order.customer.zip}
          </p>
          <p className="small text-muted">
            The Express server has already reduced stock and cleared your cart. Watch the admin
            dashboard change this status live.
          </p>
        </>
      )}

      <div className="d-flex gap-2 justify-content-center mt-3 flex-wrap">
        <Link to="/orders" className="btn btn-dark">
          View my orders
        </Link>
        <Link to="/catalogue" className="btn btn-outline-dark">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
