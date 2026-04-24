import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getMedicine } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './MedicineDetail.css';

export default function MedicineDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const { addItem } = useCart();

  const [medicine, setMedicine] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [qty, setQty]           = useState(1);
  const [added, setAdded]       = useState(false);

  useEffect(() => {
    setLoading(true);
    getMedicine(id)
      .then(r => setMedicine(r.data.data))
      .catch(() => navigate('/search?q='))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async () => {
    if (!user) { navigate('/login'); return; }
    await addItem(medicine.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!medicine) return null;

  const discount = medicine.mrp > 0
    ? Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100) : 0;

  return (
    <div className="med-detail page-container fade-up">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/search?q=">Medicines</Link> / {medicine.name}
      </div>

      <div className="med-detail-grid">
        {/* Left – image */}
        <div className="med-detail-img-wrap card">
          {medicine.image_url
            ? <img src={medicine.image_url} alt={medicine.name} className="med-detail-img" />
            : <div className="med-detail-placeholder">💊</div>
          }
          {discount > 0 && <div className="md-badge-discount">{discount}% OFF</div>}
        </div>

        {/* Right – info */}
        <div className="med-detail-info">
          {medicine.requires_rx && (
            <div className="rx-alert">
              ⚠️ Prescription Required — Upload your Rx at checkout
            </div>
          )}

          <span className="badge badge-teal">{medicine.category || 'General'}</span>
          <h1 className="md-name">{medicine.name}</h1>
          <p className="md-salt">{medicine.salt_composition}</p>

          <div className="md-meta-row">
            <div className="md-meta-item">
              <span className="md-meta-label">Manufacturer</span>
              <span className="md-meta-val">{medicine.manufacturer}</span>
            </div>
            <div className="md-meta-item">
              <span className="md-meta-label">Store</span>
              <span className="md-meta-val">{medicine.store_name}</span>
            </div>
            <div className="md-meta-item">
              <span className="md-meta-label">Unit</span>
              <span className="md-meta-val">{medicine.unit}</span>
            </div>
            <div className="md-meta-item">
              <span className="md-meta-label">Stock</span>
              <span className={`md-meta-val ${medicine.stock_qty < 20 ? 'low' : ''}`}>
                {medicine.stock_qty} available
              </span>
            </div>
          </div>

          {medicine.description && (
            <div className="md-description">
              <h4>About this medicine</h4>
              <p>{medicine.description}</p>
            </div>
          )}

          {/* Price & buy */}
          <div className="md-price-block">
            <div className="md-price-row">
              <span className="md-price">₹{medicine.price}</span>
              {medicine.mrp !== medicine.price && (
                <span className="md-mrp">MRP ₹{medicine.mrp}</span>
              )}
              {discount > 0 && <span className="badge badge-coral">{discount}% off</span>}
            </div>

            {medicine.stock_qty > 0 ? (
              <div className="md-buy-row">
                <div className="qty-control">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(q => Math.min(medicine.stock_qty, q + 1))}>+</button>
                </div>
                <button
                  className={`btn btn-primary btn-lg ${added ? 'added' : ''}`}
                  onClick={handleAdd}
                >
                  {added ? '✓ Added to Cart' : '🛒 Add to Cart'}
                </button>
              </div>
            ) : (
              <div className="out-of-stock-msg">😞 Out of Stock</div>
            )}
          </div>
        </div>
      </div>

      {/* Alternatives */}
      {medicine.alternatives?.length > 0 && (
        <section className="alternatives">
          <h2 className="section-title">Alternative Medicines</h2>
          <p className="section-sub">Same salt composition — possibly cheaper</p>
          <div className="alt-grid">
            {medicine.alternatives.map(alt => (
              <Link to={`/medicine/${alt.id}`} key={alt.id} className="alt-card card">
                <div className="alt-icon">💊</div>
                <div className="alt-info">
                  <div className="alt-name">{alt.name}</div>
                  <div className="alt-mfr">{alt.manufacturer}</div>
                  <div className="alt-store">{alt.store_name}</div>
                </div>
                <div className="alt-price">
                  <span className="alt-p">₹{alt.price}</span>
                  <span className={`badge ${alt.stock_qty > 0 ? 'badge-green' : 'badge-coral'}`}>
                    {alt.stock_qty > 0 ? 'In stock' : 'OOS'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
