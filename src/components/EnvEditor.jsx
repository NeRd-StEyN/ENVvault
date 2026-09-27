import React, { useState, useEffect, useRef } from 'react';
import {
  addEnvironmentBlock,
  updateEnvironmentBlock,
  deleteEnvironmentBlock,
  getEnvironmentBlocks
} from '../vault/vault.js';
import ConfirmModal from './ConfirmModal.jsx';
import {
  ArrowLeft, Save, Copy, Download, Trash2, Check,
  Upload, Eye, EyeOff, Plus, FileCode, Table,
  KeyRound, Shield, Terminal, AlertCircle
} from 'lucide-react';

const parseEnv = (str) => {
  const lines = str.split('\n');
  const parsed = [];
  lines.forEach(line => {
    if (!line.trim() || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx > -1) {
      let key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      parsed.push({ key, value });
    }
  });
  return parsed;
};

const stringifyVars = (vars) => {
  return vars
    .filter(v => v.key.trim())
    .map(v => {
      const key = v.key.trim();
      let val = v.value;
      if (val.includes('\n') || val.includes(' ') || val.includes('#')) {
        val = `"${val.replace(/"/g, '\\"')}"`;
      }
      return `${key}=${val}`;
    })
    .join('\n');
};

const detectSecretType = (key) => {
  const k = key.toUpperCase();
  if (k.includes('DATABASE') || k.includes('DB_') || k.includes('MONGO') || k.includes('POSTGRES')) return 'DATABASE';
  if (k.includes('SECRET') || k.includes('PRIVATE') || k.includes('PASSPHRASE')) return 'SECRET';
  if (k.includes('KEY') || k.includes('TOKEN') || k.includes('AUTH') || k.includes('JWT') || k.includes('API_')) return 'API KEY';
  if (k.includes('URL') || k.includes('URI') || k.includes('HOST') || k.includes('ENDPOINT')) return 'ENDPOINT';
  if (k.includes('PORT')) return 'PORT';
  return 'CONFIG';
};

