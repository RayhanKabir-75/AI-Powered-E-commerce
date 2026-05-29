import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MAX = 4;

// ── Hook — manage compare list state ──────────────────────────────────────
export function useCompare() {
  const [compareList, setCompareList] = useState([]);

  const toggleCompare = (product) => {
    setCompareList(prev => {
      const alreadyIn = prev.some(p => p.id === product.id);
      if (alreadyIn) return prev.filter(p => p.id !== product.id);
      if (prev.length >= MAX) return prev;
      return [...prev, product];
    });
  };

  const removeFromCompare = (id) => setCompareList(prev => prev.filter(p => p.id !== id));
  const clearCompare      = ()   => setCompareList([]);

  return { compareList, toggleCompare, removeFromCompare, clearCompare };
}

// ── CompareButton — drop into any product card ────────────────────────────
export function CompareButton({ product, compareList, onToggle }) {
  const isIn   = compareList.some(p => p.id === product.id);
  const isFull = compareList.length >= MAX && !isIn;

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); if (!isFull) onToggle(product); }}
      title={isFull ? `Max ${MAX} products` : isIn ? 'Remove from compare' : 'Add to compare'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        width: '100%', padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 600,
        border: `1.5px solid ${isIn ? 'var(--gold)' : 'var(--border)'}`,
        background: isIn ? 'rgba(201,149,42,0.1)' : 'transparent',
        color: isIn ? 'var(--gold)' : 'var(--muted)',
        cursor: isFull ? 'not-allowed' : 'pointer',
        opacity: isFull ? 0.4 : 1,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
    >
      {isIn ? '✓ Comparing' : '⊕ Compare'}
    </button>
  );
}

