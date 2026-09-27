import React, { useState } from 'react';
import {
  ArrowLeft, Terminal, Copy, Check, Download, Upload,
  Key, Shield, Trash2, Cpu, HardDrive, Sparkles
} from 'lucide-react';

const CLI_COMMANDS = [
  {
    category: 'INSTALLATION',
    title: 'Install or Run via NPM / NPX',
    description: 'You can install the CLI globally or run it on-demand with npx without installing anything.',
    commands: [
      {
        label: 'Run on-demand with npx (Recommended)',
        cmd: 'npx @nerdsteyn/envvault-cli --help',
        desc: 'Runs the latest CLI without installing globally.'
      },
      {
        label: 'Install globally via npm',
        cmd: 'npm install -g @nerdsteyn/envvault-cli',
        desc: 'Installs the envvault command permanently on your laptop.'
      }
    ]
  },
  {
    category: 'AUTHENTICATION',
    title: 'Login & Session Management',
    description: 'Authenticate with your EnvVault account and Master Password to unlock encrypted vaults from the command line.',
    commands: [
      {
        label: 'Login to EnvVault',
        cmd: 'npx @nerdsteyn/envvault-cli login',
        desc: 'Prompts for your account email, password, and master password. Saves an encrypted session.'
      },
      {
        label: 'Log out & Clear Session',
        cmd: 'npx @nerdsteyn/envvault-cli logout',
        desc: 'Removes all saved credentials and session tokens from your device.'
      }
    ]
  },
  {
    category: 'PULL SECRETS (DOWNLOAD)',
    title: 'Pull Encrypted Secrets to Local .env',
    description: 'Decrypts environment variables from your cloud vault and writes them directly into a local .env file.',
    commands: [
      {
        label: 'Pull into a local .env file',
        cmd: 'npx @nerdsteyn/envvault-cli pull "my-project" -o .env',
        desc: 'Fetches the project’s default environment and saves it as .env in your current folder.'
      },
      {
        label: 'Pull a specific environment (e.g. Production)',
        cmd: 'npx @nerdsteyn/envvault-cli pull "my-project" .env.production -o .env.production',
        desc: 'Fetches .env.production and writes it to .env.production.'
      },
      {
        label: 'Print secrets to terminal output (stdout)',
        cmd: 'npx @nerdsteyn/envvault-cli pull "my-project" .env.production',
        desc: 'Prints decrypted variables directly to your terminal without creating a file.'
      }
    ]
  },
  {
    category: 'PUSH SECRETS (UPLOAD)',
    title: 'Push Local .env to Vault',
    description: 'Upload and encrypt a local .env file to your vault. Automatically creates the project and environment if they do not exist.',
    commands: [
      {
        label: 'Push local .env file to vault',
        cmd: 'npx @nerdsteyn/envvault-cli push "my-project" .env.production -i .env',
        desc: 'Reads your local .env file, encrypts it on your laptop, and syncs it to the cloud.'
      },
      {
        label: 'Push staging environment',
        cmd: 'npx @nerdsteyn/envvault-cli push "my-project" .env.staging -i .env.staging',
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
        cmd: 'npx @nerdsteyn/envvault-cli delete-project "my-project"',
        desc: 'Prompts for confirmation and permanently deletes the project (alias: rm-p).'
      },
      {
        label: 'Delete a single environment file',
        cmd: 'npx @nerdsteyn/envvault-cli delete-env "my-project" .env.staging',
        desc: 'Deletes only the specified environment file from the project (alias: rm-e).'
      }
    ]
  }
];

export default function CliDocs({ onBack }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

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
              <span className="led-diode amber" style={{ width: '7px', height: '7px' }} />
              @nerdsteyn/envvault-cli
            </span>
          </div>
          <p className="text-muted text-small text-mono" style={{ marginTop: '0.3rem' }}>
            Pull, push, and automate your encrypted secrets directly from your terminal or CI/CD pipelines.
          </p>
        </div>
      </div>

      {/* Overview Capsule */}
      <div className="metal-plate plate-with-screws" style={{ marginBottom: '1.5rem' }}>
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
          <Terminal size={18} color="var(--amber-core)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>HOW THE CLI WORKS</h3>
        </div>
        <p className="text-muted text-small text-mono" style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
          The EnvVault CLI brings true zero-knowledge encryption to your terminal. When you pull secrets, 
          the encrypted vault data is downloaded from the cloud and <strong>decrypted locally on your computer using your master password</strong>. 
          Plaintext secrets are never stored on any server.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="text-mono" style={{ color: 'var(--amber-core)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              ✓ CI/CD & Deployments
            </div>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem', margin: 0 }}>
              Automate secret injection in GitHub Actions, Docker, or staging servers.
            </p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="text-mono" style={{ color: '#34d399', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              ✓ Local Development
            </div>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem', margin: 0 }}>
              Pull the latest development team secrets into your local .env with one command.
            </p>
          </div>

          <div className="recessed-tray" style={{ padding: '0.85rem' }}>
            <div className="text-mono" style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              ✓ Zero Plaintext in Cloud
            </div>
            <p className="text-muted text-mono" style={{ fontSize: '0.7rem', margin: 0 }}>
              Secrets are encrypted before upload and decrypted only inside your local shell.
            </p>
          </div>
        </div>
      </div>

      {/* Command Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {CLI_COMMANDS.map((section, sIdx) => (
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
                        onClick={() => copyToClipboard(c.cmd, itemKey)}
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
                      <code className="text-mono" style={{ fontSize: '0.82rem', color: 'var(--amber-core)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>$ </span>
                        {c.cmd}
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