export default function EnvEditor({ projectId, projectName, initialBlock, onBack, onSaved }) {
  const isNew = !initialBlock;
  const [label, setLabel] = useState(initialBlock?.label || (isNew ? '.env.production' : ''));
  const [activeTab, setActiveTab] = useState('grid');
  const [rawText, setRawText] = useState('');

  const [vars, setVars] = useState(() => {
    if (initialBlock?.content) {
      const parsed = parseEnv(initialBlock.content);
      return parsed.length ? parsed : [{ key: '', value: '' }];
    }
    return [{ key: '', value: '' }];
  });

  const [copied, setCopied] = useState(false);
  const [copiedRow, setCopiedRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [masked, setMasked] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialBlock && !initialBlock.content) {
      getEnvironmentBlocks(projectId).then(blocks => {
        const block = blocks.find(b => b.id === initialBlock.id);
        if (block) {
          const parsed = parseEnv(block.content);
          setVars(parsed.length ? parsed : [{ key: '', value: '' }]);
          setRawText(block.content);
        }
      });
    } else if (initialBlock?.content) {
      setRawText(initialBlock.content);
    }
  }, [initialBlock, projectId]);

  const switchToRaw = () => {
    setRawText(stringifyVars(vars));
    setActiveTab('raw');
  };

  const switchToGrid = () => {
    const parsed = parseEnv(rawText);
    setVars(parsed.length ? parsed : [{ key: '', value: '' }]);
    setActiveTab('grid');
  };

  const handleVarChange = (index, field, val) => {
    const newVars = [...vars];
    newVars[index][field] = val;
    if (index === vars.length - 1 && (newVars[index].key || newVars[index].value)) {
      newVars.push({ key: '', value: '' });
    }
    setVars(newVars);
  };

  const handlePaste = (e, index) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes('=')) {
      e.preventDefault();
      const parsed = parseEnv(pasted);
      if (parsed.length > 0) {
        const newVars = [...vars];
        newVars.splice(index, 1, ...parsed);
        if (newVars[newVars.length - 1].key || newVars[newVars.length - 1].value) {
          newVars.push({ key: '', value: '' });
        }
        setVars(newVars);
      }
    }
  };

  const handleRemoveVar = (index) => {
    if (vars.length === 1) {
      setVars([{ key: '', value: '' }]);
    } else {
      const newVars = [...vars];
      newVars.splice(index, 1);
      setVars(newVars);
    }
  };

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const finalContent = activeTab === 'raw' ? rawText : stringifyVars(vars);
    try {
      if (isNew) {
        await addEnvironmentBlock(projectId, label.trim(), finalContent);
      } else {
        await updateEnvironmentBlock(projectId, initialBlock.id, label.trim(), finalContent);
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = activeTab === 'raw' ? rawText : stringifyVars(vars);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyValue = async (index, val) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedRow(index);
      setTimeout(() => setCopiedRow(null), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const content = activeTab === 'raw' ? rawText : stringifyVars(vars);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = label || '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    await deleteEnvironmentBlock(projectId, initialBlock.id);
    setShowDeleteConfirm(false);
    onBack();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const parsed = parseEnv(text);
      setVars(parsed.length ? parsed : [{ key: '', value: '' }]);
      setRawText(text);
      if (!label || label === '.env.production') setLabel(file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredVars = vars.map((v, i) => ({ ...v, originalIndex: i })).filter(v =>
    !searchTerm || v.key.toLowerCase().includes(searchTerm.toLowerCase()) || v.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Console Header Bar */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button
            className="btn"
            onClick={onBack}
            style={{ marginBottom: '0.75rem', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
          >
            <ArrowLeft size={14} /> Back to {projectName}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="text-mono" style={{ fontSize: '1.25rem', color: 'var(--amber-core)', fontWeight: 800 }}>$</span>
            <input
              type="text"
              placeholder=".env.production"
              value={label}
              onChange={e => setLabel(e.target.value)}
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                color: '#fff',
                padding: 0,
                letterSpacing: '0.02em'
              }}
            />
          </div>
        </div>

        {/* Physical View Selector Buttons */}
        <div className="flex-gap">
          <div style={{ display: 'flex', gap: '0.35rem', background: '#090c12', padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,0,0,0.9)' }}>
            <button
              className={`btn ${activeTab === 'grid' ? 'btn-primary' : ''}`}
              onClick={switchToGrid}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              <Table size={14} /> Table View
            </button>
            <button
              className={`btn ${activeTab === 'raw' ? 'btn-primary' : ''}`}
              onClick={switchToRaw}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              <FileCode size={14} /> Text View (.env)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'grid' ? (
        <div>
          {/* Sub-toolbar with Mechanical Toggle */}
          <div className="flex-between" style={{ marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="flex-gap">
              <span className="stamped-badge">
                <span className="led-diode green" style={{ width: '7px', height: '7px' }} />
                {vars.filter(v => v.key.trim()).length} VARIABLES
              </span>

              {/* Physical Rocker Toggle for Masking */}
              <div
                className="hardware-toggle"
                onClick={() => setMasked(m => !m)}
                title="Show or hide secret values"
              >
                <div className={`switch-lever ${!masked ? 'active' : ''}`} />
                <span className="text-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: !masked ? '#fbbf24' : 'var(--text-tertiary)' }}>
                  {masked ? 'VALUES HIDDEN' : 'VALUES VISIBLE'}
                </span>
              </div>
            </div>

            <div style={{ width: '220px' }}>
              <input
                type="text"
                placeholder="Search variables…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', height: '32px' }}
              />
            </div>
          </div>

          {/* Recessed Patch-Bay Table */}
          <div className="env-table-container">
            <div className="env-table-header">
              <span>#</span>
              <span>VARIABLE NAME</span>
              <span>VALUE</span>
              <span style={{ textAlign: 'right' }}>ACTIONS</span>
            </div>

            <div>
              {filteredVars.map((v) => {
                const i = v.originalIndex;
                const typeTag = v.key ? detectSecretType(v.key) : 'CONFIG';
                return (
                  <div key={i} className="env-row">
                    <span className="text-mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>

                    {/* Key Input with Type Badge */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="VARIABLE_NAME (e.g. DATABASE_URL)"
                        value={v.key}
                        onChange={e => handleVarChange(i, 'key', e.target.value)}
                        onPaste={e => handlePaste(e, i)}
                        className="env-key-input"
                        style={{ paddingRight: '4.5rem' }}
                      />
                      {v.key && (
                        <span
                          className="stamped-badge"
                          style={{
                            position: 'absolute',
                            right: '0.4rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.6rem',
                            padding: '0.1rem 0.35rem',
                            pointerEvents: 'none'
                          }}
                        >
                          {typeTag}
                        </span>
                      )}
                    </div>

                    {/* Value Input */}
                    <div>
                      <input
                        type={masked ? 'password' : 'text'}
                        placeholder="Value (e.g. postgres://...)"
                        value={v.value}
                        onChange={e => handleVarChange(i, 'value', e.target.value)}
                        onPaste={e => handlePaste(e, i)}
                        className="env-value-input"
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button
                        className="btn"
                        style={{ padding: '0.4rem', border: '1px solid rgba(255,255,255,0.08)' }}
                        onClick={() => handleCopyValue(i, v.value)}
                        title="Copy value"
                      >
                        {copiedRow === i ? <Check size={13} color="#34d399" /> : <Copy size={13} color="var(--text-secondary)" />}
                      </button>

                      <button
                        className="btn btn-danger-ghost"
                        style={{ padding: '0.4rem' }}
                        onClick={() => handleRemoveVar(i)}
                        title="Delete variable"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="btn"
            style={{
              width: '100%',
              marginBottom: '2rem',
              background: 'linear-gradient(180deg, #26262b 0%, #141417 100%)',
              border: '1px dashed rgba(255,255,255,0.15)',
              justifyContent: 'center',
              padding: '0.65rem'
            }}
            onClick={() => setVars([...vars, { key: '', value: '' }])}
          >
            <Plus size={16} color="var(--amber-core)" /> + Add Variable
          </button>
        </div>
      ) : (
        /* Raw Syntax Mode */
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
                {label || '.env'} — PLAIN TEXT (.ENV)
              </span>
            </div>
            <kbd style={{ fontSize: '0.65rem' }}>STANDARD .ENV</kbd>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder="# Standard .env format&#10;DATABASE_URL=postgres://...&#10;SECRET_KEY=sk_live_..."
            spellCheck={false}
            style={{
              width: '100%',
              height: '380px',
              background: '#09090b',
              color: '#f4f4f5',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              padding: '1.25rem',
              border: 'none',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Action Bay (Bottom Console) */}
      <div className="flex-between" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '0.65rem 1.4rem' }}
          >
            {saving ? <Save size={16} className="spin" /> : <Save size={16} />}
            {isNew ? 'Save & Encrypt' : 'Save Changes'}
          </button>

          <button className="btn" onClick={handleCopy} title="Copy .env contents">
            {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy All'}
          </button>

          <button className="btn" onClick={handleDownload} title="Download .env file">
            <Download size={16} /> Download .env
          </button>

          <button className="btn" onClick={() => fileInputRef.current?.click()} title="Import .env file">
            <Upload size={16} /> Import File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".env,.env.*,.txt"
            onChange={handleFileImport}
          />
        </div>

        {!isNew && (
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this environment file"
          >
            <Trash2 size={16} /> Delete Environment
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title={`Delete "${label}"?`}
          description="This environment file and all its variables will be permanently deleted. This action cannot be undone."
          confirmText="Delete Environment"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
