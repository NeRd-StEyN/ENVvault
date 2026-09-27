import React, { useState } from 'react';
import {
  ArrowLeft, Terminal, Copy, Check, Download, Upload,
  Key, Shield, Trash2, Cpu, HardDrive, Sparkles
} from 'lucide-react';

const RAW_COMMANDS = [
  {
    category: 'AUTHENTICATION',
    title: 'Login & Session Management',
    description: 'Authenticate with your account and Master Password. You only need to login once.',
    commands: [
      {
        label: 'Login to EnvVault',
        cmd: 'login',
        desc: 'Prompts for your email, account password, and master password. Saves an encrypted session.'
      },
      {
        label: 'Log out & Clear Session',
        cmd: 'logout',
        desc: 'Removes all saved credentials and session tokens from your device.'
      }
    ]
  },
  {
    category: 'PULL SECRETS (DOWNLOAD)',
    title: 'Pull Encrypted Secrets to Local .env',
    description: 'Decrypts environment variables from your cloud vault and writes them directly into a local .env file on your computer.',
    commands: [
      {
        label: 'Pull into a local .env file',
        cmd: 'pull "my-project" -o .env',
        desc: 'Fetches the project’s default environment and saves it as .env in your current folder.'
      },
      {
        label: 'Pull a specific environment (e.g. Production)',
        cmd: 'pull "my-project" .env.production -o .env.production',
        desc: 'Fetches .env.production and writes it to .env.production.'
      },
      {
        label: 'Print secrets to terminal output (stdout)',
        cmd: 'pull "my-project" .env.production',
        desc: 'Prints decrypted variables directly to your terminal without creating a file.'
      }
    ]
  },
  {
    category: 'PUSH SECRETS (UPLOAD)',
    title: 'Push Local .env to Vault',
    description: 'Upload and encrypt a local .env file to your cloud vault. Creates the project and environment automatically if they do not exist.',
    commands: [
      {
        label: 'Push local .env file to vault',
        cmd: 'push "my-project" .env.production -i .env',
        desc: 'Reads your local .env file, encrypts it on your laptop, and syncs it to your cloud vault.'
      },
      {
        label: 'Push staging environment',
        cmd: 'push "my-project" .env.staging -i .env.staging',
        desc: 'Uploads .env.staging to your project’s staging environment.'
      }
    ]
  },
  {
    category: 'VAULT MANAGEMENT',
    title: 'Delete Projects & Environments via CLI',
    description: 'Permanently remove projects or individual environment files from your vault via terminal.',
    commands: [
      {
        label: 'Delete an entire project',
        cmd: 'delete-project "my-project"',
        desc: 'Prompts for confirmation and permanently deletes the project (alias: rm-p).'
      },
      {
        label: 'Delete a single environment file',
        cmd: 'delete-env "my-project" .env.staging',
        desc: 'Deletes only the specified environment file from the project (alias: rm-e).'
      }
    ]
  }
];

export default function CliDocs({ onBack }) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [useNpx, setUseNpx] = useState(false);

  const prefix = useNpx ? 'npx @nerdsteyn/envvault-cli' : 'envvault';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div>
      {/* Header Plaque */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn"
            onClick={onBack}
            style={{ marginBottom: '0.75rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.65rem' }}>CLI & Terminal Commands</h2>
            <span className="stamped-badge">
              <span className="led-diode green" style={{ width: '7px', height: '7px' }} />
              SHORT COMMAND: envvault
            </span>
          </div>
          <p className="text-muted text-small text-mono" style={{ marginTop: '0.3rem' }}>
            Once installed, you only ever need to type the short command <strong style={{ color: 'var(--amber-core)' }}>envvault</strong>!
          </p>
        </div>

        {/* Command Format Mode Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#090c12',
            padding: '0.35rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.9)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          <button
            className={`btn ${!useNpx ? 'btn-primary' : ''}`}
            onClick={() => setUseNpx(false)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0 }}
          >
            Short: envvault
          </button>
          <button
            className={`btn ${useNpx ? 'btn-primary' : ''}`}
            onClick={() => setUseNpx(true)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', margin: 0 }}
          >
            NPX (No Install)
          </button>
        </div>
      </div>

      {/* Installation Hero Card */}
      <div className="metal-plate plate-with-screws" style={{ marginBottom: '1.5rem', borderColor: 'var(--amber-core)', boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.2)' }}>
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <div className="flex-between" style={{ marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Terminal size={20} color="var(--amber-core)" />
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>STEP 1: INSTALL ONCE (GLOBAL)</h3>
          </div>
          <span className="stamped-badge" style={{ color: 'var(--amber-core)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            RUN ONCE ONLY
          </span>
        </div>

        <p className="text-muted text-small text-mono" style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
          Run this single install command in your terminal. After this, you <strong>never have to write the package name again</strong>—just type <strong style={{ color: '#fff' }}>envvault</strong>!
        </p>

        <div
          className="recessed-tray"
          style={{
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <code className="text-mono" style={{ fontSize: '0.95rem', color: '#fff' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>$ </span>
            npm install -g <span style={{ color: 'var(--amber-core)', fontWeight: 700 }}>@nerdsteyn/envvault-cli</span>
          </code>

          <button
            className="btn btn-primary"
            onClick={() => copyToClipboard('npm install -g @nerdsteyn/envvault-cli', 'global-install')}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }}
          >
            {copiedIndex === 'global-install' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
            {copiedIndex === 'global-install' ? 'Copied to Clipboard' : 'Copy Install Command'}
          </button>
        </div>
      </div>

      {/* Command Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {RAW_COMMANDS.map((section, sIdx) => (
          <div key={sIdx} className="metal-plate plate-with-screws">
            <div className="plate-screw top-left" />
            <div className="plate-screw top-right" />
            <div className="plate-screw bottom-left" />
            <div className="plate-screw bottom-right" />

            <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="led-diode amber" /> {section.title}
              </h3>
              <span className="stamped-badge">{section.category}</span>
            </div>

            <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
              {section.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {section.commands.map((c, cIdx) => {
                const fullCommand = `${prefix} ${c.cmd}`;
                const itemKey = `${sIdx}-${cIdx}`;
                const isCopied = copiedIndex === itemKey;

                return (
                  <div key={cIdx} className="recessed-tray" style={{ padding: '0.85rem 1rem' }}>
                    <div className="flex-between" style={{ marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span className="text-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {c.label}
                      </span>
                      <button
                        className="btn"
                        onClick={() => copyToClipboard(fullCommand, itemKey)}
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                      >
                        {isCopied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                        {isCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div
                      style={{
                        background: '#07090d',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid rgba(0,0,0,0.9)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        overflowX: 'auto'
                      }}
                    >
                      <code className="text-mono" style={{ fontSize: '0.85rem', color: 'var(--amber-core)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>$ </span>
                        <strong style={{ color: '#fff' }}>{prefix}</strong> {c.cmd}
                      </code>
                    </div>

                    <p className="text-muted text-mono" style={{ fontSize: '0.7rem', margin: '0.45rem 0 0' }}>
                      {c.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
