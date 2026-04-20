import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/api';
import './auth.css';

export default function ResetPasswordPage() {
  const { uid, token } = useParams();
  const navigate       = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const validate = () => {
    if (!password || !confirm)    return 'Both fields are required.';
    if (password.length < 8)      return 'Password must be at least 8 characters.';
    if (password !== confirm)     return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError('');
    try {
      await resetPassword(uid, token, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout page">

      {/* ── Left branding panel — matches Login / Signup ── */}
      <div className="auth-panel">
        <div className="auth-panel-bg" />
        <div className="auth-panel-content">
          <div className="auth-panel-logo">
            <div className="panel-dot" /> ShopAI
          </div>
          <h2 className="auth-panel-title">
            Set a new<br /><em>password.</em>
          </h2>
          <p className="auth-panel-sub">
            Choose a strong password to keep your ShopAI account secure.
          </p>

          {/* Password tips */}
          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              '✦  At least 8 characters long',
              '✦  Mix letters, numbers and symbols',
              '✦  Avoid using your name or email',
              '✦  Never reuse old passwords',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-side">
        <div className="auth-form-box">

          <button className="auth-back" onClick={() => navigate('/login')}>
            ← Back to login
          </button>

          {success ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
              <h1 className="auth-heading">Password reset!</h1>
              <p style={{
                fontSize: 15, color: 'var(--muted)', lineHeight: 1.65,
                marginBottom: 28,
              }}>
                Your password has been updated successfully.
                You'll be redirected to the login page in a moment.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, color: 'var(--muted)', fontSize: 13,
              }}>
                <span className="spinner" style={{ borderTopColor: 'var(--gold)' }} />
                Redirecting to login...
              </div>
            </div>

          ) : (
            /* ── Form state ── */
            <>
              <h1 className="auth-heading">Reset password</h1>
              <p className="auth-subheading">
                Enter and confirm your new password below.
              </p>

              {error && <div className="api-error">{error}</div>}

              <div className="form-group">
                <label>New password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      height: 4, borderRadius: 999, background: 'var(--border)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        transition: 'width 0.3s, background 0.3s',
                        width:
                          password.length >= 12 ? '100%' :
                          password.length >= 8  ? '66%'  :
                          password.length >= 4  ? '33%'  : '10%',
                        background:
                          password.length >= 12 ? '#27AE60' :
                          password.length >= 8  ? 'var(--gold)' : 'var(--danger)',
                      }} />
                    </div>
                    <div style={{
                      fontSize: 11, marginTop: 4,
                      color:
                        password.length >= 12 ? '#27AE60' :
                        password.length >= 8  ? 'var(--gold)' : 'var(--danger)',
                    }}>
                      {password.length >= 12 ? 'Strong password' :
                       password.length >= 8  ? 'Good password' :
                       'Too short'}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm new password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                {/* Match indicator */}
                {confirm.length > 0 && (
                  <div style={{
                    fontSize: 11, marginTop: 4,
                    color: password === confirm ? '#27AE60' : 'var(--danger)',
                  }}>
                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>

              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading
                  ? <span className="spinner-row"><span className="spinner" /> Resetting...</span>
                  : 'Set new password'}
              </button>

              <p className="auth-switch">
                Remember your password?{' '}
                <button className="link-btn" onClick={() => navigate('/login')}>
                  Log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}