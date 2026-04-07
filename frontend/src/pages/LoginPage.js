import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

// ── Forgot Password Modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email,   setEmail]   = useState('');
  const [step,    setStep]    = useState('email');   // 'email' | 'sent'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async () => {
    if (!email) { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }

    setLoading(true);
    setError('');

    // Simulate sending — in production call your backend reset endpoint:
    // await API.post('auth/password-reset/', { email })
    await new Promise(res => setTimeout(res, 1400));

    setLoading(false);
    setStep('sent');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {step === 'email' ? (
          <>
            <div className="modal-icon">🔑</div>
            <h3 className="modal-title">Forgot your password?</h3>
            <p className="modal-sub">
              Enter your account email and we'll send you a link to reset your password.
            </p>

            <div className="form-group" style={{ marginBottom: 8 }}>
              <label>Email address</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  autoFocus
                />
              </div>
              {error && <div className="form-error">{error}</div>}
            </div>

            <button className="btn-submit" onClick={handleSend} disabled={loading}>
              {loading
                ? <span className="spinner-row"><span className="spinner" /> Sending...</span>
                : 'Send reset link'}
            </button>

            <button className="modal-cancel" onClick={onClose}>Cancel</button>
          </>
        ) : (
          <>
            <div className="modal-icon">📧</div>
            <h3 className="modal-title">Check your email</h3>
            <p className="modal-sub">
              We've sent a password reset link to <strong>{email}</strong>.
              Check your inbox and follow the instructions.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, textAlign: 'center' }}>
              Didn't receive it? Check your spam folder or{' '}
              <a style={{ color: 'var(--gold)', cursor: 'pointer' }}
                onClick={() => setStep('email')}>try again</a>.
            </p>
            <button className="btn-submit" onClick={onClose}>Back to login</button>
          </>
        )}
      </div>
    </div>
  );
}


// ── Login Page ───────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form,         setForm]         = useState({ email: '', password: '' });
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [apiErr,       setApiErr]       = useState('');
  const [forgotOpen,   setForgotOpen]   = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
    setApiErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const res = await loginUser({ email: form.email, password: form.password });
      onLogin(res.data.user, res.data.token);
      navigate('/home');
    } catch (err) {
      setApiErr(err.response?.data?.non_field_errors?.[0] || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    alert('Google OAuth: integrate react-oauth/google in production.');
  };

  return (
    <>
      <div className="auth-layout page">
        {/* Left branding panel */}
        <div className="auth-panel">
          <div className="auth-panel-bg" />
          <div className="auth-panel-content">
            <div className="auth-panel-logo"><div className="panel-dot" /> ShopAI</div>
            <h2 className="auth-panel-title">Welcome<br /><em>back.</em></h2>
            <p className="auth-panel-sub">Your personalised AI shopping experience awaits.</p>
            <div className="auth-testimonial">
              <p>"The AI recommendations are scarily good — it suggested a product I didn't even know I wanted."</p>
              <div className="auth-testimonial-author">
                <div className="auth-avatar">M</div>
                <div className="auth-author-info">
                  <div className="auth-author-name">Maria K.</div>
                  <small>Verified Customer</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="auth-form-side">
          <div className="auth-form-box">
            <button className="auth-back" onClick={() => navigate('/')}>← Back to home</button>
            <h1 className="auth-heading">Log in</h1>
            <p className="auth-subheading">Don't have an account? <a onClick={() => navigate('/signup')}>Sign up</a></p>

            <button className="btn-google" onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or continue with email</span>
              <div className="divider-line" />
            </div>

            {apiErr && <div className="api-error">{apiErr}</div>}

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
              <label>Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Enter your password"
                  value={form.password} onChange={e => set('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            {/* Forgot password — now functional */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <a
                style={{ fontSize: 13, color: 'var(--gold)', cursor: 'pointer' }}
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </a>
            </div>

            <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <span className="spinner-row"><span className="spinner" /> Signing in...</span>
                : 'Log in'}
            </button>

            <p className="auth-switch">New here? <a onClick={() => navigate('/signup')}>Create an account</a></p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal — rendered outside layout so it overlays everything */}
      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </>
  );
}