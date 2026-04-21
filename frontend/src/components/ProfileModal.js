import React, { useState } from 'react';
import API from '../api/api';

export default function ProfileModal({ user, onClose, onUpdate }) {
  const [form,    setForm]    = useState({
    first_name: user.first_name || '',
    last_name:  user.last_name  || '',
    phone:      user.phone      || '',
    address:    user.address    || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) {
      setError('First and last name are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await API.patch('auth/profile/', form);
      onUpdate(res.data);   // update user in App state
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>

        {success ? (
          <>
            <div className="modal-icon">✅</div>
            <h3 className="modal-title">Profile updated!</h3>
            <p className="modal-sub">Your changes have been saved.</p>
          </>
        ) : (
          <>
            <div className="modal-icon">👤</div>
            <h3 className="modal-title">Edit Profile</h3>
            <p className="modal-sub">Update your personal information below.</p>

            {error && <div className="api-error">{error}</div>}

            {/* Name row */}
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>First name</label>
                <div className="input-wrap">
                  <span className="input-icon">👤</span>
                  <input type="text" placeholder="Jane"
                    value={form.first_name}
                    onChange={e => set('first_name', e.target.value)} />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Last name</label>
                <div className="input-wrap">
                  <input type="text" placeholder="Smith" className="no-icon"
                    value={form.last_name}
                    onChange={e => set('last_name', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Email — read only */}
            <div className="form-group">
              <label>Email address <span style={{ color: 'var(--muted)', fontSize: 11 }}>(cannot be changed)</span></label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input type="email" value={user.email} disabled
                  style={{ background: 'var(--cream)', color: 'var(--muted)', cursor: 'not-allowed' }} />
              </div>
            </div>

            <div className="form-group">
              <label>Phone number</label>
              <div className="input-wrap">
                <span className="input-icon">📞</span>
                <input type="tel" placeholder="+61 400 000 000"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery address</label>
              <div className="input-wrap">
                <span className="input-icon">📍</span>
                <input type="text" placeholder="123 Main St, Sydney NSW 2000"
                  value={form.address}
                  onChange={e => set('address', e.target.value)} />
              </div>
            </div>

            {/* Role badge — read only */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Account role</label>
              <div style={{ marginTop: 6 }}>
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'customer' ? '🛍️' : user.role === 'seller' ? '🏪' : '⚙️'} {user.role}
                </span>
              </div>
            </div>

            <button className="btn-submit" onClick={handleSave} disabled={loading}>
              {loading
                ? <span className="spinner-row"><span className="spinner" /> Saving...</span>
                : 'Save changes'}
            </button>
            <button className="modal-cancel" onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}