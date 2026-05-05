import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logoutUser, getProducts, getRecommendations } from '../api/api';
import ProfileModal       from '../components/ProfileModal';
import OrdersModal        from '../components/OrdersModal';
import AIDescriptionModal from '../components/AIDescriptionModal';
import './auth.css';

const CATEGORY_EMOJIS = {
  Electronics: '🎧', Accessories: '👜', Footwear: '👟',
  Appliances: '☕', Sports: '🧘', Home: '💡', Bags: '🎒',
  Clothing: '👕', Other: '📦',
};

export default function HomePage({ user, onLogout, cart, setCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef  = useRef(null);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

  const [menuOpen,        setMenuOpen]        = useState(false);
  const [profileOpen,     setProfileOpen]     = useState(false);
  const [ordersOpen,      setOrdersOpen]      = useState(false);
  const [aiDescOpen,      setAiDescOpen]      = useState(false);
  const [activeCategory,  setActiveCategory]  = useState(null);
  const [currentUser,     setCurrentUser]     = useState(user);

  const [products,         setProducts]         = useState([]);
  const [fetching,         setFetching]         = useState(true);
  const [searchQuery,      setSearchQuery]       = useState('');
  const [recs,             setRecs]             = useState([]);
  const [recsFetching,     setRecsFetching]     = useState(true);
  const [showAllRecs,      setShowAllRecs]      = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const fetchProducts = useCallback(async () => {
    setFetching(true);
    try {
      const res = await getProducts();
      setProducts(res.data.results ?? res.data);
    } catch {
      console.error('Failed to load products');
    } finally {
      setFetching(false);
    }
  }, []);

  const fetchRecs = useCallback(async () => {
    setRecsFetching(true);
    try {
      const res = await getRecommendations(8);
      setRecs(res.data);
    } catch {
      console.error('Failed to load recommendations');
    } finally {
      setRecsFetching(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  // Auto-open orders modal if redirected from order confirmation
  useEffect(() => {
    if (location.state?.openOrders) {
      setOrdersOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    onLogout();
    navigate('/');
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
  };

  const initials  = currentUser.first_name
    ? (currentUser.first_name[0] + (currentUser.last_name?.[0] || '')).toUpperCase()
    : currentUser.email.slice(0, 2).toUpperCase();
  const firstName = currentUser.first_name || currentUser.email.split('@')[0];

  const getEmoji = (p) => CATEGORY_EMOJIS[p.category_name] || '📦';

  const visibleProducts = products.filter(p => {
    const matchesCategory = !activeCategory || p.category_name === activeCategory;
    const matchesSearch   = !searchQuery    ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const menuItems = [
    { icon: '🛒', label: `Cart (${cartCount})`,   action: () => { navigate('/cart'); setMenuOpen(false); } },
    { icon: '👤', label: 'Edit Profile',           action: () => { setProfileOpen(true); setMenuOpen(false); } },
    { icon: '📦', label: 'Track Orders',           action: () => { setOrdersOpen(true); setMenuOpen(false); } },
    ...(currentUser.role === 'seller' ? [{
      icon: '✍️', label: 'AI Description Generator',
      action: () => { navigate('/generate-description'); setMenuOpen(false); },
    }] : []),
    { icon: '🚪', label: 'Log out', action: handleLogout, danger: true },
  ];

  return (
    <div className="home page">

      {/* ── Sticky Nav ─────────────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="nav-logo" style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} />
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

          <span className={`role-badge ${currentUser.role}`}>
            {currentUser.role === 'customer' ? '🛍️' : currentUser.role === 'seller' ? '🏪' : '⚙️'} {currentUser.role}
          </span>

          <div className="user-pill-wrapper" ref={menuRef}>
            <div className="user-pill" onClick={() => setMenuOpen(o => !o)}>
              <div className="user-pill-avatar">{initials}</div>
              {firstName}
              <span className="pill-caret">{menuOpen ? '▲' : '▼'}</span>
            </div>

            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">{initials}</div>
                  <div>
                    <div className="user-dropdown-name">{currentUser.first_name} {currentUser.last_name}</div>
                    <div className="user-dropdown-email">{currentUser.email}</div>
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                {menuItems.map((item, i) => (
                  <button key={i}
                    className={`user-dropdown-item ${item.danger ? 'danger' : ''}`}
                    onClick={item.action}>
                    <span className="dropdown-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Search ────────────────────────────────────────────────────── */}
      <div className="home-hero">
        <h1 className="home-greeting">
          Good {greeting}, <em>{firstName}.</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>What are you looking for today?</p>
        <div className="home-search">
          <input
            placeholder="Search products, categories…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveCategory(null); }}
          />
          <button onClick={() => setSearchQuery('')}>
            {searchQuery ? 'Clear' : 'Search'}
          </button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="home-main">

        {/* ── Recommended for You ───────────────────────────────────────── */}
        <div className="rec-section">
          <div className="rec-dots" />

          <div className="rec-header">
            <div>
              <div className="rec-badge">
                <span className="rec-badge-dot" />
                AI Powered
              </div>
              <h2 className="rec-title">Picked for <em>You</em></h2>
              <p className="rec-subtitle">Personalised by AI · Based on your browsing &amp; purchase history</p>
            </div>
            {recs.length > 4 && (
              <button className="rec-view-all" onClick={() => setShowAllRecs(v => !v)}>
                {showAllRecs ? '↑ Show less' : 'View all →'}
              </button>
            )}
          </div>

          {recsFetching ? (
            <div className="rec-shimmer-grid">
              {[...Array(4)].map((_, i) => <div key={i} className="rec-shimmer-card" />)}
            </div>
          ) : recs.length === 0 ? (
            <div className="rec-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <strong>No recommendations yet</strong><br />
              Browse a few products and we'll personalise this section for you.
            </div>
          ) : (
            <div className={`rec-grid${showAllRecs ? ' expanded' : ''}`}>
              {(showAllRecs ? recs : recs.slice(0, 4)).map((p) => (
                <div
                  key={p.id}
                  className="rec-card"
                  onClick={() => navigate(`/product/${p.id}`)}
                >
                  <div className="rec-card-img">
                    {p.image
                      ? <img
                          src={p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`}
                          alt={p.name}
                        />
                      : getEmoji(p)
                    }
                    {p.category_name && (
                      <span className="rec-card-cat">{p.category_name}</span>
                    )}
                  </div>
                  <div className="rec-card-body">
                    <div className="rec-card-name">{p.name}</div>
                    <div className="rec-card-footer">
                      <div className="rec-card-price">${parseFloat(p.price).toFixed(2)}</div>
                      <div className="rec-card-rating">{p.avg_rating > 0 ? `${p.avg_rating} ★` : 'No reviews yet'}</div>
                      <div onClick={e => e.stopPropagation()}>
                        {p.stock > 0 ? (
                          <button className="rec-card-btn" onClick={() => addToCart(p)}>
                            + Add to Cart
                          </button>
                        ) : (
                          <button className="rec-card-btn" disabled>Out of Stock</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Seller shortcut */}
        {currentUser.role === 'seller' && (
          <div style={{
            background: 'rgba(201,149,42,0.08)', border: '1.5px solid rgba(201,149,42,0.25)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>✍️ AI Description Generator</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Enter product details and let AI write your listing description instantly.
              </div>
            </div>
            <button className="btn btn-gold" onClick={() => setAiDescOpen(true)} style={{ whiteSpace: 'nowrap' }}>
              Try it →
            </button>
          </div>
        )}

        {/* Products grid */}
        <div className="section-header">
          <h2 className="section-title">
            {activeCategory ? `${activeCategory} Products` : searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
          </h2>
          <span className="section-link" style={{ cursor: 'pointer' }} onClick={() => { setActiveCategory(null); setSearchQuery(''); }}>
            {(activeCategory || searchQuery) ? 'Clear filter →' : ''}
          </span>
        </div>

        {fetching ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 20, marginBottom: 32 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                height: 260, borderRadius: 14, border: '1px solid var(--border)',
                background: 'linear-gradient(90deg, #f5f0e8 25%, #fffdf7 50%, #f5f0e8 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No products found</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>Try a different search or category</div>
          </div>
        ) : (
          <div className="products-grid">
            {visibleProducts.map((p, i) => (
              <div className="product-card" key={p.id}
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => navigate(`/product/${p.id}`)}>


                <div className="product-img">
                  {p.image
                    ? <img
                        src={p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`}
                        alt={p.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    : getEmoji(p)
                  }
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

                <div style={{ padding: '8px 14px 14px' }} onClick={e => e.stopPropagation()}>
                  {p.stock > 0 ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: 13, padding: '8px 0' }}
                      onClick={() => addToCart(p)}>
                      + Add to Cart
                    </button>
                  ) : (
                    <button
                      disabled
                      style={{
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

        {/* Categories */}
        <div className="section-header">
          <h2 className="section-title">Browse Categories</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          {['Electronics', 'Footwear', 'Accessories', 'Home', 'Sports', 'Bags', 'Appliances'].map(c => (
            <button key={c}
              className="btn btn-ghost"
              style={{
                fontSize: 13,
                background:  activeCategory === c ? 'var(--gold)' : '',
                color:       activeCategory === c ? '#fff' : '',
                borderColor: activeCategory === c ? 'var(--gold)' : '',
              }}
              onClick={() => { setActiveCategory(activeCategory === c ? null : c); setSearchQuery(''); }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {profileOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
      {ordersOpen  && <OrdersModal        onClose={() => setOrdersOpen(false)} />}
      {aiDescOpen  && <AIDescriptionModal onClose={() => setAiDescOpen(false)} />}
    </div>
  );
}
