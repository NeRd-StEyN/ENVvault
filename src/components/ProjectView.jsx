import React, { useState, useEffect } from 'react';
import { getEnvironmentBlocks, deleteProject } from '../vault/vault.js';
import ConfirmModal from './ConfirmModal.jsx';
import {
  ArrowLeft, FileCode, Plus, Trash2, Terminal, Copy,
  Check, ArrowRight, ShieldCheck, KeyRound, AlertTriangle
} from 'lucide-react';

const getEnvBadgeClass = (label) => {
  const l = label.toLowerCase();
  if (l.includes('prod')) return 'prod';
  if (l.includes('stag') || l.includes('test') || l.includes('qa')) return 'stage';
  if (l.includes('dev') || l.includes('local')) return 'dev';
  return 'custom';
};

export default function ProjectView({ projectId, projectName, onBack, onSelectEnv, onNewEnv }) {
  const [envBlocks, setEnvBlocks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cliCopied, setCliCopied] = useState(false);

  useEffect(() => {
    loadEnvs();
  }, [projectId]);

  const loadEnvs = async () => {
    const blocks = await getEnvironmentBlocks(projectId);
    setEnvBlocks(blocks);
  };

  const handleDelete = async () => {
    await deleteProject(projectId);
    onBack();
  };

  const copyCliCommand = () => {
    navigator.clipboard.writeText(`npx envvault inject --project "${projectName}"`);
    setCliCopied(true);
    setTimeout(() => setCliCopied(false), 2000);
  };

  return (
    <div>
      {/* Header Plaque */}
      <div className="flex-between" style={{ marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn"
            onClick={onBack}
            style={{ marginBottom: '0.85rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Back to Projects
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.65rem' }}>{projectName}</h2>
            <span className="stamped-badge">
              <span className="led-diode green" style={{ width: '7px', height: '7px' }} />
              {envBlocks.length} ENV FILE{envBlocks.length !== 1 ? 'S' : ''}
            </span>
          </div>
        </div>

        <div className="flex-gap">
          <button className="btn btn-primary" onClick={onNewEnv}>
            <Plus size={16} /> Add Environment (.env)
          </button>
        </div>
      </div>

      {/* Embedded Terminal Chassis */}
      <div className="recessed-tray" style={{ marginBottom: '2rem', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 1rem',
            background: 'linear-gradient(180deg, #1f1f24 0%, #131316 100%)',
            borderBottom: '1px solid rgba(0,0,0,0.9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="led-diode amber" />
            <span className="text-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              RUN IN YOUR TERMINAL (CLI)
            </span>
          </div>
          <button
            className="btn"
            onClick={copyCliCommand}
            style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
          >
            {cliCopied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
            {cliCopied ? 'Command Copied' : 'Copy Command'}
          </button>
        </div>
        <div style={{ padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="text-mono" style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>$ </span>
            <span style={{ color: '#f4f4f5' }}>npx envvault inject </span>
            <span style={{ color: 'var(--amber-core)' }}>--project "{projectName}" </span>
            <span style={{ color: '#a855f7' }}>-- npm run start</span>
          </div>
          <kbd style={{ fontSize: '0.65rem' }}>TERMINAL</kbd>
        </div>
      </div>

      {/* Environments Modules */}
      <div>
        <h3 style={{ fontSize: '0.95rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: '1rem', textTransform: 'uppercase' }}>
          ENVIRONMENT FILES (.ENV)
        </h3>

        {envBlocks.length === 0 && (
          <div
            className="metal-plate plate-with-screws"
            style={{
              textAlign: 'center',
              padding: '3rem 1.5rem',
              background: 'var(--metal-recess)'
            }}
          >
            <div className="plate-screw top-left" />
            <div className="plate-screw top-right" />
            <div className="plate-screw bottom-left" />
            <div className="plate-screw bottom-right" />

            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                background: 'radial-gradient(circle at 35% 35%, #2c2c31 0%, #161619 100%)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileCode size={22} color="var(--amber-core)" />
            </div>
            <h4 style={{ marginBottom: '0.35rem' }}>No Environment Files Yet</h4>
            <p className="text-muted text-small text-mono" style={{ marginBottom: '1.25rem' }}>
              Add files like <span style={{ color: 'var(--amber-core)' }}>.env.production</span> or <span style={{ color: 'var(--amber-core)' }}>.env.local</span> to store your variables.
            </p>
            <button className="btn btn-primary" onClick={onNewEnv}>
              <Plus size={16} /> Add First Environment
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {envBlocks.map(block => {
            const badgeType = getEnvBadgeClass(block.label);
            const diodeColor = badgeType === 'prod' ? 'red' : badgeType === 'stage' ? 'amber' : 'green';
            return (
              <div
                key={block.id}
                className="metal-plate card-interactive plate-with-screws flex-between"
                onClick={() => onSelectEnv(block)}
                style={{ padding: '1.1rem 1.4rem', margin: 0 }}
              >
                <div className="plate-screw top-left" style={{ top: '6px', left: '6px', width: '8px', height: '8px' }} />
                <div className="plate-screw top-right" style={{ top: '6px', right: '6px', width: '8px', height: '8px' }} />
                <div className="plate-screw bottom-left" style={{ bottom: '6px', left: '6px', width: '8px', height: '8px' }} />
                <div className="plate-screw bottom-right" style={{ bottom: '6px', right: '6px', width: '8px', height: '8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem' }}>
                  <span className={`led-diode ${diodeColor}`} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="text-mono" style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {block.label}
                      </span>
                      <span className={`stamped-badge ${badgeType}`}>
                        {badgeType.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-muted text-small text-mono" style={{ fontSize: '0.72rem' }}>
                      AES-256 ENCRYPTED · CLICK TO EDIT VARIABLES
                    </span>
                  </div>
                </div>

                <span style={{ color: 'var(--amber-core)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  Open & Edit <ArrowRight size={14} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone: Destroy Repository */}
      <div style={{ marginTop: '3.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
        <div className="metal-plate hazard-stripes flex-between" style={{ flexWrap: 'wrap', gap: '1rem', padding: '1.35rem' }}>
          <div>
            <h4 style={{ color: '#fca5a5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', textTransform: 'uppercase' }}>
              <AlertTriangle size={16} /> DANGER ZONE: DELETE PROJECT
            </h4>
            <p className="text-muted text-small text-mono" style={{ marginTop: '0.25rem' }}>
              Permanently delete this project and all {envBlocks.length} environment files from your device and the cloud.
            </p>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={14} /> Delete Project
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete project "${projectName}"?`}
          description={`This will permanently delete this project and all ${envBlocks.length} environment files. This action cannot be undone.`}
          confirmText="Delete Project"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
