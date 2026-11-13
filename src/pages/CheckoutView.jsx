import { useEffect, useState } from "react";
import { Link, useRouter } from "../router.jsx";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLiveUpdates } from "../context/LiveUpdatesContext";
import { createOrder } from "../services/api";
import { calcTotals, formatPrice } from "../utils/calculations";
import Input from "../components/Input";
import Button from "../components/Button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s]{7,15}$/;
const ZIP_RE = /^[0-9A-Za-z -]{4,10}$/;
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name";
  if (!EMAIL_RE.test(values.email.trim())) errors.email = "Enter a valid email";
  if (!PHONE_RE.test(values.phone.trim())) errors.phone = "Enter a valid phone number";
  if (values.address.trim().length < 5) errors.address = "Enter your shipping address";
  if (values.city.trim().length < 2) errors.city = "Enter your city";
  if (!ZIP_RE.test(values.zip.trim())) errors.zip = "Enter a valid ZIP / Pincode";
  if (values.card.replace(/\s/g, "").length < 12) errors.card = "Enter a valid card number";
  if (!EXPIRY_RE.test(values.expiry.trim())) errors.expiry = "Use MM/YY";
  if (!/^[0-9]{3,4}$/.test(values.cvv.trim())) errors.cvv = "3 or 4 digits";
  return errors;
}

export default function CheckoutView() {
  const { items, refresh } = useCart();
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { notify } = useLiveUpdates();
  const { navigate } = useRouter();
  const { subtotal, tax, shipping, total } = calcTotals(items);

  const [values, setValues] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    zip: user?.zip || "",
    card: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill shipping details once the stored session has been restored.
  useEffect(() => {
    if (!user) return;
    setValues((current) => ({
      ...current,
      name: current.name || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
      address: current.address || user.address || "",
      city: current.city || user.city || "",
      zip: current.zip || user.zip || "",
    }));
  }, [user]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      // Card fields are deliberately NOT sent: the API only stores shipping data.
      const data = await createOrder({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        zip: values.zip.trim(),
      });
      await refresh();
      notify(`Order ${data.order.id} placed`, "success");
      navigate(`/success/${data.order.id}`);
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

  if (!isLoggedIn) {
    return (
      <div className="fs-empty text-center py-5 px-3 mx-auto" style={{ maxWidth: 560 }}>
        <div className="fs-eyebrow">Checkout</div>
        <h3 className="mt-1">Please sign in first</h3>
        <p className="text-muted">
          Orders are stored on the Express server, so checkout needs an account. Your guest bag is
          merged automatically after login.
        </p>
        <Link to="/login" className="btn btn-dark">
          Login / Register
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="alert alert-info">
        Your cart is empty. <Link to="/catalogue">Add products before checkout.</Link>
      </div>
    );
  }

  const field = (name, label, placeholder, type = "text", hint) => (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      value={values[name]}
      onChange={(event) => update(name, event.target.value)}
      error={errors[name]}
      hint={hint}
      name={name}
    />
  );

  return (
    <div className="row g-4">
      <div className="col-12 col-md-7">
        <div className="card p-4 fs-form-card">
          <div className="fs-eyebrow">Almost done</div>
          <h2 className="mb-3 mt-1">Checkout</h2>
          {serverError && <div className="alert alert-danger">{serverError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <h6 className="font-display" style={{ fontSize: "1.05rem" }}>
              Customer & Shipping
            </h6>
            {field("name", "Full Name", "John Carter")}
            {field("email", "Email", "you@example.com", "email")}
            {field("phone", "Phone", "9876543210", "tel")}
            {field("address", "Shipping Address", "123 Main St, Apt 4")}
            <div className="row">
              <div className="col-12 col-md-6">{field("city", "City", "Mumbai")}</div>
              <div className="col-12 col-md-6">{field("zip", "ZIP / Pincode", "400001")}</div>
            </div>

            <h6 className="mt-3 font-display" style={{ fontSize: "1.05rem" }}>
              Payment
            </h6>
            <p className="small text-muted">
              Demo only — card details are validated in the browser and never sent to the API.
            </p>
            {field("card", "Card Number", "4111 1111 1111 1111")}
            <div className="row">
              <div className="col-12 col-md-6">{field("expiry", "Expiry (MM/YY)", "12/28")}</div>
              <div className="col-12 col-md-6">{field("cvv", "CVV", "123", "password")}</div>
            </div>

            <Button type="submit" variant="dark" loading={submitting} className="w-100 mt-2">
              Place Order — {formatPrice(total)}
            </Button>
          </form>
        </div>
      </div>
      <div className="col-12 col-md-5">
        <div className="fs-summary p-4">
          <div className="fs-eyebrow mb-1">Summary</div>
          <h5 className="font-display">Order summary</h5>
          {items.map((item) => (
            <div key={item.key} className="d-flex justify-content-between small border-bottom py-2">
              <span>
                {item.product?.name} × {item.qty}
              </span>
              <span>{formatPrice((item.product?.price || 0) * item.qty)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between small mt-2">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span>Tax (8%)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="d-flex justify-content-between small">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
          </div>
          <hr />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
