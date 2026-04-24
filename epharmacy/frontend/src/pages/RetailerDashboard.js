import React, { useState, useEffect } from 'react';
import { getRetailerMedicines, addRetailerMedicine, updateRetailerMedicine, deleteRetailerMedicine, updateStock, getRetailerOrders, updateOrderStatus } from '../api';
import toast from 'react-hot-toast';
import './RetailerDashboard.css';

export default function RetailerDashboard() {
  const [tab,       setTab]       = useState('medicines');
  const [medicines, setMedicines] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form, setForm] = useState({ name: '', salt_composition: '', manufacturer: '', category: '', price: '', mrp: '', stock_qty: '', unit: 'strip', requires_rx: false, description: '' });

  const loadMeds = async () => {
    setLoading(true);
    const { data } = await getRetailerMedicines();
    setMedicines(data.data);
    setLoading(false);
  };
  const loadOrders = async () => {
    const { data } = await getRetailerOrders();
    setOrders(data.data);
  };

  useEffect(() => {
    if (tab === 'medicines') loadMeds();
    else loadOrders();
  }, [tab]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', salt_composition: '', manufacturer: '', category: '', price: '', mrp: '', stock_qty: '', unit: 'strip', requires_rx: false, description: '' });
    setShowForm(true);
  };

  const openEdit = m => {
    setEditing(m.id);
    setForm({ name: m.name, salt_composition: m.salt_composition, manufacturer: m.manufacturer, category: m.category || '', price: m.price, mrp: m.mrp, stock_qty: m.stock_qty, unit: m.unit, requires_rx: !!m.requires_rx, description: m.description || '' });
    setShowForm(true);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) { await updateRetailerMedicine(editing, form); toast.success('Updated'); }
      else         { await addRetailerMedicine(form);            toast.success('Medicine added'); }
      setShowForm(false); loadMeds();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Remove this medicine?')) return;
    await deleteRetailerMedicine(id);
    toast.success('Removed'); loadMeds();
  };

  const handleStock = async (id, current) => {
    const val = window.prompt('New stock quantity:', current);
    if (val === null) return;
    await updateStock(id, parseInt(val));
    toast.success('Stock updated'); loadMeds();
  };

  const handleStatus = async (id, status) => {
    await updateOrderStatus(id, status);
    toast.success('Status updated'); loadOrders();
  };

  return (
    <div className="retailer-page page-container fade-up">
      <h1 className="section-title">Retailer Dashboard</h1>

      <div className="r-tabs">
        <button className={tab === 'medicines' ? 'active' : ''} onClick={() => setTab('medicines')}>💊 Medicines</button>
        <button className={tab === 'orders'    ? 'active' : ''} onClick={() => setTab('orders')}>📦 Orders</button>
      </div>

      {/* ── MEDICINES TAB ── */}
      {tab === 'medicines' && (
        <>
          <div className="r-tab-header">
            <p>{medicines.length} medicines listed</p>
            <button className="btn btn-primary" onClick={openAdd}>+ Add Medicine</button>
          </div>

          {showForm && (
            <div className="med-form card fade-up">
              <h3>{editing ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <form onSubmit={handleSubmit} className="med-form-grid">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input className="form-control" value={form.name} onChange={set('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Salt Composition *</label>
                  <input className="form-control" value={form.salt_composition} onChange={set('salt_composition')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Manufacturer *</label>
                  <input className="form-control" value={form.manufacturer} onChange={set('manufacturer')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input className="form-control" value={form.category} onChange={set('category')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-control" type="number" step="0.01" value={form.price} onChange={set('price')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">MRP (₹) *</label>
                  <input className="form-control" type="number" step="0.01" value={form.mrp} onChange={set('mrp')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Qty</label>
                  <input className="form-control" type="number" value={form.stock_qty} onChange={set('stock_qty')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select className="form-control" value={form.unit} onChange={set('unit')}>
                    {['strip', 'bottle', 'tube', 'sachet', 'vial', 'tablet', 'capsule'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={set('description')} rows={2} />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.requires_rx} onChange={set('requires_rx')} />
                    <span style={{ fontWeight: 600 }}>Requires Prescription</span>
                  </label>
                </div>
                <div style={{ gridColumn: '1/-1', display: 'flex', gap: 12 }}>
                  <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add Medicine'}</button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Salt</th><th>Price</th><th>MRP</th><th>Stock</th><th>Rx</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.name}</strong></td>
                      <td style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{m.salt_composition}</td>
                      <td>₹{m.price}</td>
                      <td><s>₹{m.mrp}</s></td>
                      <td>
                        <button className={`badge ${m.stock_qty < 10 ? 'badge-coral' : 'badge-green'}`}
                          onClick={() => handleStock(m.id, m.stock_qty)} title="Click to update">
                          {m.stock_qty} ✏️
                        </button>
                      </td>
                      <td>{m.requires_rx ? <span className="badge badge-amber">Yes</span> : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── ORDERS TAB ── */}
      {tab === 'orders' && (
        <>
          <div className="r-tab-header"><p>{orders.length} orders received</p></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th><th>Update</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#ORD-{o.id.toString().padStart(5,'0')}</strong></td>
                    <td>{o.user_name}<br /><small style={{ color: 'var(--ink-soft)' }}>{o.user_email}</small></td>
                    <td>₹{o.total_amount}</td>
                    <td><span className="badge badge-teal">{o.status}</span></td>
                    <td>{new Date(o.placed_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <select className="form-control" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                        value={o.status} onChange={e => handleStatus(o.id, e.target.value)}
                        disabled={['delivered','cancelled'].includes(o.status)}>
                        {['confirmed','packed','shipped','delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