// ── Main component — floating bar + modal ─────────────────────────────────
export default function ProductComparison({ compareList, onRemove, onClear, onAddToCart, getMediaUrl }) {
  const navigate   = useNavigate();
  const [open, setOpen] = useState(false);

  if (compareList.length === 0) return null;

  const ROWS = [
    { label: 'Price',       key: 'price',        format: v => `$${parseFloat(v).toFixed(2)}`,
      best: vals => Math.min(...vals.map(v => parseFloat(v) || Infinity)), bestLabel: 'BEST PRICE', bestColor: '#27AE60' },
    { label: 'Category',    key: 'category_name', format: v => v || '—' },
    { label: 'Rating',      key: 'avg_rating',   format: v => parseFloat(v) > 0 ? `${parseFloat(v).toFixed(1)} ★` : 'No ratings',
      best: vals => Math.max(...vals.map(v => parseFloat(v) || 0)), bestLabel: 'TOP RATED', bestColor: 'var(--gold)' },
    { label: 'In Stock',    key: 'stock',        format: v => parseInt(v) > 0 ? `${v} units` : 'Out of stock',
      color: v => parseInt(v) > 0 ? '#27AE60' : '#e74c3c' },
    { label: 'Reviews',     key: 'review_count', format: v => v != null ? `${v}` : '—' },
    { label: 'Description', key: 'description',  format: v => v ? (v.length > 90 ? v.slice(0, 90) + '…' : v) : '—' },
  ];

  return (
    <>
      {/* ── Floating bar ── */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1200, background: 'var(--dark)', borderRadius: 16,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        maxWidth: 'calc(100vw - 48px)',
        animation: 'fadeUp 0.2s ease both',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, whiteSpace: 'nowrap' }}>
          ⚖️ {compareList.length}/{MAX}
        </span>

        {/* Thumbnails */}
        <div style={{ display: 'flex', gap: 6 }}>
          {compareList.map(p => (
            <div key={p.id} style={{ position: 'relative' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, overflow: 'hidden',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                {p.image
                  ? <img src={getMediaUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '📦'}
              </div>
              <button onClick={() => onRemove(p.id)} style={{
                position: 'absolute', top: -5, right: -5,
                width: 14, height: 14, borderRadius: '50%',
                background: '#e74c3c', border: 'none', color: '#fff',
                fontSize: 8, cursor: 'pointer', fontWeight: 700, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpen(true)}
          disabled={compareList.length < 2}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: compareList.length >= 2 ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
            color: compareList.length >= 2 ? 'var(--dark)' : 'rgba(255,255,255,0.3)',
            border: 'none', cursor: compareList.length >= 2 ? 'pointer' : 'default',
            fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s',
          }}
        >
          {compareList.length >= 2 ? 'Compare →' : `Need ${2 - compareList.length} more`}
        </button>

        <button onClick={onClear} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer', fontSize: 11, padding: 0, fontFamily: 'inherit',
        }}>Clear</button>
      </div>

      {/* ── Modal ── */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: 'var(--cream)', borderRadius: 20,
              width: '100%', maxWidth: 240 + compareList.length * 190,
              maxHeight: '90vh', overflowY: 'auto',
              padding: '28px 28px 32px',
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              animation: 'fadeUp 0.2s ease both',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, margin: 0 }}>
                ⚖️ Compare Products
              </h2>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: 'var(--muted)', padding: 4,
              }}>✕</button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 110, padding: '0 16px 20px 0', verticalAlign: 'bottom', textAlign: 'left' }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Feature
                      </span>
                    </th>

                    {compareList.map(p => (
                      <th key={p.id} style={{ width: 190, padding: '0 8px 20px', textAlign: 'center', verticalAlign: 'bottom' }}>
                        {/* Remove */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                          <button
                            onClick={() => { onRemove(p.id); if (compareList.length <= 2) setOpen(false); }}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, padding: 0 }}
                          >
                            ✕ remove
                          </button>
                        </div>
                        {/* Image */}
                        <div style={{
                          width: 90, height: 90, borderRadius: 12, overflow: 'hidden',
                          margin: '0 auto 10px', background: 'var(--panel)',
                          border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                        }}>
                          {p.image
                            ? <img src={getMediaUrl(p.image)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : '📦'}
                        </div>
                        {/* Name */}
                        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 13, lineHeight: 1.3, marginBottom: 10 }}>
                          {p.name}
                        </div>
                        {/* CTAs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <button
                            onClick={() => { setOpen(false); navigate(`/product/${p.id}`); }}
                            style={{ padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'var(--dark)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            View Product
                          </button>
                          {onAddToCart && parseInt(p.stock) > 0 && (
                            <button
                              onClick={() => onAddToCart(p)}
                              style={{ padding: '6px 0', borderRadius: 8, fontSize: 11, fontWeight: 600, background: 'rgba(201,149,42,0.12)', color: 'var(--gold)', border: '1.5px solid rgba(201,149,42,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              + Add to Cart
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {ROWS.map((row, ri) => {
                    const vals   = compareList.map(p => p[row.key]);
                    const bestVal = row.best ? row.best(vals) : null;

                    return (
                      <tr key={row.key} style={{ background: ri % 2 === 0 ? 'rgba(201,149,42,0.03)' : 'transparent' }}>
                        <td style={{
                          padding: '12px 16px 12px 0', fontSize: 11, fontWeight: 700,
                          color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5,
                          borderTop: '1px solid var(--border)', verticalAlign: 'top',
                        }}>
                          {row.label}
                        </td>

                        {compareList.map(p => {
                          const val    = p[row.key];
                          const numVal = parseFloat(val);
                          const isBest = bestVal !== null && numVal === bestVal && (row.key === 'avg_rating' ? numVal > 0 : true);
                          const fgColor = row.color ? row.color(val) : (isBest ? row.bestColor : 'var(--dark)');

                          return (
                            <td key={p.id} style={{
                              padding: '12px 8px', textAlign: 'center', fontSize: 13,
                              borderTop: '1px solid var(--border)', verticalAlign: 'top',
                              color: fgColor, fontWeight: isBest ? 700 : 400, lineHeight: 1.4,
                            }}>
                              {row.format(val)}
                              {isBest && (
                                <div style={{ fontSize: 9, color: row.bestColor, fontWeight: 700, marginTop: 3, letterSpacing: 0.5 }}>
                                  {row.bestLabel}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { onClear(); setOpen(false); }}
                style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
              >
                Clear All
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--dark)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}