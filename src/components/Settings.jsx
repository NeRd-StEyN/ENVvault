import React, { useState, useRef, useEffect } from 'react';
import { changeMasterPassword, wipeVault } from '../vault/vault.js';
import { exportBackup, importBackup } from '../vault/backup.js';
import {
  Settings as SettingsIcon, Download, Upload, Key, ArrowLeft,
  Shield, Clock, Palette, LogOut, Trash2, User, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function Settings({ onBack, onLock, onSignOut, user }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [wipePending, setWipePending] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const fileInputRef = useRef(null);

  const [autoLock, setAutoLock] = useState(localStorage.getItem('envvault_autolock') || '10');
  const [theme, setTheme] = useState(localStorage.getItem('envvault_theme') || 'system');

  useEffect(() => {
    localStorage.setItem('envvault_autolock', autoLock);
  }, [autoLock]);

  useEffect(() => {
    localStorage.setItem('envvault_theme', theme);
    window.dispatchEvent(new Event('theme_changed'));
  }, [theme]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return showMessage('Master password must be at least 8 characters', 'error');
    }
    if (newPassword !== confirmNewPassword) {
      return showMessage('Passwords do not match', 'error');
    }
    try {
      await changeMasterPassword(newPassword);
      showMessage('Master password changed. Vault re-encrypted and synced to cloud.');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showMessage(err.message, 'error');
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
      showMessage('Encrypted backup exported successfully.');
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
        showMessage('Backup imported. Locking vault to apply…');
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
      return showMessage('Type DELETE to confirm', 'error');
    }
    try {
      await wipeVault();
      showMessage('Vault wiped. Signing out…');
      setTimeout(() => onSignOut(), 2000);
    } catch (err) {
      showMessage(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="header flex-between">
        <div>
          <button className="btn" onClick={onBack} style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
            <ArrowLeft size={16} /> Dashboard
          </button>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <span className="text-muted text-small">Manage your vault</span>
        </div>
      </div>

      {message.text && (
        <div className="card" style={{
          borderColor: message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)',
          color: message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)'
        }}>
          {message.text}
        </div>
      )}

      {/* Account */}
      {user && (
        <div className="card">
          <h3><User size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Account</h3>
          <p className="text-muted text-small" style={{ marginBottom: '0.5rem' }}>
            Signed in as <strong>{user.email}</strong>
            {user.displayName && ` (${user.displayName})`}
          </p>
          <p className="text-muted text-small" style={{ marginBottom: '1rem' }}>
            Your encrypted vault syncs to the cloud automatically when online.
          </p>
          <button className="btn btn-danger" onClick={onSignOut} style={{ background: 'transparent' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      )}

      {/* Security */}
      <div className="card">
        <h3><Shield size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Security</h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}><Clock size={14} /> Auto-lock timeout</strong>
          <select
            value={autoLock}
            onChange={e => setAutoLock(e.target.value)}
            style={{ padding: '0.5rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', outline: 'none' }}
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="never">Never</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <strong style={{ display: 'block', marginBottom: '0.5rem' }}><Key size={14} /> Change Master Password</strong>
          <p className="text-muted text-small" style={{ marginBottom: '1rem' }}>
            Re-encrypts your entire vault with the new password and syncs to cloud.
          </p>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <input
              type="password"
              placeholder="New Master Password (min 8 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Master Password"
              value={confirmNewPassword}
              onChange={e => setConfirmNewPassword(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Change Master Password
            </button>
          </form>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <button className="btn btn-danger" onClick={onLock} style={{ background: 'transparent', border: 'none' }}>
            <Shield size={14} /> Lock Vault Now
          </button>
        </div>
      </div>

      {/* Backup & Recovery */}
      <div className="card">
        <h3><Shield size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Backup & Recovery</h3>
        <p className="text-muted text-small" style={{ marginBottom: '1rem' }}>
          Your vault syncs to cloud automatically. Export a local encrypted backup as an extra safety net.
        </p>
        <div className="flex-gap">
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} /> Export Encrypted Backup
          </button>
          <button className="btn" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleImport}
          />
        </div>
        <p className="text-muted text-small" style={{ marginTop: '1rem' }}>
          <strong>Note:</strong> Importing overwrites your current vault.
        </p>
      </div>

      {/* Appearance */}
      <div className="card">
        <h3><Palette size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Appearance</h3>
        <div className="flex-gap">
          <button className={`btn ${theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
          <button className={`btn ${theme === 'light' ? 'btn-primary' : ''}`} onClick={() => setTheme('light')}>Light</button>
          <button className={`btn ${theme === 'system' ? 'btn-primary' : ''}`} onClick={() => setTheme('system')}>System</button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ borderColor: 'var(--error-color)' }}>
        <h3 style={{ color: 'var(--error-color)' }}>
          <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Danger Zone
        </h3>
        <p className="text-muted text-small" style={{ marginBottom: '1rem' }}>
          Permanently deletes your vault from <strong>all devices and the cloud</strong>. This cannot be undone.
        </p>
        {!wipePending ? (
          <button className="btn btn-danger" onClick={() => setWipePending(true)} style={{ background: 'transparent' }}>
            <Trash2 size={14} /> Wipe All Vault Data
          </button>
        ) : (
          <div>
            <p className="text-small" style={{ color: 'var(--error-color)', marginBottom: '0.75rem' }}>
              Type <strong>DELETE</strong> to confirm permanent destruction:
            </p>
            <div className="flex-gap">
              <input
                type="text"
                placeholder="Type DELETE"
                value={wipeConfirmText}
                onChange={e => setWipeConfirmText(e.target.value)}
                style={{ flex: 1, margin: 0, borderColor: 'var(--error-color)' }}
              />
              <button className="btn btn-danger" onClick={handleWipe}>
                <Trash2 size={14} /> Confirm Wipe
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
