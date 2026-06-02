import React, { useState, useEffect, useRef } from 'react';
import API, { downloadInvoice } from '../api/api';

const STATUS_COLOURS = {
  pending:   { bg: 'rgba(201,149,42,0.12)',  color: '#C9952A' },
  confirmed: { bg: 'rgba(52,152,219,0.12)',  color: '#2980B9' },
  shipped:   { bg: 'rgba(155,89,182,0.12)',  color: '#8E44AD' },
  delivered: { bg: 'rgba(39,174,96,0.12)',   color: '#27AE60' },
  cancelled: { bg: 'rgba(192,57,43,0.12)',   color: '#C0392B' },
};

const WS_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api/')
  .replace(/^http/, 'ws')
  .replace(/\/api\/?$/, '');

export default function OrdersModal({ onClose }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [liveIds, setLiveIds] = useState(new Set());
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get('orders/');
        setOrders(res.data.results ?? res.data);
      } catch (err) {
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

  // ── Real-time status updates via WebSocket ────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/ws/orders/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const { order_id, status } = JSON.parse(e.data);
      setOrders(prev =>
        prev.map(o => o.id === order_id ? { ...o, status } : o)
      );
      setLiveIds(prev => {
        const next = new Set(prev);
        next.add(order_id);
        return next;
      });
      setTimeout(() => {
        setLiveIds(prev => {
          const next = new Set(prev);
          next.delete(order_id);
          return next;
        });
      }, 3000);
    };

    return () => ws.close();
  }, []);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleDownloadInvoice = async (orderId) => {
    try {
      const blob = await downloadInvoice(orderId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ShopAI_Invoice_Order_${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download invoice. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ alignItems: 'flex-start', paddingTop: 40 }}>
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
            const style    = STATUS_COLOURS[order.status] || STATUS_COLOURS.pending;
            const isLive   = liveIds.has(order.id);
            return (
              <div key={order.id} style={{
                border: `1px solid ${isLive ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '16px', marginBottom: 12, background: 'var(--panel)',
                transition: 'border-color 0.4s ease',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      Order #{order.id}
                      {isLive && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          color: 'var(--gold)', background: 'rgba(201,149,42,0.12)',
                          padding: '2px 7px', borderRadius: 999,
                        }}>
                          ● LIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 999,
                      fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                      background: style.bg, color: style.color,
                      transition: 'all 0.3s ease',
                    }}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => handleDownloadInvoice(order.id)}
                      title="Download Invoice PDF"
                      style={{
                        background: 'none', border: '1.5px solid var(--border)',
                        borderRadius: 8, padding: '3px 9px', cursor: 'pointer',
                        fontSize: 11, fontFamily: 'inherit', color: 'var(--muted)',
                      }}
                    >
                      ↓ Invoice
                    </button>
                  </div>
                </div>

                {/* Order items */}
                {order.items?.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: 'var(--dark)',
                    padding: '4px 0', borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span>
                      {item.product_name}
                      {item.variant_name && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, marginLeft: 6,
                          color: 'var(--gold)', background: 'rgba(201,149,42,0.1)',
                          padding: '1px 6px', borderRadius: 999,
                        }}>
                          {item.variant_name}
                        </span>
                      )}
                      {' '}× {item.quantity}
                    </span>
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
