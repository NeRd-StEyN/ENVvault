import React from 'react';
import {
  ArrowLeft, ShieldCheck, Lock, Database, Wifi, Cloud,
  Key, Cpu, Terminal, ArrowRight, ShieldAlert, CheckCircle2
} from 'lucide-react';

export default function SecurityAbout({ onBack }) {
  return (
    <div>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn"
            onClick={onBack}
            style={{ marginBottom: '0.75rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <h2 style={{ margin: 0, fontSize: '1.65rem' }}>Security & How It Works</h2>
          <span className="text-muted text-small text-mono">ZERO-KNOWLEDGE ENCRYPTION EXPLAINED SIMPLY</span>
        </div>
      </div>

      {/* 5-Stage Cryptographic Assembly Line */}
      <div className="metal-plate plate-with-screws" style={{ marginBottom: '1.5rem' }}>
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Lock size={18} color="var(--amber-core)" /> HOW YOUR SECRETS STAY SAFE (STEP BY STEP)
        </h3>
        <p className="text-muted text-small text-mono" style={{ marginBottom: '1.5rem' }}>
          Here is what happens behind the scenes to keep your environment variables private:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="stamped-badge" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>STEP 01</div>
            <h4 style={{ fontSize: '0.85rem', margin: 0, marginBottom: '0.2rem', color: '#fff' }}>Your Master Password</h4>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem' }}>Only you know it. It is never sent over the internet or saved to any server.</p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="stamped-badge" style={{ fontSize: '0.62rem', marginBottom: '0.5rem', color: 'var(--amber-core)' }}>STEP 02</div>
            <h4 style={{ fontSize: '0.85rem', margin: 0, marginBottom: '0.2rem', color: '#fff' }}>Key Scrambling (PBKDF2)</h4>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem' }}>Your password is scrambled 250,000 times so hackers cannot guess it.</p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="stamped-badge" style={{ fontSize: '0.62rem', marginBottom: '0.5rem', color: '#f4f4f5' }}>STEP 03</div>
            <h4 style={{ fontSize: '0.85rem', margin: 0, marginBottom: '0.2rem', color: '#fff' }}>AES-256 Key</h4>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem' }}>A bank-grade 256-bit encryption key is created directly in your browser memory.</p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="stamped-badge" style={{ fontSize: '0.62rem', marginBottom: '0.5rem', color: '#34d399' }}>STEP 04</div>
            <h4 style={{ fontSize: '0.85rem', margin: 0, marginBottom: '0.2rem', color: '#fff' }}>Unique Random Codes</h4>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem' }}>Each secret value is encrypted with a unique random code, making tampering impossible.</p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="stamped-badge" style={{ fontSize: '0.62rem', marginBottom: '0.5rem' }}>STEP 05</div>
            <h4 style={{ fontSize: '0.85rem', margin: 0, marginBottom: '0.2rem', color: '#fff' }}>Safe Cloud Sync</h4>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem' }}>Only scrambled, unreadable text is saved locally and synced to the cloud.</p>
          </div>
        </div>
      </div>

      {/* Engineering Threat Model Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="metal-plate plate-with-screws">
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Cloud size={16} color="var(--amber-core)" /> WHAT DOES THE CLOUD SEE?
          </h3>
          <p className="text-muted text-small text-mono" style={{ lineHeight: 1.6 }}>
            Firebase and Google servers only receive <strong>scrambled encrypted text</strong>. Even if someone hacks the database, they cannot read any of your environment variables without your master password.
          </p>
        </div>

        <div className="metal-plate plate-with-screws">
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Cpu size={16} color="var(--amber-core)" /> MEMORY CLEARED ON LOCK
          </h3>
          <p className="text-muted text-small text-mono" style={{ lineHeight: 1.6 }}>
            When you click <strong>Lock</strong> or when the auto-lock timer expires, the encryption key and all decrypted secrets are instantly erased from browser memory.
          </p>
        </div>

        <div className="metal-plate plate-with-screws">
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Wifi size={16} color="var(--amber-core)" /> WORKS 100% OFFLINE
          </h3>
          <p className="text-muted text-small text-mono" style={{ lineHeight: 1.6 }}>
            EnvVault saves an encrypted copy on your device. You can unlock and edit variables offline on an airplane. Changes sync automatically when you reconnect to the internet.
          </p>
        </div>

        <div className="metal-plate plate-with-screws">
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <h3 style={{ margin: 0, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
            <Key size={16} color="var(--amber-core)" /> TWO SEPARATE PASSWORDS
          </h3>
          <p className="text-muted text-small text-mono" style={{ lineHeight: 1.6 }}>
            Your <strong>Account Password</strong> logs you into cloud sync. Your <strong>Master Password</strong> decrypts your secrets. They are separate, so even if an email is reset, your vault remains securely locked.
          </p>
        </div>
      </div>

      {/* Specifications Table */}
      <div className="metal-plate plate-with-screws">
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <h3 style={{ margin: 0, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
          <Terminal size={16} color="var(--amber-core)" /> SECURITY SPECIFICATIONS
        </h3>

        <div className="recessed-tray">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Encryption Type</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--amber-core)', fontWeight: 700 }}>AES-256-GCM (Bank & Government Standard)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Key Scrambling</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--amber-core)', fontWeight: 700 }}>PBKDF2-HMAC-SHA-256</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Scrambling Rounds</td>
                <td style={{ padding: '0.65rem 1rem', color: '#f4f4f5', fontWeight: 700 }}>250,000 Rounds (Industry Standard)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Random Code (IV)</td>
                <td style={{ padding: '0.65rem 1rem', color: '#34d399', fontWeight: 700 }}>96-bit unique random code per secret</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Encryption Engine</td>
                <td style={{ padding: '0.65rem 1rem', color: '#fff', fontWeight: 700 }}>Browser Native Web Cryptography API</td>
              </tr>
              <tr>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--text-secondary)' }}>Storage Protection</td>
                <td style={{ padding: '0.65rem 1rem', color: 'var(--amber-core)', fontWeight: 700 }}>Only encrypted data stored locally & in cloud</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
