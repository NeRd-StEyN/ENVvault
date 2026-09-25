import React from 'react';
import { ArrowLeft, ShieldCheck, Lock, Database, Wifi, Cloud, Key } from 'lucide-react';

export default function SecurityAbout({ onBack }) {
  return (
    <div>
      <div className="header">
        <button className="btn" onClick={onBack} style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={16} /> Dashboard
        </button>
        <h2 style={{ margin: 0 }}>Security & Privacy</h2>
        <span className="text-muted text-small">Architecture details</span>
      </div>

      <div className="card">
        <h3><ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Zero-Knowledge Architecture</h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          EnvVault is a zero-knowledge client. Your secrets are encrypted locally before they ever leave your device.
          Even the server storing your encrypted vault <strong>cannot read your data</strong>.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <strong>Where is my data stored?</strong>
            <p className="text-muted text-small">
              Locally in encrypted IndexedDB on each device, and as an encrypted blob in Firebase Firestore for sync.
              Neither copy contains any readable information without your master password.
            </p>
          </div>
          <div>
            <strong>What does Firebase (the cloud) see?</strong>
            <p className="text-muted text-small">
              Only AES-256-GCM ciphertext — completely unreadable garbage without your key.
              Firebase has no idea what's in your vault. Even if Firebase were breached, your secrets are safe.
            </p>
          </div>
          <div>
            <strong>Does EnvVault know my master password?</strong>
            <p className="text-muted text-small">No. The master password never leaves your device. Ever.</p>
          </div>
          <div>
            <strong>What's the difference between my account password and master password?</strong>
            <p className="text-muted text-small">
              Your <em>account password</em> (Firebase) proves who you are — it can be reset via email.
              Your <em>master password</em> encrypts your secrets — it is cryptographically irrecoverable if forgotten.
            </p>
          </div>
          <div>
            <strong>Does it work offline?</strong>
            <p className="text-muted text-small">
              Yes. Your vault is always cached locally. You can read, edit, add, and delete env secrets with no internet.
              Changes sync automatically when you reconnect.
            </p>
          </div>
          <div>
            <strong>Can EnvVault recover my master password?</strong>
            <p className="text-muted text-small">No. Cryptographically impossible.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3><Lock size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Cryptography</h3>
        <ul className="text-muted text-small" style={{ paddingLeft: '1.5rem', lineHeight: 1.8 }}>
          <li><strong>Encryption:</strong> AES-256-GCM (authenticated encryption)</li>
          <li><strong>Key Derivation:</strong> PBKDF2-HMAC-SHA-256</li>
          <li><strong>Iterations:</strong> ≥ 250,000 (OWASP recommended)</li>
          <li><strong>IV:</strong> Fresh 96-bit random IV per encrypt operation</li>
          <li><strong>Implementation:</strong> Browser-native Web Crypto API (no JS crypto libs)</li>
          <li><strong>Memory:</strong> Key held only in JS memory, cleared on lock</li>
        </ul>
      </div>

      <div className="card">
        <h3><Database size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Storage</h3>
        <p className="text-muted text-small">
          All data is encrypted before being stored. No plaintext project names, environment names, or secret values
          are ever written to disk, IndexedDB, or Firestore. The salt and KDF parameters are the only non-encrypted
          fields — they are not secret and are required for key derivation.
        </p>
      </div>

      <div className="card">
        <h3><Cloud size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Cloud Sync</h3>
        <p className="text-muted text-small">
          The Firestore document for your account contains only the encrypted blob. Firebase Security Rules
          ensure you can only read and write your own document — not another user's. Cross-device sync happens
          automatically: on unlock, the freshest cloud copy is downloaded; on every edit, the encrypted vault
          is re-uploaded in the background.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
        <p className="text-small">EnvVault v2.0.0 · Zero-Knowledge · Offline-First</p>
      </div>
    </div>
  );
}
