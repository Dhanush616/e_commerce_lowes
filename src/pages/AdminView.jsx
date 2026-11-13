import { useEffect, useState } from "react";
import { Link } from "../router.jsx";
import { useAuth } from "../context/AuthContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import { useAsync } from "../hooks/useAsync";
import {
  getAdminStats,
  listAllOrders,
  listProducts,
  reorderAdminProducts,
  updateAdminProduct,
  updateOrderStatus,
} from "../services/api";
import { formatPrice } from "../utils/calculations";
import { BarChart, LineChart } from "../components/Charts";
import { OrderStatusBadge, PageError, PageLoading } from "../components/States";

const ORDER_STATUSES = ["pending", "packed", "shipped", "delivered", "cancelled"];

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function Kpi({ label, value, hint }) {
  return (
    <div className="fs-kpi">
      <div className="fs-eyebrow-sm">{label}</div>
      <div className="fs-kpi-value">{value}</div>
      <div className="small text-muted">{hint}</div>
    </div>
  );
}

/** Native HTML5 drag-and-drop merchandising list. */
function MerchOrderList({ products, onSave }) {
  const [list, setList] = useState(products);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setList(products);
  }, [products]);

  async function drop(targetId) {
    setOverId(null);
    setDragId(null);
    if (!dragId || dragId === targetId) return;
    const current = [...list];
    const from = current.findIndex((product) => product.id === dragId);
    const to = current.findIndex((product) => product.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setList(current);
    setSaving(true);
    await onSave(current.map((product) => product.id));
    setSaving(false);
  }

  return (
    <div className="fs-merch-list">
      <div className="small text-muted mb-2">
        Drag to set the order customers see on the catalogue. {saving && "Saving…"}
      </div>
      {list.map((product, index) => (
        <div
          key={product.id}
          className={`fs-merch-item ${dragId === product.id ? "fs-dragging" : ""} ${
            overId === product.id ? "fs-drop-target" : ""
          }`}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", product.id);
            setDragId(product.id);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (overId !== product.id) setOverId(product.id);
          }}
          onDragLeave={() => setOverId(null)}
          onDrop={(event) => {
            event.preventDefault();
            drop(product.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
        >
          <span className="fs-drag-handle-inline" aria-hidden="true">
            ⠿
          </span>
          <span className="fs-merch-rank">{index + 1}</span>
          <img src={product.image} alt="" />
          <span className="fs-merch-name">{product.name}</span>
          <span className="badge text-bg-secondary">{product.category}</span>
        </div>
      ))}
    </div>
  );
}

function InventoryRow({ product, onSave }) {
  const [stock, setStock] = useState(String(product.stock));
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStock(String(product.stock));
    setPrice(String(product.price));
  }, [product.stock, product.price]);

  async function save(updates) {
    setSaving(true);
    await onSave(product.id, updates);
    setSaving(false);
  }

  const dirty = Number(stock) !== product.stock || Number(price) !== product.price;

  return (
    <tr>
      <td>
        <div className="d-flex align-items-center gap-2">
          <img src={product.image} alt="" width="34" height="42" style={{ objectFit: "cover" }} />
          <div>
            <div className="fw-semibold">{product.name}</div>
            <div className="small text-muted">{product.id}</div>
          </div>
        </div>
      </td>
      <td>{product.category}</td>
      <td>
        <input
          className="form-control form-control-sm"
          type="number"
          min="0"
          max="10000"
          value={stock}
          onChange={(event) => setStock(event.target.value)}
          style={{ width: 92 }}
          aria-label={`Stock for ${product.name}`}
        />
      </td>
      <td>
        <input
          className="form-control form-control-sm"
          type="number"
          min="1"
          step="1"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          style={{ width: 110 }}
          aria-label={`Price for ${product.name}`}
        />
      </td>
      <td>
        <label className="small d-flex align-items-center gap-1">
          <input
            type="checkbox"
            checked={product.featured}
            onChange={(event) => save({ featured: event.target.checked })}
          />
          Featured
        </label>
      </td>
      <td>
        <button
          className="btn btn-sm btn-dark"
          disabled={!dirty || saving}
          onClick={() => save({ stock: Number(stock), price: Number(price) })}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </td>
    </tr>
  );
}

