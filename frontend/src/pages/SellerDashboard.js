import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct, getProducts, updateProduct, deleteProduct, updateOrderStatus, generateDescription } from '../api/api';
import API from '../api/api';
import './auth.css';

const CATEGORY_EMOJIS = {
  Electronics: '🎧', Accessories: '👜', Footwear: '👟',
  Appliances: '☕', Sports: '🧘', Home: '💡', Bags: '🎒',
  Clothing: '👕', Other: '📦',
};

const STATUS_COLORS = {
  pending:   { bg: 'rgba(201,149,42,0.12)',  color: '#C9952A' },
  confirmed: { bg: 'rgba(66,133,244,0.12)',  color: '#4285F4' },
  shipped:   { bg: 'rgba(139,94,60,0.12)',   color: '#8B5E3C' },
  delivered: { bg: 'rgba(39,174,96,0.12)',   color: '#27AE60' },
  cancelled: { bg: 'rgba(192,57,43,0.12)',   color: '#C0392B' },
};

const EMPTY_FORM = {
  name: '', price: '', category: '', stock: '', description: '', image: '', imageFile: null,
};

const hour     = new Date().getHours();
const greeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

export default function SellerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const menuRef  = useRef(null);

  const [tab,        setTab]        = useState('products');
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [editingId,  setEditingId]  = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [aiLoading,  setAiLoading]  = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [deleteId,   setDeleteId]   = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [aiFeatures, setAiFeatures] = useState('');

  const firstName = user.first_name || user.email.split('@')[0];
  const initials  = user.first_name
    ? (user.first_name[0] + (user.last_name?.[0] || '')).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get('products/categories/');
      setCategories(res.data.results ?? res.data);
    } catch { console.error('Failed to load categories'); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setFetching(true);
    try {
      const res = await getProducts();
      setProducts(res.data.results ?? res.data);
    } catch { setError('Failed to load products.'); }
    finally { setFetching(false); }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get('orders/seller/');
      setOrders(res.data);
    } catch { console.error('Failed to load orders'); }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchCategories();
  }, [fetchProducts, fetchOrders, fetchCategories]);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setAiFeatures('');
    setShowForm(true);
    setError('');
  };

  const openEditForm = (p) => {
    setForm({
      name:        p.name,
      price:       p.price,
      category:    p.category,
      stock:       p.stock,
      description: p.description || '',
      image:       p.image || '',
      imageFile:   null,
    });
    setEditingId(p.id);
    setAiFeatures('');
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleGenerateDescription = async () => {
    if (!form.name) { setError('Enter a product name first.'); return; }
    setAiLoading(true);
    setError('');
    try {
      const catName = categories.find(c => String(c.id) === String(form.category))?.name || '';
      const res = await generateDescription({
        name:     form.name,
        category: catName,
        price:    form.price,
        features: aiFeatures,
      });
      setForm(f => ({ ...f, description: res.data.description }));
    } catch {
      setError('AI description failed. Check your OpenAI key.');
    } finally {
      setAiLoading(false);
    }
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
      const payload = new FormData();
      payload.append('name',        form.name);
      payload.append('price',       parseFloat(form.price));
      payload.append('category',    parseInt(form.category));
      payload.append('stock',       parseInt(form.stock) || 0);
      payload.append('description', form.description);
      if (form.imageFile) payload.append('image', form.imageFile);

      if (editingId) {
        await updateProduct(editingId, payload);
        setSuccess('Product updated!');
      } else {
        await createProduct(payload);
        setSuccess('Product added!');
      }
      closeForm();
      fetchProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteId);
      setProducts(p => p.filter(x => x.id !== deleteId));
      setDeleteId(null);
      setSuccess('Product deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to delete product.');
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setSuccess(`Order #${orderId} marked as ${newStatus}.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update order status.');
    }
  };

  const handleLogout = async () => {
    try { await onLogout(); } catch (_) {}
    navigate('/');
  };

  const totalValue    = products.reduce((s, p) => s + (parseFloat(p.price) * (parseInt(p.stock) || 0)), 0);
  const lowStock      = products.filter(p => parseInt(p.stock) < 5).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const getEmoji = (p) => CATEGORY_EMOJIS[p.category_name] || '📦';

  const menuItems = [
    { icon: '➕', label: 'Add New Product', action: () => { openAddForm(); setMenuOpen(false); } },
    { icon: '📦', label: 'My Products',     action: () => { setTab('products'); setMenuOpen(false); } },
    { icon: '🧾', label: 'Incoming Orders', action: () => { setTab('orders'); setMenuOpen(false); } },
    { icon: '🚪', label: 'Log out',         action: handleLogout, danger: true },
  ];

  const skeletonStyle = {
    background: 'linear-gradient(90deg, #f5f0e8 25%, #fffdf7 50%, #f5f0e8 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: 14,
    border: '1px solid var(--border)',
    height: 240,
  };

  return (
    <div className="home page">

      {/* ── Sticky Nav ───────────────────────────────────────────────────── */}
      <nav className="home-nav">
        <div className="nav-logo" style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20,
          fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 7, height: 7, background: 'var(--gold)', borderRadius: '50%' }} />
          ShopAI
        </div>

        <div className="home-nav-right">
          <span className="role-badge seller">🏪 seller</span>

          <div className="user-pill-wrapper" ref={menuRef}>
            <div className="user-pill" onClick={() => setMenuOpen(o => !o)}>
              <div className="user-pill-avatar">{initials}</div>
              {firstName}
              <span className="pill-caret">{menuOpen ? '▲' : '▼'}</span>
            </div>

            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">{initials}</div>
                  <div>
                    <div className="user-dropdown-name">{user.first_name} {user.last_name}</div>
                    <div className="user-dropdown-email">{user.email}</div>
                  </div>
                </div>
                <div className="user-dropdown-divider" />
                {menuItems.map((item, i) => (
                  <button key={i}
                    className={`user-dropdown-item ${item.danger ? 'danger' : ''}`}
                    onClick={item.action}>
                    <span className="dropdown-icon">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="home-hero">
        <h1 className="home-greeting">
          Good {greeting}, <em>{firstName}.</em>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 15 }}>Manage your listings and track incoming orders.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button className="btn btn-primary" onClick={openAddForm}>+ Add Product</button>
          <button className="btn btn-ghost"   onClick={() => setTab('orders')}>View Orders →</button>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="home-main">

        {/* Stats banner */}
        <div className="ai-banner" style={{ marginBottom: 32 }}>
          <div className="ai-banner-text">
            <h3>🏪 Your Store at a Glance</h3>
            <p>Keep your listings fresh and fulfil orders promptly</p>
          </div>
          <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
            {[
              { label: 'Products',       value: products.length,             color: '#fff' },
              { label: 'Total Value',    value: `$${totalValue.toFixed(0)}`, color: 'var(--gold)' },
              { label: 'Pending Orders', value: pendingOrders,               color: pendingOrders > 0 ? '#f59e0b' : '#4ade80' },
              { label: 'Low Stock',      value: lowStock,                    color: lowStock > 0 ? '#f87171' : '#4ade80' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Toast messages */}
        {success && (
          <div style={{
            background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)',
            color: '#27AE60', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14,
          }}>✓ {success}</div>
        )}
        {error && (
          <div style={{
            background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)',
            color: 'var(--danger)', padding: '12px 18px', borderRadius: 10, marginBottom: 20, fontSize: 14,
          }}>✗ {error}</div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '2px solid var(--border)' }}>
          {[
            { key: 'products', label: '📦 My Products' },
            { key: 'orders',   label: `🧾 Incoming Orders${pendingOrders > 0 ? ` (${pendingOrders} pending)` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', padding: '10px 20px',
              fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700,
              cursor: 'pointer', color: tab === t.key ? 'var(--dark)' : 'var(--muted)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Add / Edit Form ─────────────────────────────────────────────── */}
        {showForm && (
          <div style={{
            background: '#fff', border: '2px solid var(--gold)', borderRadius: 16,
            padding: 28, marginBottom: 32, animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>
                {editingId ? '✏️ Edit Product' : '➕ New Product'}
              </h3>
              <button onClick={closeForm} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Product Name *</label>
                  <div className="input-wrap">
                    <span className="input-icon">🏷️</span>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Category *</label>
                  <div className="input-wrap">
                    <select name="category" value={form.category} onChange={handleChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14 }}>
                      <option value="">Select category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ marginBottom: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Price (AUD) *</label>
                  <div className="input-wrap">
                    <span className="input-icon">💰</span>
                    <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Stock Quantity</label>
                  <div className="input-wrap">
                    <span className="input-icon">📊</span>
                    <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0" />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <div className="input-wrap">
                  <span className="input-icon">🖼️</span>
                  <input type="file" accept="image/*"
                    onChange={e => setForm(f => ({ ...f, imageFile: e.target.files[0] }))}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 14, padding: '4px 0' }} />
                </div>
                {form.imageFile && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    Selected: {form.imageFile.name}
                  </div>
                )}
              </div>

              {/* AI Description */}
              <div className="form-group">
                <label>Key Features <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(for AI)</span></label>
                <div className="input-wrap">
                  <span className="input-icon">✨</span>
                  <input value={aiFeatures} onChange={e => setAiFeatures(e.target.value)}
                    placeholder="e.g. noise-cancelling, 30hr battery, foldable" />
                </div>
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleGenerateDescription}
                disabled={aiLoading} style={{ marginBottom: 12, fontSize: 13 }}>
                {aiLoading ? '⏳ Generating...' : '🤖 Generate AI Description'}
              </button>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  placeholder="Describe your product..."
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
                    borderRadius: 10, fontFamily: 'inherit', fontSize: 14,
                    minHeight: 80, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                  }} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Products Tab ─────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            <div className="section-header">
              <h2 className="section-title">My Products</h2>
              <button className="link-btn" onClick={openAddForm}>+ Add new →</button>
            </div>

            {fetching ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 20 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={skeletonStyle} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No products yet</div>
                <div style={{ fontSize: 14, marginBottom: 20 }}>Add your first product to start selling</div>
                <button className="btn btn-gold" onClick={openAddForm}>+ Add Product</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((p, i) => (
                  <div className="product-card" key={p.id} style={{ animationDelay: `${0.05 * i}s`, cursor: 'default' }}>
                    <div className="product-img">
                      {p.image
                        ? <img src={p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`}
                            alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : getEmoji(p)}
                    </div>
                    <div className="product-info">
                      <div className="product-name">{p.name}</div>
                      <div className="product-cat">{p.category_name || '—'}</div>
                      <div className="product-footer">
                        <div className="product-price">${parseFloat(p.price).toFixed(2)}</div>
                        <div className="product-rating" style={{ color: parseInt(p.stock) < 5 ? 'var(--danger)' : 'var(--muted)' }}>
                          {parseInt(p.stock) < 5 ? `⚠ ${p.stock} left` : `${p.stock} in stock`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, padding: '8px 14px 14px' }}>
                      <button className="btn btn-ghost" style={{ flex: 1, fontSize: 12, padding: '6px 0' }}
                        onClick={() => openEditForm(p)}>✏️ Edit</button>
                      <button style={{
                        flex: 1, fontSize: 12, padding: '6px 0',
                        background: 'rgba(192,57,43,0.08)',
                        border: '1.5px solid rgba(192,57,43,0.2)',
                        borderRadius: 8, color: 'var(--danger)', cursor: 'pointer',
                      }} onClick={() => setDeleteId(p.id)}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Orders Tab ───────────────────────────────────────────────────── */}
        {tab === 'orders' && (
          <>
            <div className="section-header">
              <h2 className="section-title">Incoming Orders</h2>
              <button className="link-btn" onClick={fetchOrders}>↻ Refresh</button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No orders yet</div>
                <div style={{ fontSize: 14 }}>Orders will appear here once customers purchase your products</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map(o => (
                  <div key={o.id} style={{
                    background: '#fff', border: '1px solid var(--border)',
                    borderRadius: 14, padding: 20, animation: 'fadeUp 0.3s ease both',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>Order #{o.id}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {o.customer_email} · {new Date(o.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          background: STATUS_COLORS[o.status]?.bg,
                          color:      STATUS_COLORS[o.status]?.color,
                        }}>
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                        <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)}
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--border)',
                            fontFamily: 'inherit', fontSize: 13, cursor: 'pointer', outline: 'none',
                          }}>
                          {['pending','confirmed','shipped','delivered','cancelled'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {o.items?.map(item => (
                        <div key={item.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: 'var(--cream)', borderRadius: 10, padding: '10px 14px',
                        }}>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.product_name}</div>
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                            x{item.quantity} · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 12, textAlign: 'right', fontSize: 14, fontWeight: 700 }}>
                      Total: <span style={{ color: 'var(--gold)' }}>${parseFloat(o.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <h3 className="modal-title">Delete Product?</h3>
            <p className="modal-sub">This action cannot be undone. The product will be permanently removed.</p>
            <button className="btn btn-primary"
              style={{ background: 'var(--danger)', marginBottom: 10, width: '100%', padding: 13, border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              onClick={confirmDelete}>
              Yes, Delete
            </button>
            <button className="modal-cancel" onClick={() => setDeleteId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
