import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './MedicineCard.css';

export default function MedicineCard({ medicine }) {
  const { addItem } = useCart();
  const { user }    = useAuth();
  const navigate    = useNavigate();

  const discount = medicine.mrp > 0
    ? Math.round(((medicine.mrp - medicine.price) / medicine.mrp) * 100)
    : 0;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    addItem(medicine.id, 1);
  };

  const outOfStock = medicine.stock_qty === 0;

  return (
    <Link to={`/medicine/${medicine.id}`} className="med-card fade-up">
      <div className="med-card-img">
        {medicine.image_url
          ? <img src={medicine.image_url} alt={medicine.name} />
          : <div className="med-card-placeholder">💊</div>
        }
        {discount > 0 && <span className="med-discount">{discount}% OFF</span>}
        {medicine.requires_rx && <span className="med-rx">Rx</span>}
      </div>

      <div className="med-card-body">
        <p className="med-category">{medicine.category || 'General'}</p>
        <h3 className="med-name">{medicine.name}</h3>
        <p className="med-salt">{medicine.salt_composition}</p>
        <p className="med-mfr">by {medicine.manufacturer}</p>

        <div className="med-price-row">
          <span className="med-price">₹{medicine.price}</span>
          {medicine.mrp !== medicine.price && (
            <span className="med-mrp">₹{medicine.mrp}</span>
          )}
        </div>

        <div className="med-footer">
          <span className={`badge ${outOfStock ? 'badge-coral' : 'badge-green'}`}>
            {outOfStock ? 'Out of stock' : `${medicine.stock_qty} left`}
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            {outOfStock ? 'Unavailable' : '+ Add'}
          </button>
        </div>
      </div>
    </Link>
  );
}
