import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { addToCart } from '../api';
import './Cart.css';

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, loadCart, removeItem, clearItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => { if (user) loadCart(); }, [user]);

  if (!user) return (
    <div className="page-container" style={{ paddingTop: 80 }}>
      <div className="empty-state">
        <div className="icon">🛒</div>
        <h3>Please login to view your cart</h3>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 20 }}>Login</Link>
      </div>
    </div>
  );

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const needsRx = cart.items.some(i => i.requires_rx);

  return (
    <div className="cart-page page-container fade-up">
      <h1 className="section-title">My Cart</h1>

      {cart.items.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Browse medicines and add them here</p>
          <Link to="/search?q=" className="btn btn-primary" style={{ marginTop: 20 }}>Shop Now</Link>
        </div>
      ) : (
        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            <div className="cart-header-row">
              <span>{cart.items.length} item{cart.items.length > 1 ? 's' : ''}</span>
              <button className="btn btn-outline btn-sm" onClick={clearItems}>Clear All</button>
            </div>

            {cart.items.map(item => (
              <CartItem key={item.id} item={item} onRemove={removeItem} reload={loadCart} />
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary card">
            <h3>Order Summary</h3>
            <div className="summary-rows">
              <div className="summary-row"><span>Subtotal</span><span>₹{cart.total}</span></div>
              <div className="summary-row"><span>Delivery</span><span className="free">FREE</span></div>
            </div>
            <div className="summary-total"><span>Total</span><span>₹{cart.total}</span></div>

            {needsRx && (
              <div className="rx-note">
                ⚠️ Some items require a prescription. You can upload it on the next page.
              </div>
            )}

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 20 }}
              onClick={() => navigate('/checkout')}>
              Proceed to Checkout →
            </button>

            <Link to="/search?q=" className="continue-shopping">← Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function CartItem({ item, onRemove, reload }) {
  const handleQty = async (qty) => {
    if (qty < 1) return;
    await addToCart({ medicine_id: item.medicine_id, quantity: qty });
    reload();
  };

  return (
    <div className="cart-item card">
      <div className="ci-img">
        {item.image_url ? <img src={item.image_url} alt={item.name} /> : <span>💊</span>}
      </div>
      <div className="ci-info">
        <Link to={`/medicine/${item.medicine_id}`} className="ci-name">{item.name}</Link>
        <div className="ci-store">{item.store_name}</div>
        {item.requires_rx && <span className="badge badge-amber">Rx Required</span>}
      </div>
      <div className="ci-qty">
        <button onClick={() => handleQty(item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
        <span>{item.quantity}</span>
        <button onClick={() => handleQty(item.quantity + 1)} disabled={item.quantity >= item.stock_qty}>+</button>
      </div>
      <div className="ci-price">₹{(item.price * item.quantity).toFixed(2)}</div>
      <button className="ci-remove" onClick={() => onRemove(item.medicine_id)}>✕</button>
    </div>
  );
}
