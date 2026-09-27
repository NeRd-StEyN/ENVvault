import React, { useState, useRef, useEffect } from 'react';
import { changeMasterPassword, wipeVault } from '../vault/vault.js';
import { exportBackup, importBackup } from '../vault/backup.js';
import {
  Settings as SettingsIcon, Download, Upload, Key, ArrowLeft,
  Shield, Clock, LogOut, Trash2, User, RefreshCw,
  AlertTriangle, Check, ShieldCheck, HardDrive
} from 'lucide-react';

const TIMEOUT_OPTIONS = [
  { value: '5', label: '5 minutes', hint: 'Fastest lock' },
  { value: '10', label: '10 minutes', hint: 'Recommended' },
  { value: '15', label: '15 minutes', hint: 'Standard' },
  { value: '30', label: '30 minutes', hint: 'Extended session' },
  { value: '60', label: '1 hour', hint: 'Long session' },
  { value: 'never', label: 'Never', hint: 'Manual lock only' },
];

export default function Settings({ onBack, onLock, onSignOut, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [wipePending, setWipePending] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const fileInputRef = useRef(null);

  const [autoLock, setAutoLock] = useState(localStorage.getItem('envvault_autolock') || '10');

  useEffect(() => {
    localStorage.setItem('envvault_autolock', autoLock);
  }, [autoLock]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'EMPTY', color: 'var(--text-tertiary)' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score: 1, label: 'Weak (8+ characters needed)', color: 'var(--led-red)' };
    if (score === 3 || score === 4) return { score: 2, label: 'Good password', color: 'var(--amber-core)' };
    return { score: 3, label: 'Strong password', color: 'var(--led-green)' };
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return showMessage('Master password must be at least 8 characters', 'error');
    }
    if (newPassword !== confirmNewPassword) {
      return showMessage('Passwords do not match', 'error');
    }

    setChangingPassword(true);
    try {
      await changeMasterPassword(newPassword);
      showMessage('Master password updated successfully. Your vault is re-encrypted.');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExport = async () => {
    try {
      const jsonStr = await exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `envvault-backup-${new Date().toISOString().split('T')[0]}.envvault.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showMessage('Encrypted backup downloaded successfully.');
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await importBackup(event.target.result);
        showMessage('Backup imported successfully! Locking vault…');
        setTimeout(() => onLock(), 2000);
      } catch (err) {
        showMessage(`Import failed: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWipe = async () => {
    if (wipeConfirmText !== 'DELETE') {
      return showMessage('Type DELETE in capital letters to confirm', 'error');
    }
    try {
      await wipeVault();
      showMessage('All vault data deleted. Signing out…');
      setTimeout(() => onSignOut(), 2000);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Console Header */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn"
            onClick={onBack}
            style={{ marginBottom: '0.75rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <h2 style={{ margin: 0, fontSize: '1.65rem' }}>Settings & Security</h2>
          <span className="text-muted text-small text-mono">MANAGE PASSWORDS, AUTO-LOCK & BACKUPS</span>
        </div>
      </div>

      {message.text && (
        <div
          className="metal-plate"
          style={{
            borderColor: message.type === 'error' ? 'var(--led-red)' : 'var(--led-green)',
            color: message.type === 'error' ? '#fca5a5' : '#86efac',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            boxShadow: message.type === 'error' ? '0 0 15px rgba(239, 68, 68, 0.3)' : '0 0 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          <span className={`led-diode ${message.type === 'error' ? 'red' : 'green'}`} />
          <span className="text-mono" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{message.text}</span>
        </div>
      )}

      {/* Identity Plaque */}
      {user && (
        <div className="metal-plate plate-with-screws">
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <div className="flex-between" style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              <User size={18} color="var(--amber-core)" /> YOUR ACCOUNT
            </h3>
            <span className="stamped-badge">
              <span className="led-diode green" style={{ width: '7px', height: '7px' }} />
              SIGNED IN
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p className="text-mono" style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{user.email}</p>
              {user.displayName && <p className="text-muted text-small text-mono" style={{ margin: '0.15rem 0 0' }}>Name: {user.displayName}</p>}
              <p className="text-muted text-small text-mono" style={{ marginTop: '0.35rem' }}>
                Your encrypted vault syncs automatically to the cloud.
              </p>
            </div>

            <button className="btn btn-danger" onClick={onSignOut}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Auto-Lock Inactivity Console */}
      <div className="metal-plate plate-with-screws">
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Clock size={18} color="var(--amber-core)" /> AUTO-LOCK TIMER
        </h3>
        <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
          Automatically lock your vault when you are away from your screen.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {TIMEOUT_OPTIONS.map(opt => {
            const isSelected = autoLock === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => setAutoLock(opt.value)}
                className="card-interactive"
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'linear-gradient(180deg, #26262b 0%, #141417 100%)' : 'var(--metal-recess)',
                  border: isSelected ? '1px solid var(--amber-core)' : '1px solid rgba(0,0,0,0.9)',
                  boxShadow: isSelected ? '0 0 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' : 'var(--shadow-recessed)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span className="text-mono" style={{ fontWeight: 700, color: isSelected ? 'var(--amber-core)' : 'var(--text-primary)', fontSize: '0.92rem' }}>
                    {opt.label}
                  </span>
                  <span className={`led-diode ${isSelected ? 'amber' : ''}`} style={{ opacity: isSelected ? 1 : 0.2 }} />
                </div>
                <div className="text-muted text-mono" style={{ fontSize: '0.68rem' }}>
                  {opt.hint}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotate Master Password */}
      <div className="metal-plate plate-with-screws">
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Key size={18} color="var(--amber-core)" /> CHANGE MASTER PASSWORD
        </h3>
        <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
          Re-encrypts all your secrets with your new password and updates the cloud sync.
        </p>

        <form onSubmit={handlePasswordChange}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.4rem' }}>NEW MASTER PASSWORD</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-muted text-small text-mono" style={{ display: 'block', marginBottom: '0.4rem' }}>CONFIRM NEW PASSWORD</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {newPassword && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginBottom: '0.35rem' }}>
                <span className="text-muted">PASSWORD STRENGTH:</span>
                <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
              </div>
              <div style={{ height: '6px', background: '#090c12', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.9)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(strength.score / 3) * 100}%`,
                    background: strength.color,
                    boxShadow: `0 0 8px ${strength.color}`,
                    transition: 'all 0.3s'
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={changingPassword || !newPassword}
            >
              {changingPassword ? <RefreshCw size={14} className="spin" /> : <Key size={14} />}
              {changingPassword ? 'Updating password…' : 'Change Master Password'}
            </button>

            <button
              type="button"
              className="btn"
              onClick={onLock}
            >
              <Shield size={14} color="var(--amber-core)" /> Lock Vault Now
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Disaster Recovery Bays */}
      <div className="metal-plate plate-with-screws">
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <HardDrive size={18} color="var(--amber-core)" /> BACKUP & RESTORE
        </h3>
        <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
          Download an encrypted backup file to your computer, or restore a previous backup.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div className="recessed-tray" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: 0, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>DOWNLOAD BACKUP</h4>
            <p className="text-muted text-small text-mono" style={{ marginBottom: '1rem', fontSize: '0.75rem' }}>
              Downloads an encrypted <code className="text-mono" style={{ color: 'var(--amber-core)' }}>.envvault.json</code> file with all your projects and secrets.
            </p>
            <button className="btn btn-primary" onClick={handleExport} style={{ width: '100%' }}>
              <Download size={14} /> Export Backup (.json)
            </button>
          </div>

          <div className="recessed-tray" style={{ padding: '1.25rem' }}>
            <h4 style={{ margin: 0, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>RESTORE BACKUP</h4>
            <p className="text-muted text-small text-mono" style={{ marginBottom: '1rem', fontSize: '0.75rem' }}>
              Restore from a previously saved backup file. Note: This will replace current data.
            </p>
            <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ width: '100%' }}>
              <Upload size={14} /> Choose Backup File (.json)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleImport}
            />
          </div>
        </div>
      </div>

      {/* Emergency Destruct Switch */}
      <div className="metal-plate hazard-stripes" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={18} color="var(--led-red)" />
          <h3 style={{ margin: 0, color: '#fca5a5', textTransform: 'uppercase' }}>
            DANGER ZONE: DELETE ALL VAULT DATA
          </h3>
        </div>
        <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
          Permanently deletes all projects, environments, and secrets from this device and the cloud.
          <strong style={{ color: '#fca5a5' }}> This action cannot be undone.</strong>
        </p>

        {!wipePending ? (
          <button className="btn btn-danger" onClick={() => setWipePending(true)}>
            <Trash2 size={14} /> Delete All Vault Data
          </button>
        ) : (
          <div className="recessed-tray" style={{ padding: '1.25rem' }}>
            <p className="text-small text-mono" style={{ color: '#fca5a5', marginBottom: '0.85rem' }}>
              Type <strong style={{ color: 'var(--text-primary)' }}>DELETE</strong> in capital letters to confirm:
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="TYPE DELETE"
                value={wipeConfirmText}
                onChange={e => setWipeConfirmText(e.target.value)}
                style={{ flex: 1, minWidth: '180px', borderColor: 'var(--led-red)', color: '#fca5a5' }}
              />
              <button className="btn btn-danger" onClick={handleWipe}>
                <Trash2 size={14} /> Confirm Delete
              </button>
              <button className="btn" onClick={() => { setWipePending(false); setWipeConfirmText(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
