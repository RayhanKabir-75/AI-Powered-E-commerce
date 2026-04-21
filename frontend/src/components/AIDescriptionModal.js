import React, { useState } from 'react';
import { generateDescription } from '../api/api';

export default function AIDescriptionModal({ onClose, onUse }) {
  const [form,    setForm]    = useState({ name: '', category: '', price: '', features: '' });
  const [result,  setResult]  = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleGenerate = async () => {
    if (!form.name || !form.category) {
      setError('Product name and category are required.');
      return;
    }
    setLoading(true);
    setResult('');
    setError('');
    try {
      const res = await generateDescription(form);
      setResult(res.data.description);
    } catch (err) {
      setError(err.response?.data?.error || 'AI generation failed. Check your OpenAI API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (onUse) onUse(result);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-icon">✍️</div>
        <h3 className="modal-title">AI Description Generator</h3>
        <p className="modal-sub">
          Enter your product details and let AI write a compelling description for you.
        </p>

        {error && <div className="api-error">{error}</div>}

        <div className="form-group">
          <label>Product name <span style={{ color: 'var(--danger)' }}>*</span></label>
          <div className="input-wrap">
            <span className="input-icon">🏷️</span>
            <input type="text" placeholder="e.g. Wireless Noise-Cancelling Headphones"
              value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Category <span style={{ color: 'var(--danger)' }}>*</span></label>
          <div className="input-wrap">
            <span className="input-icon">📂</span>
            <input type="text" placeholder="e.g. Electronics"
              value={form.category} onChange={e => set('category', e.target.value)} />
          </div>
        </div>

        <div className="form-row" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Price ($)</label>
            <div className="input-wrap">
              <span className="input-icon">💲</span>
              <input type="number" placeholder="89.99"
                value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>
          <div style={{ width: 0 }} />
        </div>

        <div className="form-group">
          <label>Key features</label>
          <div className="input-wrap">
            <span className="input-icon">⚡</span>
            <input type="text" placeholder="e.g. 30hr battery, foldable, USB-C"
              value={form.features} onChange={e => set('features', e.target.value)} />
          </div>
        </div>

        <button className="btn-submit" onClick={handleGenerate} disabled={loading}>
          {loading
            ? <span className="spinner-row"><span className="spinner" /> Generating with AI...</span>
            : '✨ Generate Description'}
        </button>

        {/* AI result */}
        {result && (
          <div style={{
            marginTop: 20, padding: '16px', borderRadius: 12,
            background: 'rgba(201,149,42,0.07)',
            border: '1.5px solid rgba(201,149,42,0.3)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 8 }}>
              ✨ AI-Generated Description
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--dark)' }}>{result}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {onUse && (
                <button className="btn-submit" onClick={handleUse} style={{ flex: 1, margin: 0, padding: '10px' }}>
                  Use this description
                </button>
              )}
              <button onClick={handleGenerate} disabled={loading}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: '1.5px solid var(--border)', background: '#fff',
                  fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
                }}>
                Regenerate
              </button>
            </div>
          </div>
        )}

        <button className="modal-cancel" onClick={onClose} style={{ marginTop: 12 }}>Cancel</button>
      </div>
    </div>
  );
}