import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../vault/vault.js';
import {
  Folder, Plus, Shield, Key, Database, Cpu, Search,
  ArrowUpRight, Layers, FileCode, Terminal, Check, HardDrive
} from 'lucide-react';

const QUICK_TEMPLATES = [
  'web-app',
  'api-backend',
  'mobile-client',
  'microservice-auth',
  'infra-docker'
];

export default function Dashboard({ onProjectSelect }) {
  const [projects, setProjects] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const list = await getProjects();
      setProjects(list);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    await createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
    loadProjects();
  };

  const totalEnvs = projects.reduce((acc, p) => acc + (p.envCount || 0), 0);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div>
      {/* Hardware Telemetry Monitors */}
      <div className="telemetry-grid">
        <div className="telemetry-card">
          <span className="led-diode amber" />
          <div className="telemetry-content">
            <span className="telemetry-label">PROJECTS</span>
            <span className="telemetry-value">{projects.length}</span>
            <span className="telemetry-hint text-mono">ORGANIZED FOLDERS</span>
          </div>
        </div>

        <div className="telemetry-card">
          <span className="led-diode amber" />
          <div className="telemetry-content">
            <span className="telemetry-label">ENV FILES</span>
            <span className="telemetry-value">{totalEnvs}</span>
            <span className="telemetry-hint text-mono">PROTECTED FILES</span>
          </div>
        </div>

        <div className="telemetry-card">
          <span className="led-diode green" />
          <div className="telemetry-content">
            <span className="telemetry-label">ENCRYPTION</span>
            <span className="telemetry-value" style={{ fontSize: '1.05rem' }}>AES-256-GCM</span>
            <span className="telemetry-hint text-mono">BANK-GRADE SECURITY</span>
          </div>
        </div>

        <div className="telemetry-card">
          <span className="led-diode green" />
          <div className="telemetry-content">
            <span className="telemetry-label">KEY PROTECTION</span>
            <span className="telemetry-value" style={{ fontSize: '1.05rem' }}>250K ROUNDS</span>
            <span className="telemetry-hint text-mono">ANTI-BRUTE-FORCE</span>
          </div>
        </div>
      </div>

      {/* Control Console Bar */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            Projects
            <span className="stamped-badge" style={{ color: 'var(--amber-core)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              LOCAL & SECURE
            </span>
          </h2>
          <p className="text-muted text-small text-mono" style={{ marginTop: '0.2rem' }}>
            Encrypted directly on your device · Secrets are never visible in plain text on the cloud
          </p>
        </div>

        <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search projects…"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{ paddingLeft: '2.2rem', paddingRight: '0.75rem', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          {!isCreating && (
            <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      </div>

      {/* New Project Module (Hardware Tray) */}
      {isCreating && (
        <div className="metal-plate plate-with-screws" style={{ marginBottom: '2rem', borderColor: 'var(--amber-core)', boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.2)' }}>
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} color="var(--amber-core)" /> CREATE NEW PROJECT
            </h3>
            <span className="stamped-badge">ENCRYPTED FOLDER</span>
          </div>

          <form onSubmit={handleCreateProject}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Project Name (e.g. web-app, backend-api, mobile)"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                autoFocus
                style={{ flex: 1, minWidth: '250px' }}
              />
              <button type="submit" className="btn btn-primary">
                Create Project
              </button>
              <button type="button" className="btn" onClick={() => setIsCreating(false)}>
                Cancel
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="text-muted text-small text-mono">Suggested names:</span>
              {QUICK_TEMPLATES.map(tpl => (
                <button
                  key={tpl}
                  type="button"
                  className="btn"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', background: '#090c12' }}
                  onClick={() => setNewProjectName(tpl)}
                >
                  +{tpl}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && !isCreating && (
        <div
          className="metal-plate plate-with-screws"
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: 'var(--metal-recess)'
          }}
        >
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              margin: '0 auto 1.25rem',
              background: 'radial-gradient(circle at 35% 35%, #2c2c31 0%, #161619 100%)',
              border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.3)'
            }}
          >
            <Folder size={28} color="var(--amber-core)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
            {filterText ? `No projects match "${filterText}"` : 'No Projects Yet'}
          </h3>
          <p className="text-muted text-small text-mono" style={{ maxWidth: '440px', margin: '0 auto 1.5rem' }}>
            {filterText
              ? 'Try a different search query or clear the filter.'
              : 'Create your first project to organize your development and production .env secrets.'}
          </p>
          {!filterText && (
            <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
              <Plus size={16} /> Create First Project
            </button>
          )}
        </div>
      )}

      {/* Project Repository Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.15rem' }}>
        {filteredProjects.map(proj => (
          <div
            key={proj.id}
            className="metal-plate card-interactive plate-with-screws"
            onClick={() => onProjectSelect(proj.id, proj.name)}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.35rem' }}
          >
            <div className="plate-screw top-left" />
            <div className="plate-screw top-right" />
            <div className="plate-screw bottom-left" />
            <div className="plate-screw bottom-right" />

            <div>
              <div className="flex-between" style={{ marginBottom: '0.85rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'linear-gradient(180deg, #2d2d33 0%, #18181b 100%)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--amber-core)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)'
                  }}
                >
                  <Folder size={18} />
                </div>

                <span className="stamped-badge">
                  {proj.envCount} {proj.envCount === 1 ? 'ENV FILE' : 'ENV FILES'}
                </span>
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {proj.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  <span className="led-diode green" style={{ width: '6px', height: '6px' }} />
                  <span>AES-256 ENCRYPTED</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.85rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                marginTop: '1.25rem',
                fontSize: '0.78rem'
              }}
            >
              <span className="text-muted text-mono" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Terminal size={12} /> Ready
              </span>
              <span style={{ color: 'var(--amber-core)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                Open Project <ArrowUpRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
