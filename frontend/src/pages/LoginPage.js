import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { GoogleIcon } from '../components/GoogleIcon';
import './auth.css';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setApiErr(''); };

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
          <div className="auth-panel-logo">
            <div className="panel-dot" /> ShopAI
          </div>
          <h2 className="auth-panel-title">Welcome<br /><em>back.</em></h2>
          <p className="auth-panel-sub">Your personalised AI shopping experience awaits. Log in to continue.</p>
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

          {/* Google login */}
          <button className="btn-google" onClick={handleGoogle}>
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="divider">
            <div className="divider-line" /><span className="divider-text">or continue with email</span><div className="divider-line" />
          </div>

          {apiErr && <div className="api-error">{apiErr}</div>}

          <div className="form-group">
            <label>Email address</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input type="password" placeholder="Enter your password" value={form.password}
                onChange={e => set('password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <a style={{ fontSize: 13, color: 'var(--gold)', cursor: 'pointer' }}>Forgot password?</a>
          </div>

          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner-row"><span className="spinner" /> Signing in...</span> : 'Log in'}
          </button>

          <p className="auth-switch">New here? <a onClick={() => navigate('/signup')}>Create an account</a></p>
        </div>
      </div>
    </div>
  );
}