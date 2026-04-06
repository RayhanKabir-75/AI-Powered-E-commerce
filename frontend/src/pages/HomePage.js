import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

const PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', cat: 'Electronics', price: 89.99,  rating: '4.8 ★', emoji: '🎧' },
  { id: 2, name: 'Leather Wallet',      cat: 'Accessories', price: 49.99,  rating: '4.6 ★', emoji: '👜' },
  { id: 3, name: 'Running Shoes',       cat: 'Footwear',    price: 129.99, rating: '4.9 ★', emoji: '👟' },
  { id: 4, name: 'Coffee Maker',        cat: 'Appliances',  price: 74.99,  rating: '4.7 ★', emoji: '☕' },
  { id: 5, name: 'Sunglasses',          cat: 'Accessories', price: 39.99,  rating: '4.5 ★', emoji: '🕶️' },
  { id: 6, name: 'Yoga Mat',            cat: 'Sports',      price: 34.99,  rating: '4.8 ★', emoji: '🧘' },
  { id: 7, name: 'Desk Lamp',           cat: 'Home',        price: 55.99,  rating: '4.4 ★', emoji: '💡' },
  { id: 8, name: 'Backpack',            cat: 'Bags',        price: 69.99,  rating: '4.7 ★', emoji: '🎒' },
];

const hour = new Date().getHours();
const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

export default function HomePage({ user, onLogout }) {
  const navigate  = useNavigate();
  const initials  = user.first_name
    ? (user.first_name[0] + (user.last_name?.[0] || '')).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();
  const firstName = user.first_name || user.email.split('@')[0];

  const handleLogout = async () => {
    try { await logoutUser(); } catch (_) {}
    onLogout();
    navigate('/');
  };

  return (
    <div className="home page">
      {/* Sticky nav */}
      <nav className="home-nav">
        <div className="nav-logo" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} /> ShopAI
        </div>
        <div className="home-nav-right">
          <span className={`role-badge ${user.role}`}>
            {user.role === 'customer' ? '🛍️' : user.role === 'seller' ? '🏪' : '⚙️'} {user.role}
          </span>
          <div className="user-pill" onClick={handleLogout} title="Click to log out">
            <div className="user-pill-avatar">{initials}</div>
            {firstName}
          </div>
        </div>
      </nav>

      {/* Hero search */}
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

      <div className="home-main">
        {/* AI banner */}
        <div className="ai-banner">
          <div className="ai-banner-text">
            <h3>🤖 AI Picks for You</h3>
            <p>Based on your browsing history and preferences</p>
          </div>
          <button className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>View all →</button>
        </div>

        {/* Products */}
        <div className="section-header">
          <h2 className="section-title">Recommended Products</h2>
          <span className="section-link">See all →</span>
        </div>
        <div className="products-grid">
          {PRODUCTS.map((p, i) => (
            <div className="product-card" key={p.id} style={{ animationDelay: `${0.05 * i}s` }}>
              <div className="product-img">{p.emoji}</div>
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-cat">{p.cat}</div>
                <div className="product-footer">
                  <div className="product-price">${p.price}</div>
                  <div className="product-rating">{p.rating}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  );
}