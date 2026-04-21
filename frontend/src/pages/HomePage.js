import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/api';
import ChatbotWidget      from '../components/ChatbotWidget';
import ProfileModal       from '../components/ProfileModal';
import OrdersModal        from '../components/OrdersModal';
import AIDescriptionModal from '../components/AIDescriptionModal';
import ReviewSection      from '../components/ReviewSection';
import './auth.css';

const PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', cat: 'Electronics', price: 89.99,  rating: 4.8, emoji: '🎧' },
  { id: 2, name: 'Leather Wallet',      cat: 'Accessories', price: 49.99,  rating: 4.6, emoji: '👜' },
  { id: 3, name: 'Running Shoes',       cat: 'Footwear',    price: 129.99, rating: 4.9, emoji: '👟' },
  { id: 4, name: 'Coffee Maker',        cat: 'Appliances',  price: 74.99,  rating: 4.7, emoji: '☕' },
  { id: 5, name: 'Sunglasses',          cat: 'Accessories', price: 39.99,  rating: 4.5, emoji: '🕶️' },
  { id: 6, name: 'Yoga Mat',            cat: 'Sports',      price: 34.99,  rating: 4.8, emoji: '🧘' },
  { id: 7, name: 'Desk Lamp',           cat: 'Home',        price: 55.99,  rating: 4.4, emoji: '💡' },
  { id: 8, name: 'Backpack',            cat: 'Bags',        price: 69.99,  rating: 4.7, emoji: '🎒' },
];

const hour     = new Date().getHours();
const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

export default function HomePage({ user, onLogout }) {
  const navigate  = useNavigate();
  const menuRef   = useRef(null);

  // Modal / panel states
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [ordersOpen,   setOrdersOpen]   = useState(false);
  const [aiDescOpen,   setAiDescOpen]   = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // for review modal

  // Local user state — updated when profile is saved
  const [currentUser, setCurrentUser] = useState(user);

  const initials  = currentUser.first_name
    ? (currentUser.first_name[0] + (currentUser.last_name?.[0] || '')).toUpperCase()
    : currentUser.email.slice(0, 2).toUpperCase();
  const firstName = currentUser.first_name || currentUser.email.split('@')[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    onLogout();
    navigate('/');
  };

  // Called by ProfileModal after successful save
  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(prev => ({ ...prev, ...updatedUser }));
    // Also update localStorage so session persists
    localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
  };

  // Dropdown menu items — all now functional
  const menuItems = [
    {
      icon: '👤', label: 'Edit Profile',
      action: () => { setProfileOpen(true); setMenuOpen(false); },
    },
    {
      icon: '📦', label: 'Track Orders',
      action: () => { setOrdersOpen(true); setMenuOpen(false); },
    },
    {
      icon: '💬', label: 'Open Chatbot',
      action: () => { setChatOpen(true); setMenuOpen(false); },
    },
    // Seller-only: AI Description Generator
    ...(currentUser.role === 'seller' ? [{
      icon: '✍️', label: 'AI Description Generator',
      action: () => { setAiDescOpen(true); setMenuOpen(false); },
    }] : []),
    {
      icon: '🚪', label: 'Log out',
      action: handleLogout, danger: true,
    },
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
          <input placeholder="Search products, categories, brands…" />
          <button>Search</button>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="home-main">

        {/* AI banner */}
        <div className="ai-banner">
          <div className="ai-banner-text">
            <h3>🤖 AI Picks for You</h3>
            <p>Based on your browsing history and preferences</p>
          </div>
          <button className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>View all →</button>
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
          <h2 className="section-title">Recommended Products</h2>
          <span className="section-link">See all →</span>
        </div>

        <div className="products-grid">
          {PRODUCTS.map((p, i) => (
            <div className="product-card" key={p.id}
              style={{ animationDelay: `${0.05 * i}s` }}
              onClick={() => setSelectedProduct(selectedProduct?.id === p.id ? null : p)}>
              <div className="product-img">{p.emoji}</div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-cat">{p.cat}</div>
                <div className="product-footer">
                  <div className="product-price">${p.price}</div>
                  <div className="product-rating">{p.rating} ★</div>
                </div>
              </div>
              {selectedProduct?.id === p.id && (
                <div style={{
                  padding: '4px 14px 4px', fontSize: 12,
                  color: 'var(--gold)', fontWeight: 600, background: 'rgba(201,149,42,0.07)',
                }}>
                  ▲ Click again to collapse
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Expanded product — reviews & AI summary */}
        {selectedProduct && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px',
            border: '2px solid var(--gold)', marginBottom: 32,
            animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  {selectedProduct.emoji} {selectedProduct.name}
                </h3>
                <div style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {selectedProduct.cat} · ${selectedProduct.price}
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--muted)' }}>
                ✕
              </button>
            </div>

            {/* Reviews + AI summary — live from backend */}
            <ReviewSection productId={selectedProduct.id} user={currentUser} />
          </div>
        )}

        {/* Categories */}
        <div className="section-header">
          <h2 className="section-title">Browse Categories</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
          {['Electronics', 'Footwear', 'Accessories', 'Home', 'Sports', 'Bags', 'Appliances'].map(c => (
            <button key={c} className="btn btn-ghost" style={{ fontSize: 13 }}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Floating Chatbot ────────────────────────────────────────────────── */}
      <ChatbotWidget open={chatOpen} onToggle={() => setChatOpen(o => !o)} />

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {profileOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
      {ordersOpen && (
        <OrdersModal onClose={() => setOrdersOpen(false)} />
      )}
      {aiDescOpen && (
        <AIDescriptionModal onClose={() => setAiDescOpen(false)} />
      )}
    </div>
  );
}