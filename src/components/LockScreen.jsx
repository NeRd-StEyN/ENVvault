import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, User, LogOut, RefreshCw } from 'lucide-react';
import { hasVault, createVault, unlockVault } from '../vault/vault.js';

export default function LockScreen({ onUnlocked, user, onSignOut }) {
  const [vaultExists, setVaultExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hasVault().then((exists) => {
      setVaultExists(exists);
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 8) {
      return setError('Master password must be at least 8 characters');
    }
    
    setUnlocking(true);
    try {
      await createVault(password);
      onUnlocked();
    } catch (err) {
      setError(err.message);
      setUnlocking(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    setError('');
    try {
      await unlockVault(password);
      onUnlocked();
    } catch (err) {
      setError(err.message);
      setUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <RefreshCw size={24} className="spin" color="var(--text-secondary)" />
      </div>
    );
  }

  return (
    <div className="center-screen">
      <div className="lock-card">
        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {vaultExists
            ? <Lock size={44} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
            : <ShieldAlert size={44} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
          }
          <h1 style={{ margin: 0, fontSize: '1.8rem' }}>EnvVault</h1>
          <p className="text-muted" style={{ marginTop: '0.4rem' }}>
            {vaultExists ? 'Vault Locked' : 'Set your master password'}
          </p>
        </div>

        {/* Logged-in user pill */}
        {user && (
          <div className="lock-user-pill">
            <User size={13} />
            <span>{user.displayName || user.email}</span>
            <button
              className="lock-signout-btn"
              onClick={onSignOut}
              title="Sign out"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}

        {/* New vault creation form */}
        {!vaultExists && (
          <form onSubmit={handleCreate} style={{ width: '100%' }}>
            {error && <div className="error-text">{error}</div>}

            <div className="lock-notice">
              <p className="text-small text-muted" style={{ margin: 0 }}>
                This is your <strong>vault master password</strong> — separate from your account password.<br />
                It encrypts your secrets locally. <strong>We never see it.</strong><br />
                If you forget it, your data <strong>cannot be recovered</strong>.
              </p>
            </div>

            <input
              type="password"
              placeholder="Master Password (min 8 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm Master Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={unlocking}
            >
              {unlocking
                ? <><RefreshCw size={16} className="spin" /> Creating…</>
                : 'Create Vault'
              }
            </button>
          </form>
        )}

        {/* Unlock existing vault */}
        {vaultExists && (
          <form onSubmit={handleUnlock} style={{ width: '100%' }}>
            {error && <div className="error-text">{error}</div>}
            <input
              type="password"
              placeholder="Master Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={unlocking}
            >
              {unlocking
                ? <><RefreshCw size={16} className="spin" /> Unlocking…</>
                : <><Unlock size={16} /> Unlock</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
