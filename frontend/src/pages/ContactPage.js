import React from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';

export default function ContactPage() {
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

      <h1 style={{ marginBottom: 16 }}>Contact Us</h1>
      <p style={{ maxWidth: 760, fontSize: 16, lineHeight: 1.65, color: 'var(--muted)' }}>
        We’re here to help. Whether you’re shopping or selling, please reach out with any questions,
        feedback, or support requests.
      </p>

      <div style={{ display: 'grid', gap: 20, marginTop: 32 }}>
        <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 16 }}>
          <h2>Customer Support</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            Email: <a href="mailto:support@shopai.com">support@shopai.com</a><br />
            Phone: <a href="tel:+18001234567">+1 (800) 123-4567</a>
          </p>
        </div>

        <div style={{ padding: 24, border: '1px solid var(--border)', borderRadius: 16 }}>
          <h2>Office Address</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
            123 AI Commerce Street<br />
            Suite 400<br />
            Virtual City, VC 12345
          </p>
        </div>
      </div>
    </div>
  );
}
