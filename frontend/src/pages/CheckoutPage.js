import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { placeOrder } from '../api/api';
import './auth.css';

export default function CheckoutPage({ user, setCart }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { cart = [], total = 0, discount = 0, shipping = 0 } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  if (!cart.length) {
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

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError('');
    try {
      await placeOrder({
        items: cart.map(item => ({ product_id: item.id, quantity: item.qty })),
      });
      setCart([]);
      navigate('/home', { state: { orderSuccess: true } });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
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

      <div className="home-main" style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="section-header" style={{ marginBottom: 32 }}>
          <h2 className="section-title">✅ Confirm Your Order</h2>
        </div>

        {/* Items */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
          padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
            Order Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--cream)', borderRadius: 10, padding: '10px 14px',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Qty: {item.qty}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--gold)' }}>
                  ${(parseFloat(item.price) * item.qty).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: '#fff', borderRadius: 16, border: '1px solid var(--border)',
          padding: 24, marginBottom: 20,
        }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>
            Price Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span>${(total - shipping + discount).toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Promo Discount</span>
                <span>−${discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>Shipping</span>
              <span>{shipping === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
              <span>Total</span>
              <span style={{ color: 'var(--gold)' }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
            color: 'var(--danger)', padding: '12px 18px', borderRadius: 10, marginBottom: 16, fontSize: 14,
          }}>✗ {error}</div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: 16, fontSize: 16 }}
          onClick={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? 'Placing Order...' : '🛍 Place Order'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
          🔒 Your order is secure and confirmed instantly
        </div>
      </div>
    </div>
  );
}
