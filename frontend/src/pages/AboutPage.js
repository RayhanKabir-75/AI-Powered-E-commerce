import React from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
      <button
        className="link-btn"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 24 }}
      >
        ← Back
      </button>

      <h1 style={{ marginBottom: 16 }}>About Us</h1>
      <p style={{ maxWidth: 760, fontSize: 16, lineHeight: 1.65, color: 'var(--muted)' }}>
        Welcome to ShopAI — a smarter marketplace built for both customers and sellers.
        We combine AI-powered shopping tools, product discovery, and seller support in one place.
      </p>

      <div style={{ display: 'grid', gap: 20, marginTop: 32 }}>
        <div>
          <h2>Our Mission</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            We help customers find the best products faster, while giving sellers powerful tools to
            manage listings, grow sales, and write better product descriptions using AI.
          </p>
        </div>

        <div>
          <h2>For Customers</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            Browse personalized recommendations, save favorites, and shop with confidence from
            curated sellers. Our chatbot can help you discover products, compare options, and
            answer questions while you explore.
          </p>
        </div>

        <div>
          <h2>For Sellers</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            Create, manage, and promote your store with simple tools. Add products quickly,
            track inventory, and use AI-powered description assistance to make your listings stand out.
          </p>
        </div>
      </div>
    </div>
  );
}
