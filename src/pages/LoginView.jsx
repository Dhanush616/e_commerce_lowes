import { useState } from "react";
import { Link, useRouter } from "../router.jsx";
import { useAuth } from "../context/AuthContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import Input from "../components/Input";
import Button from "../components/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMOS = [
  { label: "Customer demo", email: "alex@example.com", password: "User@123", role: "customer" },
  { label: "Admin demo", email: "admin@fashionstore.test", password: "Admin@123", role: "admin" },
];

export default function LoginView() {
  const { login, register, isLoggedIn, user, loading: authLoading } = useAuth();
  const { notify } = useLiveUpdates();
  const { navigate } = useRouter();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setErrors({});
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (mode === "register" && values.name.trim().length < 2) {
      nextErrors.name = "Enter your name";
    }
    if (!EMAIL_RE.test(values.email.trim())) nextErrors.email = "Enter a valid email";
    if (values.password.length < 6) nextErrors.password = "Minimum 6 characters";
    if (mode === "register" && values.confirm !== values.password) {
      nextErrors.confirm = "Passwords do not match";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      if (mode === "login") {
        const account = await login(values.email.trim(), values.password);
        notify(`Welcome back, ${account.name.split(" ")[0]}`, "success");
      } else {
        const account = await register(values.name.trim(), values.email.trim(), values.password);
        notify(`Account created for ${account.name.split(" ")[0]}`, "success");
      }
      navigate("/");
    } catch (error) {
      setServerError(error.message);
      if (error.details?.field) {
        setErrors((current) => ({ ...current, [error.details.field]: error.message }));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border" role="status" />
        <p className="text-muted mt-3">Checking your session…</p>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 560 }}>
        <div className="fs-eyebrow">Session active</div>
        <h3 className="mt-1">You are logged in as {user.name}</h3>
        <p className="text-muted">
          Role: <strong>{user.role}</strong> · session stored as an opaque token in memory on the
          Express server.
        </p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <Link to="/orders" className="btn btn-dark">
            View orders
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" className="btn btn-outline-dark">
              Admin dashboard
            </Link>
          )}
          <Link to="/catalogue" className="btn btn-outline-dark">
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fs-auth">
      <aside className="fs-auth-aside">
        <div>
          <p className="fs-auth-eyebrow">Members only</p>
          <div className="fs-auth-word" aria-hidden="true">
            SIGN
            <br />
            IN
          </div>
        </div>

        <ul className="fs-auth-list">
          <li>Wishlist saved to your account</li>
          <li>Order history and live status</li>
          <li>Faster checkout next time</li>
        </ul>

        <p className="fs-auth-note">
          Sessions are opaque tokens issued with Node&apos;s built-in crypto module and kept in
          memory on the Express server.
        </p>
      </aside>

      <div className="fs-auth-panel">
        <div className="fs-eyebrow">{mode === "login" ? "Welcome back" : "Join FashionStore"}</div>
        <h1 className="fs-auth-title">{mode === "login" ? "Login" : "Create account"}</h1>
        <p className="text-muted small mb-3">
          {mode === "login"
            ? "Use your account, or try one of the seeded demos below."
            : "Create an account to save your bag and wishlist across visits."}
        </p>

        <div className="d-flex gap-2 mb-4">
          <button
            type="button"
            className={`btn btn-sm ${mode === "login" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => switchMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === "register" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => switchMode("register")}
          >
            Register
          </button>
        </div>

        {serverError && <div className="alert alert-danger">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {mode === "register" && (
            <Input
              label="Full name"
              placeholder="Alex Carter"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              error={errors.name}
              autoComplete="name"
            />
          )}
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            error={errors.password}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {mode === "register" && (
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={values.confirm}
              onChange={(event) => update("confirm", event.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
            />
          )}
          <Button type="submit" variant="dark" loading={submitting} className="w-100 mt-2">
            {mode === "login" ? "Login" : "Create account"}
          </Button>
        </form>

        <div className="fs-auth-demos">
          <div className="fs-eyebrow mb-2">Try a seeded account</div>
          <div className="d-flex flex-column gap-2">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                className="btn btn-sm fs-demo-btn"
                onClick={() => {
                  setMode("login");
                  setValues({
                    name: "",
                    email: demo.email,
                    password: demo.password,
                    confirm: "",
                  });
                  setErrors({});
                }}
              >
                <span>{demo.label}</span>
                <span className="fs-demo-meta">
                  {demo.email} · {demo.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
