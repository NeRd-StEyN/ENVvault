import React, { useState, useEffect } from 'react';
import {
  Lock, Unlock, ShieldAlert, User, LogOut, RefreshCw,
  KeyRound, Eye, EyeOff, AlertTriangle, Cpu, Terminal, ShieldCheck
} from 'lucide-react';
import { hasVault, createVault, unlockVault } from '../vault/vault.js';

export default function LockScreen({ onUnlocked, user, onSignOut }) {
  const [vaultExists, setVaultExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    hasVault().then((exists) => {
      setVaultExists(exists);
      setLoading(false);
    });
  }, []);

  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 8) {
      return setError('Master password must be at least 8 characters');
    }

    setUnlocking(true);
    setError('');
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
      <div className="center-screen" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div className="vault-door-chassis" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <div className="vault-tumbler-dial">
            <div className="vault-tumbler-hub">
              <RefreshCw size={20} className="spin" />
            </div>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>Opening Vault</h3>
          <p className="text-muted text-small text-mono">Loading saved vault data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-screen" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div className="vault-door-chassis plate-with-screws" style={{ maxWidth: '460px', width: '100%' }}>
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        {/* Heavy Vault Rotary Tumbler Dial */}
        <div className="vault-tumbler-dial">
          <div className="vault-tumbler-hub">
            {vaultExists ? <Lock size={22} /> : <KeyRound size={22} />}
          </div>
        </div>

        {/* Machine Head Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.45rem', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
            {vaultExists ? 'Vault Locked' : 'Create Master Password'}
          </h2>
          <p className="text-muted text-small text-mono">
            {vaultExists
              ? 'Enter your master password to unlock your secrets'
              : 'Choose a master password to protect and encrypt your vault'}
          </p>
        </div>

        {/* Status Diodes & Serial Plaque */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#090c12',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.9)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`led-diode ${vaultExists ? 'red' : 'amber'}`} />
            <span className="text-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: vaultExists ? '#f87171' : '#fbbf24' }}>
              {vaultExists ? 'VAULT LOCKED' : 'NEW VAULT'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="led-diode green" />
            <span className="text-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399' }}>
              AES-256 ENCRYPTED
            </span>
          </div>
        </div>

        {/* User Serial Badge */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-xs)',
              background: 'linear-gradient(180deg, #26262b 0%, #141417 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '1px solid rgba(0,0,0,0.9)',
              marginBottom: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <User size={13} color="var(--amber-core)" />
              <span className="text-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {user.displayName || user.email}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="btn btn-danger-ghost"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.68rem', gap: '0.2rem' }}
              title="Sign out of account"
            >
              <LogOut size={11} /> Sign Out
            </button>
          </div>
        )}

        {error && (
          <div className="error-text">
            <AlertTriangle size={15} color="var(--led-red)" style={{ flexShrink: 0 }} />
            <span className="text-mono" style={{ fontSize: '0.8rem' }}>{error}</span>
          </div>
        )}

        {capsLockOn && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontSize: '0.75rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <AlertTriangle size={13} /> Caps Lock is on
          </div>
        )}

        {/* Form: Set New Master Key */}
        {!vaultExists && (
          <form onSubmit={handleCreate}>
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 'var(--radius-xs)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                fontSize: '0.75rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary)'
              }}
            >
              <strong style={{ color: 'var(--amber-core)', display: 'block', marginBottom: '0.2rem' }}>
                IMPORTANT:
              </strong>
              Your master password is the only key to unlock your secrets. There is no reset button, so please remember it.
            </div>

            <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Master Password (min 8 chars)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                required
                autoFocus
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm Master Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyDown}
              required
              style={{ marginBottom: '1.5rem' }}
            />

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.92rem' }}
              disabled={unlocking}
            >
              {unlocking ? (
                <><RefreshCw size={16} className="spin" /> Setting up vault…</>
              ) : (
                <><KeyRound size={16} /> Save Master Password & Unlock</>
              )}
            </button>
          </form>
        )}

        {/* Form: Unlock Existing Vault */}
        {vaultExists && (
          <form onSubmit={handleUnlock}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Master Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyDown}
                required
                autoFocus
                style={{ paddingRight: '2.5rem', height: '48px', fontSize: '1rem', letterSpacing: '0.05em' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} color="var(--amber-core)" /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem', letterSpacing: '0.05em' }}
              disabled={unlocking}
            >
              {unlocking ? (
                <><RefreshCw size={16} className="spin" /> Unlocking…</>
              ) : (
                <><Unlock size={16} /> Unlock Vault</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
