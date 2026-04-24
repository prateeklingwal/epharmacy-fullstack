import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMedicines, getCategories } from '../api';
import MedicineCard from '../components/MedicineCard';
import './Home.css';

const CATEGORY_ICONS = {
  'Analgesic': '🩹', 'Antibiotic': '💊', 'Antidiabetic': '🩸',
  'Antacid': '🫙', 'Antiallergic': '🌿', 'Antihypertensive': '❤️',
  'Vitamin': '✨', 'Antilipemic': '🫀', 'Antiasthmatic': '🌬️',
  'Neuropathic': '🧠',
};

export default function Home() {
  const [q, setQ]             = useState('');
  const [categories, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCategories(), searchMedicines({ q: '', limit: 8 })])
      .then(([catRes, medRes]) => {
        setCats(catRes.data.data);
        setFeatured(medRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="page-container hero-content">
          <div className="hero-text fade-up">
            <span className="hero-eyebrow">Trusted Online Pharmacy</span>
            <h1 className="hero-title">
              Medicines delivered<br />
              <span className="hero-accent">right to your door</span>
            </h1>
            <p className="hero-sub">
              Search 10,000+ medicines. Compare alternatives. Get genuine products
              from licensed pharmacies across India.
            </p>

            <form className="hero-search" onSubmit={handleSearch}>
              <span className="hs-icon">🔍</span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by medicine name, salt, brand…"
                className="hs-input"
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="hero-pills">
              {['Paracetamol', 'Azithromycin', 'Metformin', 'Vitamin D'].map(t => (
                <button key={t} className="hero-pill" onClick={() => navigate(`/search?q=${t}`)}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-visual fade-up">
            <div className="hero-card hc-1">
              <div>
                <div className="hc-num">30k+</div>
                <div className="hc-label">Medicines</div>
              </div>
            </div>
            <div className="hero-card hc-2">
              <div>
                <div className="hc-num">500+</div>
                <div className="hc-label">Pharmacies</div>
              </div>
            </div>
            <div className="hero-card hc-3">
              <div>
                <div className="hc-num">24hr</div>
                <div className="hc-label">Delivery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-strip">
        <div className="page-container features-inner">
          {[
            { title: 'Genuine Medicines', desc: 'All licensed & verified' },
            { title: 'Best Price', desc: 'Compare & save up to 40%' },
            { title: 'Rx Upload', desc: 'Simple prescription upload' },
            { title: 'Alternatives', desc: 'Find same-salt options' },
          ].map(f => (
            <div key={f.title} className="feature-item">
              <span className="feature-icon">{f.icon}</span>
              <div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section page-container">
        <h2 className="section-title">Browse by Category</h2>
        <p className="section-sub">Find what you need quickly</p>
        <div className="cat-grid">
          {categories.map(cat => (
            <button
              key={cat}
              className="cat-chip"
              onClick={() => navigate(`/search?category=${encodeURIComponent(cat)}`)}
            >
              <span className="cat-icon">{CATEGORY_ICONS[cat] || '🔬'}</span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Featured medicines ── */}
      <section className="section page-container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Featured Medicines</h2>
            <p className="section-sub">Popular & frequently ordered</p>
          </div>
          <button className="btn btn-outline" onClick={() => navigate('/search?q=')}>
            View All →
          </button>
        </div>

        {loading
          ? <div className="spinner-wrap"><div className="spinner" /></div>
          : <div className="grid-4">{featured.map(m => <MedicineCard key={m.id} medicine={m} />)}</div>
        }
      </section>

      {/* ── CTA banner ── */}
      <section className="cta-section page-container">
        <div className="cta-card">
          <div className="cta-text">
            <h2>Are you a Pharmacist?</h2>
            <p>Join PharmaEase and reach thousands of customers. List your medicines online and manage orders seamlessly.</p>
          </div>
          <a href="/retailer-signup" className="btn btn-primary btn-lg">Register Your Pharmacy →</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="page-container footer-inner">
          <div>
            <div className="navbar-logo" style={{ marginBottom: 12 }}>
              <span className="logo-pill">Rx</span>
              <span className="logo-text">PharmaEase</span>
            </div>
            <p style={{ color: '#8ba8a5', fontSize: 13 }}>India's trusted online pharmacy platform.</p>
          </div>
          <div className="footer-links">
            <a href="/search?q=">Medicines</a>
            <a href="/login">Login</a>
            <a href="/signup">Sign Up</a>
            <a href="/retailer-signup">Partner With Us</a>
          </div>
        </div>
        <div className="footer-copy">© 2025 PharmaEase. All rights reserved.</div>
      </footer>
    </div>
  );
}