export default function AdminView() {
  const { user, loading: authLoading } = useAuth();
  const { connected, version, notify } = useLiveUpdates();

  const isAdmin = user?.role === "admin";

  const { data, loading, error, reload } = useAsync(
    async () => {
      if (!isAdmin) return null;
      const [stats, productData, orderData] = await Promise.all([
        getAdminStats(),
        listProducts(),
        listAllOrders(),
      ]);
      return {
        stats,
        products: [...productData.items].sort((a, b) => a.rank - b.rank),
        orders: orderData.orders,
      };
    },
    [isAdmin, version]
  );

  if (authLoading) return <PageLoading label="Checking your session…" />;

  if (!user) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 560 }}>
        <div className="fs-eyebrow">Admin</div>
        <h3 className="mt-1">Admin login required</h3>
        <p className="text-muted">
          Use the seeded admin account: <code>admin@fashionstore.test</code> /{" "}
          <code>Admin@123</code>
        </p>
        <Link to="/login" className="btn btn-dark">
          Go to login
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="alert alert-warning">
        <strong>403 — role check enforced by Express.</strong> You are signed in as{" "}
        {user.email} ({user.role}). Ask an administrator for access.
      </div>
    );
  }

  if (loading && !data) return <PageLoading label="Loading dashboard…" />;
  if (error) return <PageError error={error} onRetry={reload} />;
  if (!data) return null;

  const { stats, products, orders } = data;
  const categoryData = stats.revenueByCategory.map((item) => ({
    label: item.category,
    value: item.revenue,
  }));
  const salesData = stats.ordersByDay.map((day) => ({ label: day.label, value: day.orders }));
  const maxUnits = Math.max(1, ...stats.topProducts.map((item) => item.units));

  async function handleProductSave(id, updates) {
    try {
      await updateAdminProduct(id, updates);
      notify("Product updated — live event broadcast", "success");
      reload();
    } catch (saveError) {
      notify(saveError.message, "danger");
    }
  }

  async function handleOrderStatus(id, status) {
    try {
      await updateOrderStatus(id, status);
      notify(`Order ${id} → ${status}`, "success");
      reload();
    } catch (updateError) {
      notify(updateError.message, "danger");
    }
  }

  async function handleMerchOrder(ids) {
    try {
      await reorderAdminProducts(ids);
      notify("Merchandising order saved", "success");
    } catch (orderError) {
      notify(orderError.message, "danger");
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
        <div>
          <div className="fs-eyebrow">Admin</div>
          <h2 className="mt-1 mb-1">Store dashboard</h2>
          <p className="small text-muted mb-0">
            In-memory data · role-protected API · server-sent events
          </p>
        </div>
        <span className={`fs-live ${connected ? "on" : ""}`}>
          <span className="fs-live-dot" /> {connected ? "Live updates connected" : "Reconnecting…"}
        </span>
      </div>

      <div className="fs-kpi-grid mb-4">
        <Kpi
          label="Revenue"
          value={formatPrice(stats.totals.revenue)}
          hint={`${stats.totals.activeOrders} active orders`}
        />
        <Kpi
          label="Orders"
          value={stats.totals.orders}
          hint={`Avg ${formatPrice(stats.totals.averageOrderValue)}`}
        />
        <Kpi
          label="Customers"
          value={stats.totals.customers}
          hint={`${stats.totals.products} products in catalogue`}
        />
        <Kpi
          label="Low stock"
          value={stats.totals.lowStockCount}
          hint={`${stats.totals.unitsSold} units sold`}
        />
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div className="fs-eyebrow-sm">Revenue</div>
                <h5 className="mb-0">By category</h5>
              </div>
              <span className="small text-muted">Hand-built SVG</span>
            </div>
            {categoryData.length ? (
              <BarChart data={categoryData} />
            ) : (
              <p className="text-muted small mb-0">No sales yet.</p>
            )}
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card p-3 h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <div className="fs-eyebrow-sm">Last 7 days</div>
                <h5 className="mb-0">Orders per day</h5>
              </div>
              <span className="small text-muted">Hand-built SVG</span>
            </div>
            <LineChart data={salesData} formatValue={(value) => `${Math.round(value)}`} />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card p-3 h-100">
            <div className="fs-eyebrow-sm">Catalogue</div>
            <h5>Merchandising order</h5>
            <MerchOrderList products={products} onSave={handleMerchOrder} />
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card p-3 h-100">
            <div className="fs-eyebrow-sm">Inventory</div>
            <h5>Low stock alert</h5>
            {stats.lowStock.length === 0 ? (
              <p className="small text-muted mb-0">Everything is well stocked.</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {stats.lowStock.map((product) => (
                  <div
                    className="d-flex justify-content-between align-items-center border-bottom pb-2"
                    key={product.id}
                  >
                    <div>
                      <div className="fw-semibold">{product.name}</div>
                      <div className="small text-muted">{product.category}</div>
                    </div>
                    <span
                      className={`badge ${
                        product.stock === 0 ? "text-bg-danger" : "text-bg-warning"
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            )}

            <hr />
            <div className="fs-eyebrow-sm">Best sellers</div>
            <h6>Top products</h6>
            <div className="d-flex flex-column gap-2">
              {stats.topProducts.map((item) => (
                <div key={item.productId}>
                  <div className="d-flex justify-content-between small">
                    <span>{item.name}</span>
                    <strong>{item.units} sold</strong>
                  </div>
                  <div className="fs-progress">
                    <span style={{ width: `${(item.units / maxUnits) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div className="fs-eyebrow-sm">Products</div>
            <h5 className="mb-0">Inventory & stock</h5>
          </div>
          <span className="small text-muted">Changes broadcast over SSE</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock</th>
                <th>Price (₹)</th>
                <th>Featured</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <InventoryRow key={product.id} product={product} onSave={handleProductSave} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <div className="fs-eyebrow-sm">Fulfilment</div>
            <h5 className="mb-0">All orders</h5>
          </div>
          <span className="small text-muted">Status updates are live</span>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Placed</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="fw-semibold">{order.id}</td>
                  <td>
                    {order.customer.name}
                    <div className="small text-muted">{order.customer.email}</div>
                  </td>
                  <td className="small">{formatDate(order.createdAt)}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.qty, 0)}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <select
                        className="form-select form-select-sm"
                        value={order.status}
                        onChange={(event) => handleOrderStatus(order.id, event.target.value)}
                        aria-label={`Status for ${order.id}`}
                      >
                        {ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="small text-muted">Demo / prepaid</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
