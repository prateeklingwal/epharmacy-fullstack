import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, retailer, logout } = useAuth();
  const { itemCount, loadCart }    = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (user) loadCart();
  }, [user]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const handleSearch = e => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner page-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-pill">Rx</span>
          <span className="logo-text">PharmaEase</span>
        </Link>

        {/* Search */}
        {!retailer && (
          <form className="navbar-search" onSubmit={handleSearch}>
            <span className="search-icon">🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search medicines, salts, brands…"
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
        )}

        {/* Actions */}
        <div className="navbar-actions">
          {retailer ? (
            <>
              <Link to="/retailer" className="nav-link">Dashboard</Link>
              <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
            </>
          ) : user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">Admin</Link>
              )}
              <Link to="/orders" className="nav-link">Orders</Link>
              <Link to="/cart" className="nav-link cart-link">
                🛒
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
              <div className="nav-avatar" onClick={() => setMenu(m => !m)}>
                {user.name?.charAt(0).toUpperCase()}
                {menu && (
                  <div className="dropdown fade-in">
                    <div className="dropdown-user">{user.name}</div>
                    <div className="dropdown-email">{user.email}</div>
                    <hr />
                    <Link to="/prescriptions" className="dropdown-item">📋 My Prescriptions</Link>
                    <Link to="/orders"        className="dropdown-item">📦 My Orders</Link>
                    <button onClick={logout}  className="dropdown-item danger">🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login"  className="btn btn-outline btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
