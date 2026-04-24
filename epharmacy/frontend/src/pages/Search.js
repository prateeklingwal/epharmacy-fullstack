import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMedicines, getCategories } from '../api';
import MedicineCard from '../components/MedicineCard';
import './Search.css';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const q        = searchParams.get('q')        || '';
  const category = searchParams.get('category') || '';

  const [medicines,   setMedicines]  = useState([]);
  const [categories,  setCategories] = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [pagination,  setPagination] = useState({ total: 0, page: 1, limit: 12 });
  const [activeCategory, setActiveCategory] = useState(category);
  const [sort, setSort] = useState('default');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { q, page, limit: 12 };
      if (activeCategory) params.category = activeCategory;
      const { data } = await searchMedicines(params);
      let results = data.data;
      if (sort === 'price_asc')  results = [...results].sort((a, b) => a.price - b.price);
      if (sort === 'price_desc') results = [...results].sort((a, b) => b.price - a.price);
      setMedicines(results);
      setPagination(data.pagination);
    } finally { setLoading(false); }
  }, [q, activeCategory, sort]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data.data));
  }, []);

  const setPage = p => load(p);

  return (
    <div className="search-page page-container">
      {/* Header */}
      <div className="search-header fade-up">
        <div>
          <h1 className="section-title">
            {q ? `Results for "${q}"` : activeCategory || 'All Medicines'}
          </h1>
          <p className="section-sub">{pagination.total} medicines found</p>
        </div>
        <div className="search-controls">
          <select className="form-control" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto' }}>
            <option value="default">Sort: Relevance</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>
      </div>

      <div className="search-layout">
        {/* Sidebar */}
        <aside className="search-sidebar">
          <div className="card" style={{ padding: 20 }}>
            <h3 className="filter-title">Categories</h3>
            <div className="filter-list">
              <button
                className={`filter-item ${!activeCategory ? 'active' : ''}`}
                onClick={() => setActiveCategory('')}
              >All</button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results */}
        <main className="search-results">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : medicines.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No medicines found</h3>
              <p>Try a different name or salt composition</p>
              <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/search?q=')}>
                Browse All
              </button>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {medicines.map(m => <MedicineCard key={m.id} medicine={m} />)}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="pagination">
                  {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1)
                    .map(p => (
                      <button
                        key={p}
                        className={`page-btn ${pagination.page === p ? 'active' : ''}`}
                        onClick={() => setPage(p)}
                      >{p}</button>
                    ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
