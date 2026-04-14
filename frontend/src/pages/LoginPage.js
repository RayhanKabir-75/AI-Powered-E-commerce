import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import API from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

// ─────────────────────────────────────────────────────────────────────────────
// PASTE YOUR GOOGLE CLIENT ID HERE — just replace the string below
// Get it from: console.cloud.google.com → APIs & Services → Credentials
// ─────────────────────────────────────────────────────────────────────────────
//const GOOGLE_CLIENT_ID = '988540202332-ta0u4omgr7kutb8e9nlj19256fjnlbe1.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [email,   setEmail]   = useState('');
  const [step,    setStep]    = useState('email');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSend = async () => {
    if (!email)                      { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.');    return; }
    setLoading(true);
    setError('');
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
            <p className="modal-sub">Enter your account email and we'll send you a reset link.</p>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <label>Email address</label>
              <div className="input-wrap">
                <span className="input-icon">✉</span>
                <input type="email" placeholder="you@example.com" value={email} autoFocus
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSend()} />
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
              We sent a reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, textAlign: 'center' }}>
              Didn't receive it? Check spam or{' '}
              <button className="link-btn" onClick={() => setStep('email')}>try again</button>.
            </p>
            <button className="btn-submit" onClick={onClose}>Back to login</button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form,       setForm]       = useState({ email: '', password: '' });
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [apiErr,     setApiErr]     = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [gLoading,   setGLoading]   = useState(false);

  // ── Load Google Identity Services script ──────────────────────────────────
  useEffect(() => {
    // Only load if not already loaded
    if (document.getElementById('google-gsi-script')) return;
    const script = document.createElement('script');
    script.id  = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
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
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  // ── Email login ───────────────────────────────────────────────────────────
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

  // ── Google login ──────────────────────────────────────────────────────────
  // Uses Google Identity Services (GIS) — no package needed, loads via script tag.
  // When user picks their Google account, Google calls this callback with a
  // credential (JWT ID token). We send that to our Django backend to verify.
  const handleGoogle = () => {
    if (!window.google) {
      setApiErr('Google Sign-In is still loading. Please wait a moment and try again.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        // response.credential is a JWT ID token from Google
        setGLoading(true);
        setApiErr('');
        try {
          const res = await API.post('auth/google/', {
            credential: response.credential,
            role: 'customer',
          });
          onLogin(res.data.user, res.data.token);
          navigate('/home');
        } catch (err) {
          setApiErr(err.response?.data?.error || 'Google sign-in failed. Please try again.');
        } finally {
          setGLoading(false);
        }
      },
    });

    // Open the One Tap / account picker popup
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was blocked — fall back to the full popup flow
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-container-login'),
          { theme: 'outline', size: 'large', width: 400 }
        );
      }
    });
  };

  return (
    <>
      <div className="auth-layout page">
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

        <div className="auth-form-side">
          <div className="auth-form-box">
            <button className="auth-back" onClick={() => navigate('/')}>← Back to home</button>
            <h1 className="auth-heading">Log in</h1>
            <p className="auth-subheading">
              Don't have an account?{' '}
              <button className="link-btn" onClick={() => navigate('/signup')}>Sign up</button>
            </p>

            {/* Google button — custom styled, triggers GIS popup */}
            <button className="btn-google" onClick={handleGoogle} disabled={gLoading}>
              {gLoading
                ? <span className="spinner-row"><span className="spinner" style={{ borderTopColor: '#4285F4' }} /> Connecting...</span>
                : <><GoogleIcon /> Continue with Google</>}
            </button>

            {/* Hidden container GIS uses if One Tap is blocked */}
            <div id="google-btn-container-login" style={{ marginBottom: 8 }} />

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

            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <button className="link-btn" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </button>
            </div>

            <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <span className="spinner-row"><span className="spinner" /> Signing in...</span>
                : 'Log in'}
            </button>

            <p className="auth-switch">
              New here?{' '}
              <button className="link-btn" onClick={() => navigate('/signup')}>Create an account</button>
            </p>
          </div>
        </div>
      </div>

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </>
  );
}