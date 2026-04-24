import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userLogin, retailerLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export function Login() {
  const { loginUser, loginRetailer } = useAuth();
  const navigate  = useNavigate();
  const [tab, setTab] = useState('user');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'user') {
        const { data } = await userLogin(form);
        loginUser(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(data.user.role === 'admin' ? '/admin' : '/');
      } else {
        const { data } = await retailerLogin(form);
        loginRetailer(data.token, data.retailer);
        toast.success(`Welcome, ${data.retailer.name}!`);
        navigate('/retailer');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card fade-up">
        <div className="auth-logo">
          <span className="logo-pill">Rx</span>
          <span className="logo-text">PharmaEase</span>
        </div>
        <h2 className="auth-title">Welcome back</h2>

        <div className="auth-tabs">
          <button className={tab === 'user' ? 'active' : ''} onClick={() => setTab('user')}>Customer</button>
          <button className={tab === 'retailer' ? 'active' : ''} onClick={() => setTab('retailer')}>Pharmacy</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('user');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', store_name: '', store_address: '', license_no: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'user') {
        const { userSignup } = await import('../api');
        await userSignup(form);
        toast.success('Account created! Please login.');
        navigate('/login');
      } else {
        const { retailerSignup } = await import('../api');
        await retailerSignup(form);
        toast.success('Registered! Awaiting admin approval.');
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card fade-up" style={{ maxWidth: 500 }}>
        <div className="auth-logo">
          <span className="logo-pill">Rx</span>
          <span className="logo-text">PharmaEase</span>
        </div>
        <h2 className="auth-title">Create account</h2>

        <div className="auth-tabs">
          <button className={tab === 'user' ? 'active' : ''} onClick={() => setTab('user')}>Customer</button>
          <button className={tab === 'retailer' ? 'active' : ''} onClick={() => setTab('retailer')}>Pharmacy</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={form.name} onChange={set('name')} placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="10-digit number" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" required minLength={6} />
          </div>

          {tab === 'user' && (
            <div className="form-group">
              <label className="form-label">Default Address</label>
              <textarea className="form-control" value={form.address} onChange={set('address')} placeholder="Your delivery address" rows={2} />
            </div>
          )}

          {tab === 'retailer' && (
            <>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input className="form-control" value={form.store_name} onChange={set('store_name')} placeholder="Your pharmacy name" required />
              </div>
              <div className="form-group">
                <label className="form-label">Drug License Number</label>
                <input className="form-control" value={form.license_no} onChange={set('license_no')} placeholder="DL-XXX-XXXXXX" required />
              </div>
              <div className="form-group">
                <label className="form-label">Store Address</label>
                <textarea className="form-control" value={form.store_address} onChange={set('store_address')} placeholder="Store address" rows={2} />
              </div>
            </>
          )}

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
