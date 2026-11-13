import { Link } from "../router.jsx";

export default function Footer() {
  return (
    <footer className="fs-footer">
      <div className="container">
        <div className="fs-footer-top">
          <div>
            <Link className="fs-footer-logo" to="/">
              FashionStore
            </Link>
            <p>
              Modern essentials, considered layers and accessories that finish the look. Built as
              a full-stack demo with React, Node.js and Express.
            </p>
          </div>

          <div className="fs-footer-col">
            <div className="fs-eyebrow">Shop</div>
            <Link to="/">Home</Link>
            <Link to="/catalogue">All products</Link>
          </div>

          <div className="fs-footer-col">
            <div className="fs-eyebrow">Account</div>
            <Link to="/cart">Shopping bag</Link>
            <Link to="/checkout">Checkout</Link>
            <Link to="/orders">Order history</Link>
          </div>

          <div className="fs-footer-col">
            <div className="fs-eyebrow">Service</div>
            <Link to="/login">Contact</Link>
          </div>
        </div>

        <div className="fs-footer-bottom">
          <span>© 2026 FashionStore</span>
          <span>React · Node.js · Express · SSE</span>
        </div>
      </div>
    </footer>
  );
}
