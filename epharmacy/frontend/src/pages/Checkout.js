import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder, uploadPrescription } from '../api';
import toast from 'react-hot-toast';
import './Checkout.css';

export default function Checkout() {
  const { user }   = useAuth();
  const { cart, loadCart }  = useCart();
  const navigate   = useNavigate();

  const [address,      setAddress]      = useState(user?.address || '');
  const [payMethod,    setPayMethod]    = useState('cod');
  const [rxFile,       setRxFile]       = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const [placing,      setPlacing]      = useState(false);
  const [step,         setStep]         = useState(1);

  useEffect(() => { if (user) loadCart(); }, [user]);

  const needsRx = cart.items.some(i => i.requires_rx);

  const handleRxUpload = async () => {
    if (!rxFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('prescription', rxFile);
      const { data } = await uploadPrescription(fd);
      setPrescriptionId(data.id);
      toast.success('Prescription uploaded!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const handleOrder = async () => {
    if (!address.trim()) { toast.error('Please enter delivery address'); return; }
    if (needsRx && !prescriptionId) { toast.error('Please upload prescription first'); return; }
    setPlacing(true);
    try {
      const { data } = await placeOrder({
        delivery_address: address,
        payment_method:   payMethod,
        prescription_id:  prescriptionId || undefined,
      });
      toast.success('Order placed successfully!');
      navigate(`/orders/${data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  if (!cart.items.length) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page page-container fade-up">
      <h1 className="section-title">Checkout</h1>

      {/* Steps */}
      <div className="steps">
        {['Delivery', 'Prescription', 'Payment', 'Review'].map((s, i) => (
          <div key={s} className={`step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
            <div className="step-dot">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="checkout-layout">
        <div className="checkout-main">
          {/* Step 1 – Address */}
          {step === 1 && (
            <div className="card checkout-card fade-up">
              <h3>📍 Delivery Address</h3>
              <div className="form-group" style={{ marginTop: 20 }}>
                <label className="form-label">Full Address</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House no., Street, Area, City, Pincode"
                />
              </div>
              <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }}
                onClick={() => { if (address.trim()) setStep(2); else toast.error('Enter address'); }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 – Prescription */}
          {step === 2 && (
            <div className="card checkout-card fade-up">
              <h3>📋 Prescription</h3>
              {needsRx ? (
                <div style={{ marginTop: 20 }}>
                  <p className="rx-required-note">
                    ⚠️ Your cart has prescription-required medicines.
                    Please upload a valid prescription.
                  </p>
                  {!prescriptionId ? (
                    <div className="upload-zone">
                      <input type="file" id="rx-file" accept=".jpg,.jpeg,.png,.pdf"
                        onChange={e => setRxFile(e.target.files[0])} style={{ display: 'none' }} />
                      <label htmlFor="rx-file" className="upload-label">
                        <span className="upload-icon">📁</span>
                        <span>{rxFile ? rxFile.name : 'Click to select file (JPG, PNG, PDF)'}</span>
                      </label>
                      {rxFile && (
                        <button className="btn btn-primary" onClick={handleRxUpload} disabled={uploading}>
                          {uploading ? 'Uploading…' : 'Upload Prescription'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="rx-success">✅ Prescription uploaded successfully!</div>
                  )}
                </div>
              ) : (
                <p style={{ marginTop: 16, color: 'var(--ink-soft)' }}>
                  ✅ No prescription required for your cart items.
                </p>
              )}
              <div className="step-btns">
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary"
                  onClick={() => { if (!needsRx || prescriptionId) setStep(3); else toast.error('Upload prescription'); }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 – Payment */}
          {step === 3 && (
            <div className="card checkout-card fade-up">
              <h3>💳 Payment Method</h3>
              <div className="payment-options">
                {[
                  { val: 'cod',    label: 'Cash on Delivery',  icon: '💵', desc: 'Pay when medicine arrives' },
                  { val: 'online', label: 'Online Payment',    icon: '📱', desc: 'UPI, Cards, Netbanking' },
                ].map(opt => (
                  <label key={opt.val} className={`pay-option ${payMethod === opt.val ? 'selected' : ''}`}>
                    <input type="radio" name="pay" value={opt.val}
                      checked={payMethod === opt.val}
                      onChange={() => setPayMethod(opt.val)} />
                    <span className="pay-icon">{opt.icon}</span>
                    <div>
                      <div className="pay-label">{opt.label}</div>
                      <div className="pay-desc">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="step-btns">
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 4 – Review */}
          {step === 4 && (
            <div className="card checkout-card fade-up">
              <h3>📦 Review Order</h3>
              <div className="review-items">
                {cart.items.map(item => (
                  <div key={item.id} className="review-item">
                    <span className="ri-name">{item.name} ×{item.quantity}</span>
                    <span className="ri-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="review-summary">
                <div className="rs-row"><span>Address</span><span>{address}</span></div>
                <div className="rs-row"><span>Payment</span><span>{payMethod === 'cod' ? 'Cash on Delivery' : 'Online'}</span></div>
                <div className="rs-row total"><span>Total</span><span>₹{cart.total}</span></div>
              </div>
              <div className="step-btns">
                <button className="btn btn-outline" onClick={() => setStep(3)}>← Back</button>
                <button className="btn btn-primary btn-lg" onClick={handleOrder} disabled={placing}>
                  {placing ? 'Placing Order…' : '✅ Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cart mini summary */}
        <div className="checkout-sidebar">
          <div className="card" style={{ padding: 20 }}>
            <h4 style={{ marginBottom: 16 }}>Cart ({cart.items.length})</h4>
            {cart.items.map(item => (
              <div key={item.id} className="sidebar-item">
                <span>{item.name}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="sidebar-total">
              <span>Total</span><span>₹{cart.total}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
