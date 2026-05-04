import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { placeOrder } from '../api/api';
import './auth.css';

const EMPTY_PAYMENT = { name: '', number: '', expiry: '', cvv: '' };

function formatCardNumber(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

function validatePayment(p) {
  if (!p.name.trim())                          return 'Cardholder name is required.';
  if (p.number.replace(/\s/g, '').length < 16) return 'Enter a valid 16-digit card number.';
  if (p.expiry.length < 5)                     return 'Enter a valid expiry date (MM/YY).';
  const [mm, yy] = p.expiry.split('/').map(Number);
  const now = new Date();
  const exp = new Date(2000 + yy, mm - 1);
  if (mm < 1 || mm > 12 || exp < now)          return 'Card has expired or expiry date is invalid.';
  if (p.cvv.length < 3)                        return 'Enter a valid CVV.';
  return null;
}

export default function CheckoutPage({ setCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [], total = 0, discount = 0, shipping = 0 } = location.state || {};

  const [payment,  setPayment]  = useState(EMPTY_PAYMENT);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  if (!cart.length && !success) {
    return (
      <div className="home page">
        <div style={{ textAlign: 'center', padding: '120px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>No items to checkout.</p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>Back to Shop</button>
        </div>
      </div>
    );
  }

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setError('');
    if (name === 'number') { setPayment(p => ({ ...p, number: formatCardNumber(value) })); return; }
    if (name === 'expiry') { setPayment(p => ({ ...p, expiry: formatExpiry(value) }));     return; }
    if (name === 'cvv')    { setPayment(p => ({ ...p, cvv: value.replace(/\D/g, '').slice(0, 4) })); return; }
    setPayment(p => ({ ...p, [name]: value }));
  };

  const handlePay = async () => {
    const validationError = validatePayment(payment);
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      await placeOrder({
        items: cart.map(item => ({ product_id: item.id, quantity: item.qty })),
      });
      setSuccess(true);
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="home page">
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Payment Successful!
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginBottom: 8 }}>
            Your order has been placed and is now pending.
          </p>
          <p style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 18, marginBottom: 28 }}>
            ${total.toFixed(2)} charged
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/home')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const cardBrand = () => {
    const n = payment.number.replace(/\s/g, '');
    if (n.startsWith('4'))  return '💳 Visa';
    if (n.startsWith('5'))  return '💳 Mastercard';
    if (n.startsWith('37')) return '💳 Amex';
    return '💳';
  };

  return (
    <div className="home page">

      {/* Nav */}
      <nav className="home-nav">
        <div className="nav-logo" style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} />
          ShopAI
        </div>
        <div className="home-nav-right">
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/cart')}>
            ← Back to Cart
          </button>
        </div>
      </nav>

      <div className="home-main" style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 13 }}>
          {['Cart', 'Checkout', 'Payment'].map((step, i) => (
            <React.Fragment key={step}>
              <div style={{
                padding: '4px 14px', borderRadius: 999, fontWeight: 600,
                background: i === 2 ? 'var(--gold)' : i === 1 ? 'rgba(201,149,42,0.15)' : 'var(--border)',
                color:      i === 2 ? '#fff'         : i === 1 ? 'var(--gold)'            : 'var(--muted)',
              }}>{step}</div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: i < 1 ? 'var(--gold)' : 'var(--border)', borderRadius: 2 }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── Payment Form ── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 28 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, marginBottom: 22 }}>
              💳 Payment Details
            </h3>

            {/* Card preview strip */}
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #c9952a 100%)',
              borderRadius: 14, padding: '20px 24px', marginBottom: 24, color: '#fff',
            }}>
              <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 12, letterSpacing: 1 }}>DEBIT / CREDIT</div>
              <div style={{ fontSize: 18, letterSpacing: 3, fontFamily: 'monospace', marginBottom: 16, minHeight: 24 }}>
                {payment.number || '•••• •••• •••• ••••'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                  <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>CARDHOLDER</div>
                  <div style={{ fontWeight: 600 }}>{payment.name.toUpperCase() || 'YOUR NAME'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ opacity: 0.6, fontSize: 10, marginBottom: 2 }}>EXPIRES</div>
                  <div style={{ fontWeight: 600 }}>{payment.expiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Cardholder Name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input name="name" value={payment.name} onChange={handlePaymentChange}
                    placeholder="As shown on card" autoComplete="cc-name" />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Card Number {payment.number && <span style={{ color: 'var(--gold)', fontWeight: 400 }}>{cardBrand()}</span>}
                </label>
                <div className="input-wrap">
                  <span className="input-icon">💳</span>
                  <input name="number" value={payment.number} onChange={handlePaymentChange}
                    placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="cc-number" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Expiry Date</label>
                  <div className="input-wrap">
                    <span className="input-icon">📅</span>
                    <input name="expiry" value={payment.expiry} onChange={handlePaymentChange}
                      placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>CVV</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔒</span>
                    <input name="cvv" value={payment.cvv} onChange={handlePaymentChange}
                      placeholder="•••" inputMode="numeric" autoComplete="cc-csc" type="password" />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
                color: 'var(--danger)', padding: '10px 14px', borderRadius: 10, marginTop: 16, fontSize: 13,
              }}>✗ {error}</div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: 15, fontSize: 16, marginTop: 20 }}
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
              <span>🔒 SSL Encrypted</span>
              <span>🛡 Secure Payment</span>
              <span>✓ Demo Only</span>
            </div>
          </div>

          {/* ── Order Summary ── */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--border)', padding: 24, position: 'sticky', top: 100 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--dark)' }}>{item.name} <span style={{ color: 'var(--muted)' }}>×{item.qty}</span></span>
                  <span style={{ fontWeight: 600 }}>${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                <span>${(total - shipping + discount).toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>Discount</span><span>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Shipping</span>
                <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--gold)' }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
