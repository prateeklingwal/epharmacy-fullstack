import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import { RequireUser, RequireAdmin, RequireRetailer } from './components/ProtectedRoute';

import Home             from './pages/Home';
import Search           from './pages/Search';
import MedicineDetail   from './pages/MedicineDetail';
import Cart             from './pages/Cart';
import Checkout         from './pages/Checkout';
import { OrdersList, OrderDetail } from './pages/Orders';
import Prescriptions    from './pages/Prescriptions';
import { Login, Signup } from './pages/Auth';
import RetailerDashboard from './pages/RetailerDashboard';
import AdminDashboard    from './pages/AdminDashboard';

import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              },
              success: { iconTheme: { primary: '#00b09b', secondary: '#fff' } },
            }}
          />

          <Navbar />

          <Routes>
            {/* Public */}
            <Route path="/"                element={<Home />} />
            <Route path="/search"          element={<Search />} />
            <Route path="/medicine/:id"    element={<MedicineDetail />} />
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/retailer-signup" element={<Signup />} />

            {/* User */}
            <Route path="/cart"       element={<RequireUser><Cart /></RequireUser>} />
            <Route path="/checkout"   element={<RequireUser><Checkout /></RequireUser>} />
            <Route path="/orders"     element={<RequireUser><OrdersList /></RequireUser>} />
            <Route path="/orders/:id" element={<RequireUser><OrderDetail /></RequireUser>} />
            <Route path="/prescriptions" element={<RequireUser><Prescriptions /></RequireUser>} />

            {/* Retailer */}
            <Route path="/retailer" element={<RequireRetailer><RetailerDashboard /></RequireRetailer>} />

            {/* Admin */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

            {/* 404 */}
            <Route path="*" element={
              <div className="page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <div style={{ fontSize: 80 }}>🔍</div>
                <h2 style={{ marginTop: 20, fontFamily: 'var(--font-head)' }}>Page Not Found</h2>
                <a href="/" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Go Home</a>
              </div>
            } />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
