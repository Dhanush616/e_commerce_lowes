export function PageLoading({ label = "Loading…" }) {
  return (
    <div className="fs-state text-center py-5">
      <span className="spinner-border" role="status" aria-hidden="true" />
      <p className="text-muted mt-3 mb-0">{label}</p>
    </div>
  );
}

export function PageError({ error, onRetry }) {
  return (
    <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span>{error?.message || "Something went wrong while talking to the server."}</span>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

const STATUS_CLASS = {
  pending: "text-bg-warning",
  packed: "text-bg-info",
  shipped: "text-bg-info",
  delivered: "text-bg-success",
  cancelled: "text-bg-danger",
};

export function OrderStatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || "text-bg-secondary"}`}>{status}</span>;
}
