import React, { useState, useEffect } from 'react';
import { createProduct, getProducts } from '../api/api';

const CATEGORIES = ['Electronics', 'Accessories', 'Footwear', 'Appliances', 'Sports', 'Home', 'Bags', 'Clothing', 'Other'];

const EMPTY_FORM = {
  name: '',
  price: '',
  category: '',
  stock: '',
  description: '',
  image: '',
};

export default function SellerDashboard({ user, onBack }) {
  const [products, setProducts]     = useState([]);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [deleteId, setDeleteId]     = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setFetching(true);
    try {
      const res = await getProducts();
      setProducts(res.data.results ?? res.data);
    } catch {
      setError('Failed to load products.');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) {
      setError('Name, price, and category are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createProduct({
        name: form.name,
        price: parseFloat(form.price),
        category: form.category,
        stock: parseInt(form.stock) || 0,
        description: form.description,
        image: form.image,
      });
      setSuccess('Product added successfully!');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = () => {
    setProducts(p => p.filter(x => x.id !== deleteId));
    setDeleteId(null);
  };

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'Seller';
  const totalRevenue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        .sd-root {
          min-height: 100vh;
          background: #0a0a0f;
          color: #e8e6f0;
          font-family: 'DM Mono', monospace;
        }

        /* ── Header ── */
        .sd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 36px;
          border-bottom: 1px solid #1e1e2e;
          background: #0d0d16;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .sd-logo {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #fff;
        }
        .sd-logo span { color: #a78bfa; }
        .sd-header-right { display: flex; align-items: center; gap: 12px; }
        .sd-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 700; font-size: 13px; color: #fff;
        }
        .sd-username {
          font-size: 13px;
          color: #9ca3af;
        }
        .sd-back-btn {
          background: none;
          border: 1px solid #2d2d3f;
          color: #9ca3af;
          padding: 6px 14px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-back-btn:hover { border-color: #a78bfa; color: #a78bfa; }

        /* ── Body ── */
        .sd-body { max-width: 1100px; margin: 0 auto; padding: 40px 24px; }

        /* ── Page title ── */
        .sd-title {
          font-family: 'Syne', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
        }
        .sd-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 32px; }

        /* ── Stats ── */
        .sd-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
        .sd-stat {
          background: #111120;
          border: 1px solid #1e1e2e;
          border-radius: 12px;
          padding: 20px 24px;
        }
        .sd-stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .sd-stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        .sd-stat-value.purple { color: #a78bfa; }

        /* ── Toolbar ── */
        .sd-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .sd-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }
        .sd-add-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex; align-items: center; gap: 8px;
        }
        .sd-add-btn:hover { background: #6d28d9; }

        /* ── Toast ── */
        .sd-toast {
          padding: 12px 18px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 20px;
          animation: fadeIn 0.3s ease;
        }
        .sd-toast.success { background: #052e16; border: 1px solid #166534; color: #4ade80; }
        .sd-toast.error   { background: #1c0a0a; border: 1px solid #7f1d1d; color: #f87171; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Form ── */
        .sd-form-card {
          background: #111120;
          border: 1px solid #2d2d3f;
          border-radius: 14px;
          padding: 28px;
          margin-bottom: 28px;
          animation: fadeIn 0.25s ease;
        }
        .sd-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 20px;
        }
        .sd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .sd-form-full { grid-column: 1 / -1; }
        .sd-field { display: flex; flex-direction: column; gap: 6px; }
        .sd-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; }
        .sd-input, .sd-select, .sd-textarea {
          background: #0d0d16;
          border: 1px solid #2d2d3f;
          color: #e8e6f0;
          padding: 10px 14px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .sd-input:focus, .sd-select:focus, .sd-textarea:focus { border-color: #7c3aed; }
        .sd-select option { background: #0d0d16; }
        .sd-textarea { resize: vertical; min-height: 80px; }
        .sd-form-actions { display: flex; gap: 12px; margin-top: 20px; justify-content: flex-end; }
        .sd-cancel-btn {
          background: none;
          border: 1px solid #2d2d3f;
          color: #9ca3af;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-cancel-btn:hover { border-color: #6b7280; color: #e8e6f0; }
        .sd-submit-btn {
          background: #7c3aed;
          color: #fff;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .sd-submit-btn:hover:not(:disabled) { background: #6d28d9; }
        .sd-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Table ── */
        .sd-table-wrap {
          background: #111120;
          border: 1px solid #1e1e2e;
          border-radius: 14px;
          overflow: hidden;
        }
        .sd-table { width: 100%; border-collapse: collapse; }
        .sd-table th {
          text-align: left;
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 14px 20px;
          border-bottom: 1px solid #1e1e2e;
          background: #0d0d16;
          font-weight: 400;
        }
        .sd-table td {
          padding: 16px 20px;
          font-size: 13px;
          border-bottom: 1px solid #14141f;
          vertical-align: middle;
        }
        .sd-table tr:last-child td { border-bottom: none; }
        .sd-table tr:hover td { background: #0f0f1e; }
        .sd-product-name { color: #fff; font-weight: 500; }
        .sd-category-badge {
          display: inline-block;
          background: #1a1a2e;
          border: 1px solid #2d2d3f;
          color: #a78bfa;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
        }
        .sd-price { color: #4ade80; font-weight: 500; }
        .sd-stock { color: #9ca3af; }
        .sd-stock.low { color: #f87171; }
        .sd-action-btns { display: flex; gap: 8px; }
        .sd-edit-btn, .sd-delete-btn {
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sd-edit-btn { background: #1e1e2e; color: #a78bfa; }
        .sd-edit-btn:hover { background: #2d2d3f; }
        .sd-delete-btn { background: #1c0a0a; color: #f87171; }
        .sd-delete-btn:hover { background: #2d1111; }

        /* ── Empty state ── */
        .sd-empty {
          text-align: center;
          padding: 60px 20px;
          color: #4b5563;
        }
        .sd-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .sd-empty-text { font-size: 14px; margin-bottom: 4px; color: #6b7280; }
        .sd-empty-sub { font-size: 12px; }

        /* ── Confirm modal ── */
        .sd-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          animation: fadeIn 0.2s ease;
        }
        .sd-modal {
          background: #111120;
          border: 1px solid #2d2d3f;
          border-radius: 14px;
          padding: 32px;
          max-width: 380px;
          width: 90%;
          text-align: center;
        }
        .sd-modal-icon { font-size: 32px; margin-bottom: 12px; }
        .sd-modal-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }
        .sd-modal-text { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
        .sd-modal-btns { display: flex; gap: 12px; justify-content: center; }
        .sd-modal-cancel {
          background: none;
          border: 1px solid #2d2d3f;
          color: #9ca3af;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          cursor: pointer;
        }
        .sd-modal-confirm {
          background: #7f1d1d;
          color: #f87171;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          cursor: pointer;
        }
        .sd-modal-confirm:hover { background: #991b1b; }

        /* ── Skeleton loader ── */
        .sd-skeleton {
          background: linear-gradient(90deg, #1a1a2e 25%, #23233a 50%, #1a1a2e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
          height: 16px;
          margin: 4px 0;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        @media (max-width: 640px) {
          .sd-stats { grid-template-columns: 1fr; }
          .sd-form-grid { grid-template-columns: 1fr; }
          .sd-header { padding: 16px 20px; }
          .sd-body { padding: 24px 16px; }
          .sd-table th, .sd-table td { padding: 12px 14px; }
        }
      `}</style>

      <div className="sd-root">
        {/* Header */}
        <header className="sd-header">
          <div className="sd-logo">Shop<span>AI</span></div>
          <div className="sd-header-right">
            <span className="sd-username">{user?.email}</span>
            <div className="sd-avatar">
              {firstName.slice(0, 2).toUpperCase()}
            </div>
            {onBack && (
              <button className="sd-back-btn" onClick={onBack}>← Back</button>
            )}
          </div>
        </header>

        <div className="sd-body">
          {/* Title */}
          <div className="sd-title">Seller Dashboard</div>
          <div className="sd-subtitle">Manage your product listings</div>

          {/* Stats */}
          <div className="sd-stats">
            <div className="sd-stat">
              <div className="sd-stat-label">Total Products</div>
              <div className="sd-stat-value">{products.length}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Total Value</div>
              <div className="sd-stat-value purple">${totalRevenue.toFixed(2)}</div>
            </div>
            <div className="sd-stat">
              <div className="sd-stat-label">Low Stock</div>
              <div className="sd-stat-value">
                {products.filter(p => parseInt(p.stock) < 5).length}
              </div>
            </div>
          </div>

          {/* Toast messages */}
          {success && <div className="sd-toast success">✓ {success}</div>}
          {error   && <div className="sd-toast error">✗ {error}</div>}

          {/* Toolbar */}
          <div className="sd-toolbar">
            <div className="sd-section-title">Your Products</div>
            <button className="sd-add-btn" onClick={() => { setShowForm(f => !f); setError(''); }}>
              {showForm ? '✕ Cancel' : '+ Add Product'}
            </button>
          </div>

          {/* Add Product Form */}
          {showForm && (
            <div className="sd-form-card">
              <div className="sd-form-title">New Product</div>
              <form onSubmit={handleSubmit}>
                <div className="sd-form-grid">
                  <div className="sd-field">
                    <label className="sd-label">Product Name *</label>
                    <input className="sd-input" name="name" value={form.name}
                      onChange={handleChange} placeholder="e.g. Wireless Headphones" />
                  </div>
                  <div className="sd-field">
                    <label className="sd-label">Category *</label>
                    <select className="sd-select" name="category" value={form.category} onChange={handleChange}>
                      <option value="">Select category...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sd-field">
                    <label className="sd-label">Price (AUD) *</label>
                    <input className="sd-input" name="price" type="number" min="0" step="0.01"
                      value={form.price} onChange={handleChange} placeholder="0.00" />
                  </div>
                  <div className="sd-field">
                    <label className="sd-label">Stock Quantity</label>
                    <input className="sd-input" name="stock" type="number" min="0"
                      value={form.stock} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="sd-field sd-form-full">
                    <label className="sd-label">Image URL</label>
                    <input className="sd-input" name="image" value={form.image}
                      onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="sd-field sd-form-full">
                    <label className="sd-label">Description</label>
                    <textarea className="sd-textarea" name="description" value={form.description}
                      onChange={handleChange} placeholder="Describe your product..." />
                  </div>
                </div>
                <div className="sd-form-actions">
                  <button type="button" className="sd-cancel-btn"
                    onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="sd-submit-btn" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="sd-table-wrap">
            {fetching ? (
              <div style={{ padding: '24px' }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                    <div className="sd-skeleton" style={{ width: '30%' }} />
                    <div className="sd-skeleton" style={{ width: '20%' }} />
                    <div className="sd-skeleton" style={{ width: '15%' }} />
                    <div className="sd-skeleton" style={{ width: '15%' }} />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="sd-empty">
                <div className="sd-empty-icon">📦</div>
                <div className="sd-empty-text">No products yet</div>
                <div className="sd-empty-sub">Click "Add Product" to list your first item</div>
              </div>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td className="sd-product-name">{p.name}</td>
                      <td><span className="sd-category-badge">{p.category}</span></td>
                      <td className="sd-price">${parseFloat(p.price).toFixed(2)}</td>
                      <td className={`sd-stock ${parseInt(p.stock) < 5 ? 'low' : ''}`}>
                        {p.stock ?? '—'}
                        {parseInt(p.stock) < 5 && parseInt(p.stock) >= 0 && ' ⚠'}
                      </td>
                      <td>
                        <div className="sd-action-btns">
                          <button className="sd-edit-btn" onClick={() => setEditProduct(p)}>Edit</button>
                          <button className="sd-delete-btn" onClick={() => handleDelete(p.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="sd-overlay" onClick={() => setDeleteId(null)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-icon">🗑️</div>
            <div className="sd-modal-title">Delete Product?</div>
            <div className="sd-modal-text">This action cannot be undone.</div>
            <div className="sd-modal-btns">
              <button className="sd-modal-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="sd-modal-confirm" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
