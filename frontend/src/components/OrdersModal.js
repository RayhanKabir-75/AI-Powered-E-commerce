import React, { useState, useEffect } from 'react';
import API from '../api/api';

const STATUS_COLOURS = {
  pending:   { bg: 'rgba(201,149,42,0.12)',  color: '#C9952A' },
  confirmed: { bg: 'rgba(52,152,219,0.12)',  color: '#2980B9' },
  shipped:   { bg: 'rgba(155,89,182,0.12)',  color: '#8E44AD' },
  delivered: { bg: 'rgba(39,174,96,0.12)',   color: '#27AE60' },
  cancelled: { bg: 'rgba(192,57,43,0.12)',   color: '#C0392B' },
};

export default function OrdersModal({ onClose }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('orders/');
        setOrders(res.data);
      } catch (err) {
        // If orders endpoint not built yet, show friendly placeholder
        if (err.response?.status === 404) {
          setOrders([]);
        } else {
          setError('Could not load orders. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        <div className="modal-icon">📦</div>
        <h3 className="modal-title">My Orders</h3>
        <p className="modal-sub" style={{ marginBottom: 20 }}>
          Track the status of your recent orders.
        </p>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <span className="spinner" style={{ borderTopColor: 'var(--gold)', width: 28, height: 28, borderWidth: 3 }} />
              <p style={{ marginTop: 12, color: 'var(--muted)', fontSize: 14 }}>Loading your orders…</p>
            </div>
          )}

          {error && <div className="api-error">{error}</div>}

          {!loading && !error && orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
              <p style={{ fontWeight: 600, marginBottom: 6 }}>No orders yet</p>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                Your orders will appear here once you make a purchase.
              </p>
            </div>
          )}

          {!loading && orders.map(order => {
            const style = STATUS_COLOURS[order.status] || STATUS_COLOURS.pending;
            return (
              <div key={order.id} style={{
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '16px', marginBottom: 12, background: '#fff',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Order #{order.id}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 999,
                    fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                    background: style.bg, color: style.color,
                  }}>
                    {order.status}
                  </span>
                </div>

                {/* Order items */}
                {order.items?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: 'var(--dark)',
                    padding: '4px 0', borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span>{item.product_name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>${item.price}</span>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
                  fontWeight: 700, fontSize: 14,
                }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--gold)' }}>${order.total}</span>
                </div>
              </div>
            );
          })}
        </div>

        <button className="modal-cancel" onClick={onClose} style={{ marginTop: 16 }}>Close</button>
      </div>
    </div>
  );
}