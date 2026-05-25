import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoMark from '../components/LogoMark';
import { getWishlist, toggleWishlist, getMediaUrl } from '../api/api';
import './auth.css';

const CATEGORY_EMOJIS = {
  Electronics: '🎧', Accessories: '👜', Footwear: '👟',
  Appliances: '☕', Sports: '🧘', Home: '💡', Bags: '🎒',
  Clothing: '👕', Other: '📦',
};

export default function WishlistPage({ cart, setCart, wishlist, onToggle }) {
  const navigate  = useNavigate();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    getWishlist()
      .then(res => setItems(res.data.results ?? res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    await onToggle(productId);
    setItems(prev => prev.filter(i => i.product.id !== productId));
  };

  const addToCart = (e, product) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

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
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/home')}>
            ← Back to Shop
          </button>
          <button onClick={() => navigate('/cart')} style={{
            position: 'relative', background: 'none', border: '1.5px solid var(--border)',
            borderRadius: 999, padding: '6px 14px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, fontSize: 14, fontFamily: 'inherit',
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
        </div>
      </nav>

      <div className="home-main">
        <div className="section-header" style={{ marginBottom: 24 }}>
          <h2 className="section-title">
            ♥ My Wishlist {!loading && items.length > 0 && `(${items.length})`}
          </h2>
        </div>

        {loading && (
          <div className="products-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{
                height: 280, borderRadius: 14, border: '1px solid var(--border)',
                background: 'linear-gradient(90deg, var(--border) 25%, var(--panel) 50%, var(--border) 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>♡</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--dark)' }}>
              Your wishlist is empty
            </div>
            <div style={{ fontSize: 14, marginBottom: 28 }}>
              Save products you love by clicking the heart icon on any product.
            </div>
            <button className="btn btn-gold" onClick={() => navigate('/home')}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="products-grid">
            {items.map((item, i) => {
              const p = item.product;
              const emoji = CATEGORY_EMOJIS[p.category_name] || '📦';
              return (
                <div
                  key={item.id}
                  className="product-card"
                  style={{ animationDelay: `${0.05 * i}s` }}
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  {/* Image with remove heart */}
                  <div className="product-img" style={{ position: 'relative' }}>
                    {p.image
                      ? <img src={getMediaUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : emoji
                    }
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(p.id); }}
                      title="Remove from wishlist"
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(255,255,255,0.92)', border: 'none',
                        borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
                        fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: '#e74c3c',
                      }}
                    >
                      ♥
                    </button>
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

                  <div style={{ padding: '0 14px 14px' }} onClick={e => e.stopPropagation()}>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
