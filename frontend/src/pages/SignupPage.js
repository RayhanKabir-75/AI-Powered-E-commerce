import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/api';
import API from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

// ─────────────────────────────────────────────────────────────────────────────
// PASTE YOUR GOOGLE CLIENT ID HERE — same value as in LoginPage.js
// ─────────────────────────────────────────────────────────────────────────────
//const GOOGLE_CLIENT_ID = '988540202332-ta0u4omgr7kutb8e9nlj19256fjnlbe1.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const ROLES = [
  { value: 'customer', icon: '🛍️', label: 'Customer', desc: 'Browse & buy products with AI-powered picks' },
  { value: 'seller',   icon: '🏪', label: 'Seller',   desc: 'List products & grow your business with AI tools' },
];

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'customer', agree: false,
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiErr,   setApiErr]   = useState('');
  const [gLoading, setGLoading] = useState(false);

  // ── Load Google Identity Services script ──────────────────────────────────
  useEffect(() => {
    if (document.getElementById('google-gsi-script')) return;
    const script = document.createElement('script');
    script.id    = 'google-gsi-script';
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setApiErr('');
  };

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

  // ── Email signup ──────────────────────────────────────────────────────────
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
      navigate(res.data.user.role === 'seller' ? '/seller' : '/home');
    } catch (err) {
      const data = err.response?.data;
      setApiErr(data?.email?.[0] || data?.password?.[0] || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google signup ─────────────────────────────────────────────────────────
  const handleGoogle = () => {
    if (!window.google) {
      setApiErr('Google Sign-In is still loading. Please wait a moment and try again.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        setGLoading(true);
        setApiErr('');
        try {
          const res = await API.post('auth/google/', {
            credential: response.credential,  // JWT ID token
            role: form.role,                  // customer or seller
          });
          onLogin(res.data.user, res.data.token);
          navigate(res.data.user.role === 'seller' ? '/seller' : '/home');
        } catch (err) {
          setApiErr(err.response?.data?.error || 'Google sign-up failed. Please try again.');
        } finally {
          setGLoading(false);
        }
      },
    });

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-container-signup'),
          { theme: 'outline', size: 'large', width: 400 }
        );
      }
    });
  };

  return (
    <div className="auth-layout page">
      <div className="auth-panel">
        <div className="auth-panel-bg" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo"><div className="panel-dot" /> ShopAI</div>
          <h2 className="auth-panel-title">Join the<br /><em>future</em> of<br />shopping.</h2>
          <p className="auth-panel-sub">Create an account and get instant access to AI-powered product discovery.</p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['✦  Personalised AI recommendations', '✦  AI-generated product insights',
              '✦  24/7 conversational assistant',   '✦  NLP-powered review summaries'].map((f, i) => (
              <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side" style={{ overflowY: 'auto', padding: '40px 48px' }}>
        <div className="auth-form-box">
          <button className="auth-back" onClick={() => navigate('/')}>← Back to home</button>
          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">
            Already have one?{' '}
            <button className="link-btn" onClick={() => navigate('/login')}>Log in</button>
          </p>

          {/* Role selector — select BEFORE clicking Google so role is passed */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              I am joining as
            </label>
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

          <button className="btn-google" onClick={handleGoogle} disabled={gLoading}>
            {gLoading
              ? <span className="spinner-row"><span className="spinner" style={{ borderTopColor: '#4285F4' }} /> Connecting...</span>
              : <><GoogleIcon /> Sign up with Google</>}
          </button>

          {/* Hidden container GIS uses if One Tap is blocked */}
          <div id="google-btn-container-signup" style={{ marginBottom: 8 }} />

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or use email</span>
            <div className="divider-line" />
          </div>

          {apiErr && <div className="api-error">{apiErr}</div>}

          <div className="form-row" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>First name</label>
              <div className="input-wrap">
                <span className="input-icon">👤</span>
                <input type="text" placeholder="Jane"
                  value={form.firstName} onChange={e => set('firstName', e.target.value)} />
              </div>
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Last name</label>
              <div className="input-wrap">
                <input type="text" placeholder="Smith" className="no-icon"
                  value={form.lastName} onChange={e => set('lastName', e.target.value)} />
              </div>
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
          </div>

          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
              <input type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password <span style={{ color: 'var(--muted)', fontSize: 11 }}>(min. 8 characters)</span></label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type="password" placeholder="Create a strong password"
                value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div className="checkbox-row">
            <input type="checkbox" id="agree" checked={form.agree}
              onChange={e => set('agree', e.target.checked)} />
            <label htmlFor="agree">
              I agree to the{' '}
              <button className="link-btn" onClick={() => alert('Terms of Service — coming soon!')}>Terms of Service</button>
              {' '}and{' '}
              <button className="link-btn" onClick={() => alert('Privacy Policy — coming soon!')}>Privacy Policy</button>
            </label>
          </div>
          {errors.agree && <div className="form-error" style={{ marginTop: -10, marginBottom: 12 }}>{errors.agree}</div>}

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <span className="spinner-row"><span className="spinner" /> Creating account...</span>
              : 'Create account →'}
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <button className="link-btn" onClick={() => navigate('/login')}>Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
}