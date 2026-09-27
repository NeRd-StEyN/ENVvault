import React, { useState } from 'react';
import {
  Shield, Mail, User, ArrowRight, KeyRound, ShieldCheck,
  RefreshCw, Terminal, CheckCircle2, Lock, Cpu, Cloud
} from 'lucide-react';
import { registerUser, signInUser, sendResetEmail } from '../auth/auth.js';

const VIEWS = { SIGNIN: 'signin', SIGNUP: 'signup', RESET: 'reset' };

export default function AuthScreen({ onAuthenticated }) {
  const [view, setView] = useState(VIEWS.SIGNIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const clearForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
    setResetSent(false);
  };

  const switchView = (v) => {
    clearForm();
    setView(v);
  };

  const friendlyError = (err) => {
    const code = err?.code || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Incorrect email or password.';
    }
    if (code.includes('email-already-in-use')) return 'An account with this email already exists. Please sign in.';
    if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
    if (code.includes('invalid-email')) return 'Please enter a valid email address.';
    if (code.includes('network-request-failed')) return 'Network error. Please check your internet connection.';
    if (code.includes('too-many-requests')) return 'Too many attempts. Please try again in a moment.';
    return err?.message || 'Unable to sign in. Please try again.';
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInUser(email, password);
      onAuthenticated();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    setLoading(true);
    setError('');
    try {
      await registerUser(email, password, displayName.trim() || undefined);
      onAuthenticated();
    } catch (err) {
      setError(friendlyError(err));
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendResetEmail(email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="vault-door-chassis plate-with-screws" style={{ maxWidth: '460px', width: '100%' }}>
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        {/* Brand Shield Hub */}
        <div className="vault-tumbler-dial">
          <div className="vault-tumbler-hub">
            <Shield size={24} />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
            ENVVAULT
          </h1>
          <p className="text-muted text-small text-mono">
            SECURE ENVIRONMENT VARIABLE VAULT
          </p>
        </div>

        {/* Hardware Status Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: '#090c12',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            marginBottom: '1.5rem',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="led-diode green" />
            <span style={{ color: '#34d399', fontWeight: 700 }}>AES-256-GCM</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="led-diode amber" />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>CLOUD SYNC</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="led-diode amber" />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>ZERO-KNOWLEDGE</span>
          </div>
        </div>

        {/* Tactical View Switcher */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: view === VIEWS.RESET ? '1fr' : '1fr 1fr',
            background: '#090c12',
            padding: '0.3rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            marginBottom: '1.5rem'
          }}
        >
          {view === VIEWS.RESET ? (
            <button
              className="btn btn-primary"
              style={{ padding: '0.45rem', fontSize: '0.78rem' }}
            >
              RESET PASSWORD
            </button>
          ) : (
            <>
              <button
                className={`btn ${view === VIEWS.SIGNIN ? 'btn-primary' : ''}`}
                onClick={() => switchView(VIEWS.SIGNIN)}
                style={{ padding: '0.45rem', fontSize: '0.78rem' }}
              >
                SIGN IN
              </button>
              <button
                className={`btn ${view === VIEWS.SIGNUP ? 'btn-primary' : ''}`}
                onClick={() => switchView(VIEWS.SIGNUP)}
                style={{ padding: '0.45rem', fontSize: '0.78rem' }}
              >
                CREATE ACCOUNT
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="error-text">
            <span className="text-mono" style={{ fontSize: '0.8rem' }}>{error}</span>
          </div>
        )}

        {/* SIGN IN */}
        {view === VIEWS.SIGNIN && (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.35rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                <label className="text-muted text-small text-mono" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                  PASSWORD
                </label>
                <button
                  type="button"
                  onClick={() => switchView(VIEWS.RESET)}
                  style={{ background: 'none', border: 'none', color: 'var(--amber-core)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? (
                <><RefreshCw size={16} className="spin" /> Signing in…</>
              ) : (
                <><ArrowRight size={16} /> Sign In</>
              )}
            </button>
          </form>
        )}

        {/* SIGN UP */}
        {view === VIEWS.SIGNUP && (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                YOUR NAME (OPTIONAL)
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  autoComplete="name"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.35rem' }}>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                PASSWORD (MIN 6 CHARS)
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? (
                <><RefreshCw size={16} className="spin" /> Creating account…</>
              ) : (
                <><ArrowRight size={16} /> Create Account</>
              )}
            </button>
          </form>
        )}

        {/* RESET */}
        {view === VIEWS.RESET && (
          <form onSubmit={handleReset}>
            {resetSent ? (
              <div className="recessed-tray" style={{ padding: '1rem', marginBottom: '1.25rem', color: '#86efac', fontSize: '0.85rem', lineHeight: 1.6 }}>
                <CheckCircle2 size={18} style={{ marginBottom: '0.35rem', display: 'block' }} />
                Password reset link sent to <strong>{email}</strong>. Please check your inbox.
              </div>
            ) : (
              <>
                <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem', lineHeight: 1.6 }}>
                  Enter your email to receive a password reset link.<br />
                  <strong style={{ color: '#fff' }}>Note:</strong> This resets your account login. It cannot recover your vault master password if you forget it.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.72rem', fontWeight: 700 }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem' }}
                  disabled={loading}
                >
                  {loading ? <RefreshCw size={16} className="spin" /> : <Mail size={16} />}
                  {loading ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => switchView(VIEWS.SIGNIN)}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
