import React, { useState } from 'react';
import { Lock, Mail, User, ArrowRight, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import { registerUser, signInUser, sendResetEmail } from '../auth/auth.js';

// 'signin' | 'signup' | 'reset'
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
      return 'Invalid email or password.';
    }
    if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
    if (code.includes('invalid-email')) return 'Please enter a valid email address.';
    if (code.includes('network-request-failed')) return 'No internet connection. Please try again.';
    if (code.includes('too-many-requests')) return 'Too many attempts. Please try again later.';
    return err?.message || 'Something went wrong. Please try again.';
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
    <div className="auth-screen">
      <div className="auth-card">
        {/* Logo & Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <Lock size={28} color="#58a6ff" />
          </div>
          <h1 className="auth-title">EnvVault</h1>
          <p className="auth-subtitle">Zero-knowledge secret management</p>
        </div>

        {/* Security badges */}
        <div className="auth-badges">
          <span className="auth-badge"><ShieldCheck size={12} /> AES-256-GCM</span>
          <span className="auth-badge"><ShieldCheck size={12} /> Zero-knowledge</span>
          <span className="auth-badge"><ShieldCheck size={12} /> Offline-first</span>
        </div>

        {/* Sign In Form */}
        {view === VIEWS.SIGNIN && (
          <form onSubmit={handleSignIn} className="auth-form">
            <h2 className="auth-form-title">Welcome back</h2>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <KeyRound size={16} className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Account password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="auth-input"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw size={16} className="spin" />
              ) : (
                <ArrowRight size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchView(VIEWS.RESET)}>
                Forgot password?
              </button>
              <span className="auth-link-sep">·</span>
              <button type="button" className="auth-link" onClick={() => switchView(VIEWS.SIGNUP)}>
                Create account
              </button>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {view === VIEWS.SIGNUP && (
          <form onSubmit={handleSignUp} className="auth-form">
            <h2 className="auth-form-title">Create account</h2>

            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label className="auth-label">Display name <span className="auth-optional">(optional)</span></label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  autoComplete="name"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="auth-input"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <KeyRound size={16} className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Zero-knowledge notice */}
            <div className="auth-notice">
              <ShieldCheck size={14} color="var(--success-color)" />
              <p>
                Your account password lets you log in.<br />
                You'll set a separate <strong>vault master password</strong> next —
                that's what encrypts your secrets. We never see it.
              </p>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              disabled={loading}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchView(VIEWS.SIGNIN)}>
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {/* Password Reset Form */}
        {view === VIEWS.RESET && (
          <form onSubmit={handleReset} className="auth-form">
            <h2 className="auth-form-title">Reset password</h2>

            {error && <div className="auth-error">{error}</div>}

            {resetSent ? (
              <div className="auth-success">
                ✅ Reset email sent to <strong>{email}</strong>.<br />
                Check your inbox and follow the link.
              </div>
            ) : (
              <>
                <p className="auth-reset-note">
                  Enter your account email and we'll send a reset link.<br />
                  <strong>Note:</strong> This only resets your account login — your vault master
                  password is separate and cannot be recovered.
                </p>

                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={loading}
                >
                  {loading ? <RefreshCw size={16} className="spin" /> : <Mail size={16} />}
                  {loading ? 'Sending…' : 'Send Reset Email'}
                </button>
              </>
            )}

            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchView(VIEWS.SIGNIN)}>
                Back to sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
