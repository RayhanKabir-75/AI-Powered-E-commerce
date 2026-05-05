import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProducts, getMediaUrl } from '../api/api';
import LogoMark from '../components/LogoMark';
import './auth.css';

const CATEGORY_EMOJIS = {
  Electronics: '🎧', Accessories: '👜', Footwear: '👟',
  Appliances: '☕', Sports: '🧘', Home: '💡', Bags: '🎒',
  Clothing: '👕', Other: '📦',
};

export default function SearchResultsPage({ cart, setCart }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [inputValue,  setInputValue]  = useState(query);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const fetchResults = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await getProducts(q ? { search: q } : {});
      setProducts(res.data.results ?? res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setInputValue(query);
    fetchResults(query);
  }, [query, fetchResults]);

  const doSearch = () => {
    const q = inputValue.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const addToCart = (e, p) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(i => i.id === p.id);
      if (existing) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const getEmoji = (p) => CATEGORY_EMOJIS[p.category_name] || '📦';

  return (
    <div className="home page">

      {/* ── Nav ── */}
      <nav className="home-nav">
        <div className="nav-logo" onClick={() => navigate('/home')} style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        }}>
          <LogoMark size={34} />
          ShopAI
        </div>

        <div className="home-nav-right">
          <button onClick={() => navigate('/cart')} style={{
            position: 'relative', background: 'none', border: '1.5px solid var(--border)',
            borderRadius: 999, padding: '6px 14px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, fontSize: 14, fontFamily: 'inherit', transition: 'all 0.2s',
          }}>
            🛒
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6, background: 'var(--gold)',
                color: '#fff', borderRadius: '50%', width: 18, height: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
              }}>{cartCount}</span>
            )}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/home')}>
            ← Home
          </button>
        </div>
      </nav>

      {/* ── Search bar ── */}
      <div className="home-hero" style={{ paddingBottom: 32 }}>
        <div className="home-search">
          <input
            autoFocus
            placeholder="Search products, categories…"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
          />
          <button onClick={doSearch}>Search</button>
        </div>
        {!loading && query && (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {products.length} result{products.length !== 1 ? 's' : ''} for{' '}
            <strong style={{ color: 'var(--dark)' }}>"{query}"</strong>
          </p>
        )}
      </div>

      {/* ── Results ── */}
      <div className="home-main">
        <div className="section-header">
          <h2 className="section-title">
            {loading ? 'Searching…' : query ? `Results for "${query}"` : 'All Products'}
          </h2>
        </div>

        {loading ? (
          <div className="products-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                height: 260, borderRadius: 14, border: '1px solid var(--border)',
                background: 'linear-gradient(90deg, var(--border) 25%, var(--panel) 50%, var(--border) 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--dark)' }}>
              No results for "{query}"
            </div>
            <div style={{ fontSize: 14, marginBottom: 28 }}>Try a different keyword or browse all products.</div>
            <button className="btn btn-gold" onClick={() => navigate('/home')}>Browse All Products</button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="product-card"
                style={{ animationDelay: `${0.04 * i}s` }}
                onClick={() => navigate(`/product/${p.id}`)}
              >
                <div className="product-img">
                  {p.image
                    ? <img
                        src={getMediaUrl(p.image)}
                        alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    : getEmoji(p)}
                </div>
                <div className="product-info">
                  <div className="product-name">{p.name}</div>
                  <div className="product-cat">{p.category_name || '—'}</div>
                  <div className="product-footer">
                    <div className="product-price">${parseFloat(p.price).toFixed(2)}</div>
                    <div className="product-rating">
                      {p.avg_rating > 0 ? `${p.avg_rating} ★` : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0 14px 14px' }}>
                  {p.stock > 0 ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: 13, padding: '8px 0' }}
                      onClick={e => addToCart(e, p)}
                    >
                      + Add to Cart
                    </button>
                  ) : (
                    <button disabled style={{
                      width: '100%', fontSize: 13, padding: '8px 0',
                      background: 'var(--border)', border: 'none', borderRadius: 8,
                      color: 'var(--muted)', cursor: 'not-allowed',
                    }}>
                      Out of Stock
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
