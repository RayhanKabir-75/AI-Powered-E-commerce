import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

// ✅ SECURITY: Admin is intentionally NOT in this list.
// Admin accounts are created only via Django shell by the dev team.
const ROLES = [
  { value: 'customer', icon: '🛍️', label: 'Customer', desc: 'Browse & buy products with AI-powered picks' },
  { value: 'seller',   icon: '🏪', label: 'Seller',   desc: 'List products & grow your business with AI tools' },
];

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ firstName: '', lastName: '', email: '', password: '', role: 'customer', agree: false });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setApiErr(''); };

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName)  e.lastName  = 'Required';
    if (!form.email)     e.email     = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)  e.password  = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (!form.agree)     e.agree     = 'Please accept the terms to continue';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await registerUser({
        first_name: form.firstName,
        last_name:  form.lastName,
        email:      form.email,
        password:   form.password,
        role:       form.role,
      });
      onLogin(res.data.user, res.data.token);
      navigate('/home');
    } catch (err) {
      const data = err.response?.data;
      setApiErr(data?.email?.[0] || data?.password?.[0] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth — wire up with react-oauth/google in production
  const handleGoogle = () => {
    alert('Google OAuth: integrate react-oauth/google and pass the Google token to your backend for verification.');
  };

  return (
    <div className="auth-layout page">
      {/* Left branding panel */}
      <div className="auth-panel">
        <div className="auth-panel-bg" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo"><div className="panel-dot" /> ShopAI</div>
          <h2 className="auth-panel-title">Join the<br /><em>future</em> of<br />shopping.</h2>
          <p className="auth-panel-sub">Create an account and get instant access to AI-powered product discovery, smart recommendations, and more.</p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['✦  Personalised AI recommendations', '✦  AI-generated product insights', '✦  24/7 conversational assistant', '✦  NLP-powered review summaries'].map((f, i) => (
              <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-side" style={{ overflowY: 'auto', padding: '40px 48px' }}>
        <div className="auth-form-box">
          <button className="auth-back" onClick={() => navigate('/')}>← Back to home</button>
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Already have one? <a onClick={() => navigate('/login')}>Log in</a></p>

          {/* Google signup */}
          <button className="btn-google" onClick={handleGoogle}>
            <GoogleIcon />
            Sign up with Google
          </button>

          <div className="divider">
            <div className="divider-line" /><span className="divider-text">or use email</span><div className="divider-line" />
          </div>

          {/* Role selector — Customer & Seller ONLY */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>I am joining as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {ROLES.map(({ value, icon, label, desc }) => (
                <div key={value} onClick={() => set('role', value)} style={{ cursor: 'pointer' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    padding: '14px 12px', borderRadius: 12,
                    border: `2px solid ${form.role === value ? 'var(--gold)' : 'var(--border)'}`,
                    background: form.role === value ? 'rgba(201,149,42,0.07)' : '#fff',
                    transition: 'all 0.18s', userSelect: 'none',
                  }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: form.role === value ? 'var(--gold)' : 'var(--dark)' }}>{label}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {apiErr && <div className="api-error">{apiErr}</div>}

          {/* Name */}
          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>First name</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input type="text" placeholder="Jane" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Last name</label>
              <div className="input-wrap">
                <input type="text" placeholder="Smith" value={form.lastName} onChange={e => set('lastName', e.target.value)} className="no-icon" />
              </div>
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password <span style={{ color: 'var(--muted)', fontSize: 11 }}>(min. 8 characters)</span></label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type="password" placeholder="Create a strong password" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div className="checkbox-row">
            <input type="checkbox" id="agree" checked={form.agree} onChange={e => set('agree', e.target.checked)} />
            <label htmlFor="agree">I agree to the <a>Terms of Service</a> and <a>Privacy Policy</a></label>
          </div>
          {errors.agree && <div className="form-error" style={{ marginTop: -10, marginBottom: 12 }}>{errors.agree}</div>}

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner-row"><span className="spinner" /> Creating account...</span> : 'Create account →'}
          </button>

          <p className="auth-switch">Already have an account? <a onClick={() => navigate('/login')}>Log in</a></p>
        </div>
      </div>
    </div>
  );
}