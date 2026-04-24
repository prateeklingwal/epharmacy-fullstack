import React, { useState, useEffect } from 'react';
import {
  getAdminStats, getAdminUsers, toggleUser,
  getAdminRetailers, approveRetailer, toggleRetailer,
  getAdminMedicines, getAdminOrders,
  getPrescriptions, reviewPrescription,
  getRevenueReport
} from '../api';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const TABS = [
  { key: 'overview',      label: '📊 Overview' },
  { key: 'users',         label: '👥 Users' },
  { key: 'retailers',     label: '🏪 Retailers' },
  { key: 'medicines',     label: '💊 Medicines' },
  { key: 'orders',        label: '📦 Orders' },
  { key: 'prescriptions', label: '📋 Prescriptions' },
  { key: 'reports',       label: '📈 Reports' },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="admin-page page-container fade-up">
      <h1 className="section-title">Admin Dashboard</h1>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'overview'      && <Overview />}
        {tab === 'users'         && <Users />}
        {tab === 'retailers'     && <Retailers />}
        {tab === 'medicines'     && <Medicines />}
        {tab === 'orders'        && <Orders />}
        {tab === 'prescriptions' && <Prescriptions />}
        {tab === 'reports'       && <Reports />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* OVERVIEW                                    */
/* ─────────────────────────────────────────── */
function Overview() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data.data));
  }, []);

  if (!stats) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const CARDS = [
    { label: 'Total Users',       value: stats.users,                icon: '👥', color: 'blue' },
    { label: 'Active Retailers',  value: stats.retailers,            icon: '🏪', color: 'teal' },
    { label: 'Pending Approval',  value: stats.pending_retailers,    icon: '⏳', color: 'amber' },
    { label: 'Total Medicines',   value: stats.medicines,            icon: '💊', color: 'green' },
    { label: 'Total Orders',      value: stats.orders,               icon: '📦', color: 'purple' },
    { label: 'Revenue (Delivered)', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: '💰', color: 'gold' },
    { label: 'Low Stock Alerts',  value: stats.low_stock_alerts,     icon: '⚠️', color: 'coral' },
    { label: 'Pending Rx',        value: stats.pending_prescriptions, icon: '📋', color: 'amber' },
  ];

  return (
    <div>
      <div className="stats-grid">
        {CARDS.map(c => (
          <div key={c.label} className={`stat-card card sc-${c.color}`}>
            <div className="sc-icon">{c.icon}</div>
            <div className="sc-val">{c.value}</div>
            <div className="sc-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* USERS                                       */
/* ─────────────────────────────────────────── */
function Users() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAdminUsers().then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleToggle = async id => {
    await toggleUser(id);
    toast.success('User status updated');
    load();
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="admin-tab-header">
        <h3>All Users ({users.length})</h3>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-coral' : 'badge-teal'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>{u.is_active ? 'Active' : 'Suspended'}</span></td>
                <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-outline'}`}
                      onClick={() => handleToggle(u.id)}>
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* RETAILERS                                   */
/* ─────────────────────────────────────────── */
function Retailers() {
  const [retailers, setRetailers] = useState([]);
  const [filter, setFilter]       = useState('all');
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    const params = filter === 'pending' ? { approved: 0 } : filter === 'approved' ? { approved: 1 } : {};
    getAdminRetailers(params).then(r => setRetailers(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  const handleApprove = async id => {
    await approveRetailer(id);
    toast.success('Retailer approved!');
    load();
  };
  const handleToggle = async id => {
    await toggleRetailer(id);
    toast.success('Status updated');
    load();
  };

  return (
    <div>
      <div className="admin-tab-header">
        <h3>Retailers ({retailers.length})</h3>
        <div className="filter-pills">
          {['all', 'pending', 'approved'].map(f => (
            <button key={f} className={`filter-pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {loading
        ? <div className="spinner-wrap"><div className="spinner" /></div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Store</th><th>Email</th><th>License</th><th>Approved</th><th>Active</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {retailers.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td>{r.store_name}</td>
                    <td>{r.email}</td>
                    <td style={{ fontSize: 13 }}>{r.license_no}</td>
                    <td>
                      {r.is_approved
                        ? <span className="badge badge-green">Yes</span>
                        : <span className="badge badge-amber">Pending</span>}
                    </td>
                    <td><span className={`badge ${r.is_active ? 'badge-green' : 'badge-gray'}`}>{r.is_active ? 'Active' : 'Off'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!r.is_approved && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleApprove(r.id)}>Approve</button>
                        )}
                        <button className={`btn btn-sm ${r.is_active ? 'btn-danger' : 'btn-outline'}`}
                          onClick={() => handleToggle(r.id)}>
                          {r.is_active ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* MEDICINES                                   */
/* ─────────────────────────────────────────── */
function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [lowStock, setLowStock]   = useState(false);
  const [loading, setLoading]     = useState(true);

  const load = () => {
    setLoading(true);
    getAdminMedicines(lowStock ? { low_stock: 1 } : {})
      .then(r => setMedicines(r.data.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [lowStock]);

  return (
    <div>
      <div className="admin-tab-header">
        <h3>All Medicines ({medicines.length})</h3>
        <label className="toggle-label">
          <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
          <span>Low Stock Only</span>
        </label>
      </div>
      {loading
        ? <div className="spinner-wrap"><div className="spinner" /></div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Salt</th><th>Manufacturer</th><th>Retailer</th><th>Price</th><th>Stock</th><th>Rx</th><th>Status</th></tr>
              </thead>
              <tbody>
                {medicines.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)', maxWidth: 180 }}>{m.salt_composition}</td>
                    <td>{m.manufacturer}</td>
                    <td>{m.store_name}</td>
                    <td>₹{m.price}</td>
                    <td>
                      <span className={`badge ${m.stock_qty < 10 ? 'badge-coral' : 'badge-green'}`}>
                        {m.stock_qty}
                      </span>
                    </td>
                    <td>{m.requires_rx ? <span className="badge badge-amber">Yes</span> : '—'}</td>
                    <td><span className={`badge ${m.is_active ? 'badge-green' : 'badge-gray'}`}>{m.is_active ? 'Active' : 'Off'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* ORDERS                                      */
/* ─────────────────────────────────────────── */
function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAdminOrders(status ? { status } : {})
      .then(r => setOrders(r.data.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [status]);

  const STATUS_COLORS = {
    pending: 'badge-amber', confirmed: 'badge-teal', packed: 'badge-teal',
    shipped: 'badge-teal',  delivered: 'badge-green', cancelled: 'badge-coral'
  };

  return (
    <div>
      <div className="admin-tab-header">
        <h3>All Orders ({orders.length})</h3>
        <select className="form-control" style={{ width: 'auto' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {['pending','confirmed','packed','shipped','delivered','cancelled'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>
      {loading
        ? <div className="spinner-wrap"><div className="spinner" /></div>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Payment</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#ORD-{o.id.toString().padStart(5,'0')}</strong></td>
                    <td>{o.user_name}<br /><small style={{ color: 'var(--ink-soft)' }}>{o.email}</small></td>
                    <td>₹{o.total_amount}</td>
                    <td><span className={`badge ${o.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}`}>{o.payment_status}</span></td>
                    <td><span className={`badge ${STATUS_COLORS[o.status] || 'badge-gray'}`}>{o.status}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{new Date(o.placed_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* PRESCRIPTIONS                               */
/* ─────────────────────────────────────────── */
function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes]     = useState({});

  const load = () => {
    setLoading(true);
    getPrescriptions().then(r => setPrescriptions(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleReview = async (id, status) => {
    await reviewPrescription(id, { status, notes: notes[id] || '' });
    toast.success(`Prescription ${status}`);
    load();
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="admin-tab-header"><h3>Prescriptions ({prescriptions.length})</h3></div>
      <div className="rx-list">
        {prescriptions.map(p => (
          <div key={p.id} className="rx-card card">
            <div className="rx-info">
              <div className="rx-user">{p.user_name}</div>
              <div className="rx-date">{new Date(p.uploaded_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
              <span className={`badge ${p.status === 'approved' ? 'badge-green' : p.status === 'rejected' ? 'badge-coral' : 'badge-amber'}`}>
                {p.status}
              </span>
            </div>
            <div className="rx-file">
              <a href={p.file_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                📄 View File
              </a>
            </div>
            {p.status === 'pending' && (
              <div className="rx-actions">
                <input
                  className="form-control"
                  placeholder="Notes (optional)"
                  value={notes[p.id] || ''}
                  onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm"  onClick={() => handleReview(p.id, 'approved')}>Approve</button>
                <button className="btn btn-danger btn-sm"   onClick={() => handleReview(p.id, 'rejected')}>Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/* REPORTS                                     */
/* ─────────────────────────────────────────── */
function Reports() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueReport().then(r => setReport(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const maxRevenue = Math.max(...(report.monthly.map(m => parseFloat(m.revenue)) || [1]));

  return (
    <div>
      <h3 style={{ marginBottom: 28 }}>Revenue Report</h3>

      {/* Monthly bar chart */}
      <div className="card report-card" style={{ padding: 28, marginBottom: 28 }}>
        <h4 style={{ marginBottom: 20 }}>Monthly Revenue</h4>
        {report.monthly.length === 0
          ? <p style={{ color: 'var(--ink-soft)' }}>No delivered orders yet.</p>
          : (
            <div className="bar-chart">
              {[...report.monthly].reverse().map(m => {
                const pct = Math.round((parseFloat(m.revenue) / maxRevenue) * 100);
                return (
                  <div key={m.month} className="bar-item">
                    <div className="bar-label">₹{(parseFloat(m.revenue)/1000).toFixed(1)}k</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${pct}%` }} />
                    </div>
                    <div className="bar-month">{m.month.slice(5)}/{m.month.slice(2,4)}</div>
                    <div className="bar-orders">{m.orders} orders</div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Top medicines */}
      <div className="card report-card" style={{ padding: 28 }}>
        <h4 style={{ marginBottom: 20 }}>Top 10 Medicines by Sales</h4>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>Medicine</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {report.topMedicines.map((m, i) => (
                <tr key={m.name}>
                  <td>
                    <span className={`badge ${i === 0 ? 'badge-amber' : i < 3 ? 'badge-teal' : 'badge-gray'}`}>
                      #{i + 1}
                    </span>
                  </td>
                  <td><strong>{m.name}</strong></td>
                  <td>{m.sold}</td>
                  <td>₹{parseFloat(m.revenue).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
