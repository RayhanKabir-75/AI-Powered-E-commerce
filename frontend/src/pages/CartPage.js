import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoMark from '../components/LogoMark';
import './auth.css';

export default function CartPage({ cart, setCart, user, onLogout }) {
  const navigate  = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError]     = useState('');

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal  = cart.reduce((s, item) => s + parseFloat(item.price) * item.qty, 0);
  const discount  = promoApplied ? subtotal * 0.1 : 0;
  const shipping  = subtotal > 100 ? 0 : 9.99;
  const total     = subtotal - discount + shipping;

  const handlePromo = () => {
    if (promoCode.toUpperCase() === 'SHOPAI10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code.');
      setPromoApplied(false);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout', { state: { cart, total, discount, shipping } });
  };

  return (
    <div className="home page">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
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
            ← Continue Shopping
          </button>
        </div>
      </nav>

      <div className="home-main" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="section-header" style={{ marginBottom: 32 }}>
          <h2 className="section-title">🛒 Your Cart</h2>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
        </div>

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 8 }}>Your cart is empty</h3>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Add some products to get started!</p>
            <button className="btn btn-primary" onClick={() => navigate('/home')}>Browse Products</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

            {/* ── Cart Items ───────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)',
                  padding: 20, display: 'flex', gap: 16, alignItems: 'center',
                  animation: 'fadeUp 0.3s ease both',
                }}>
                  {/* Product image / emoji */}
                  <div style={{
                    width: 80, height: 80, borderRadius: 10, background: 'var(--cream)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, flexShrink: 0, overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}>
                    {item.image
                      ? <img src={item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image.startsWith('/') ? '' : '/'}${item.image}`}
                          alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : item.emoji || '📦'
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>{item.cat || item.category_name}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}>
                      ${(parseFloat(item.price) * item.qty).toFixed(2)}
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => updateQty(item.id, -1)} style={{
                      width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)',
                      background: 'none', cursor: 'pointer', fontSize: 16, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    }}>−</button>
                    <span style={{ fontWeight: 700, fontSize: 15, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} style={{
                      width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)',
                      background: 'none', cursor: 'pointer', fontSize: 16, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                    }}>+</button>
                  </div>

                  {/* Remove */}
                  <button onClick={() => removeItem(item.id)} style={{
                    background: 'rgba(192,57,43,0.08)', border: '1.5px solid rgba(192,57,43,0.2)',
                    color: 'var(--danger)', borderRadius: 8, padding: '6px 12px',
                    cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
                  }}>Remove</button>
                </div>
              ))}
            </div>

            {/* ── Order Summary ────────────────────────────────────────── */}
            <div style={{
              background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--border)',
              padding: 24, position: 'sticky', top: 100,
            }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--success)' }}>
                    <span>Promo (10% off)</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--muted)' }}>Shipping</span>
                  <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                {shipping > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--cream)', padding: '6px 10px', borderRadius: 6 }}>
                    💡 Add ${(100 - subtotal).toFixed(2)} more for free shipping!
                  </div>
                )}
                <div style={{ height: 1, background: 'var(--border)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Promo code */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block' }}>Promo Code</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={promoCode}
                    onChange={e => { setPromoCode(e.target.value); setPromoError(''); }}
                    placeholder="Enter code"
                    style={{
                      flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)',
                      borderRadius: 8, fontFamily: 'inherit', fontSize: 13, outline: 'none',
                    }}
                  />
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }} onClick={handlePromo}>
                    Apply
                  </button>
                </div>
                {promoApplied && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ Promo applied!</div>}
                {promoError  && <div style={{ fontSize: 12, color: 'var(--danger)',  marginTop: 4 }}>{promoError}</div>}
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }}
                onClick={handleCheckout} disabled={cart.length === 0}>
                Proceed to Checkout →
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
                🔒 Secure checkout
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}