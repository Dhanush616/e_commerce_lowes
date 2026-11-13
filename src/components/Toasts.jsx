import { useLiveUpdates } from "../context/LiveUpdatesContext";

export default function Toasts() {
  const { notifications, dismiss } = useLiveUpdates();

  if (notifications.length === 0) return null;

  return (
    <div className="fs-toasts" aria-live="polite">
      {notifications.map((item) => (
        <div key={item.id} className={`fs-toast fs-toast-${item.tone}`}>
          <span>{item.message}</span>
          <button onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
