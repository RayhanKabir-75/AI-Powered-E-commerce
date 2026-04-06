import React from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-dots" />

      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-dot" />
          ShopAI
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost"   onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>Get started</button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">✦ AI-Powered E-Commerce Platform</div>
        <h1 className="hero-title">
          Shop <em>smarter,</em><br />sell <em>better.</em>
        </h1>
        <p className="hero-sub">
          An AI-enhanced marketplace that personalises every search, auto-generates
          product listings, and keeps customers engaged with a conversational assistant.
        </p>
        <div className="hero-cta">
          <button className="btn btn-gold"    onClick={() => navigate('/signup')}>Start for free →</button>
          <button className="btn btn-outline" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </section>

      <section className="features">
        {[
          { icon: '🤖', title: 'AI Recommendations',  desc: 'Personalised picks based on your browsing and purchase history.' },
          { icon: '✍️', title: 'GenAI Descriptions',  desc: 'Sellers type a few keywords; AI writes the perfect listing.' },
          { icon: '💬', title: 'Smart Chatbot',        desc: 'Ask anything — find products, track orders, get support.' },
          { icon: '📊', title: 'Review Intelligence',  desc: 'NLP summarises hundreds of reviews into one clear verdict.' },
        ].map((f, i) => (
          <div className="feature-item" key={i}>
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-text">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}