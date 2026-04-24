import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getMyOrders, getOrderDetail, cancelOrder } from '../api';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_META = {
  pending:   { label: 'Pending',   color: 'badge-amber',  icon: '⏳' },
  confirmed: { label: 'Confirmed', color: 'badge-teal',   icon: '✅' },
  packed:    { label: 'Packed',    color: 'badge-teal',   icon: '📦' },
  shipped:   { label: 'Shipped',   color: 'badge-teal',   icon: '🚚' },
  delivered: { label: 'Delivered', color: 'badge-green',  icon: '🎉' },
  cancelled: { label: 'Cancelled', color: 'badge-coral',  icon: '❌' },
};

export function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyOrders().then(r => setOrders(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div className="orders-page page-container fade-up">
      <h1 className="section-title">My Orders</h1>
      <p className="section-sub">{orders.length} orders placed</p>

      {orders.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📦</div>
          <h3>No orders yet</h3>
          <Link to="/search?q=" className="btn btn-primary" style={{ marginTop: 20 }}>Shop Now</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const meta = STATUS_META[order.status] || STATUS_META.pending;
            return (
              <Link to={`/orders/${order.id}`} key={order.id} className="order-row card">
                <div className="or-id">
                  <span className="or-hash">#ORD-{order.id.toString().padStart(5, '0')}</span>
                  <span className="or-date">{new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="or-items">{order.item_count} item{order.item_count > 1 ? 's' : ''}</div>
                <div className="or-amount">₹{order.total_amount}</div>
                <span className={`badge ${meta.color}`}>{meta.icon} {meta.label}</span>
                <span className="or-arrow">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id }   = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const load = () => {
    setLoading(true);
    getOrderDetail(id).then(r => setOrder(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await cancelOrder(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel');
    } finally { setCancelling(false); }
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!order) return <div className="page-container" style={{ padding: 40 }}>Order not found.</div>;

  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const STEPS = ['pending','confirmed','packed','shipped','delivered'];
  const stepIdx = STEPS.indexOf(order.status);

  return (
    <div className="order-detail page-container fade-up">
      <div className="od-header">
        <div>
          <Link to="/orders" className="back-link">← My Orders</Link>
          <h1 className="section-title" style={{ marginTop: 8 }}>
            Order #ORD-{order.id.toString().padStart(5, '0')}
          </h1>
          <p className="section-sub">
            Placed on {new Date(order.placed_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        <span className={`badge ${meta.color}`} style={{ fontSize: 14, padding: '8px 16px' }}>
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Status timeline */}
      {order.status !== 'cancelled' && (
        <div className="status-timeline card">
          {STEPS.map((s, i) => {
            const m = STATUS_META[s];
            const done    = i < stepIdx;
            const current = i === stepIdx;
            return (
              <div key={s} className={`tl-step ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
                <div className="tl-dot">{done ? '✓' : m.icon}</div>
                <div className="tl-label">{m.label}</div>
                {i < STEPS.length - 1 && <div className="tl-line" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="od-layout">
        {/* Items */}
        <div>
          <div className="card od-items">
            <h3 style={{ padding: '20px 20px 0' }}>Items Ordered</h3>
            {order.items?.map(item => (
              <div key={item.id} className="od-item">
                <div className="odi-img">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : '💊'}
                </div>
                <div className="odi-info">
                  <Link to={`/medicine/${item.medicine_id}`} className="odi-name">{item.name}</Link>
                  <div className="odi-store">{item.store_name}</div>
                </div>
                <div className="odi-qty">×{item.quantity}</div>
                <div className="odi-price">₹{item.subtotal}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="od-sidebar">
          <div className="card od-summary">
            <h4>Order Summary</h4>
            <div className="os-row"><span>Payment</span><span>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
            <div className="os-row"><span>Payment Status</span>
              <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>
                {order.payment_status}
              </span>
            </div>
            <div className="os-row"><span>Delivery to</span><span>{order.delivery_address}</span></div>
            <div className="os-total"><span>Total</span><span>₹{order.total_amount}</span></div>
          </div>

          {['pending', 'confirmed'].includes(order.status) && (
            <button className="btn btn-danger" style={{ width: '100%', marginTop: 12 }}
              onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : '❌ Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
