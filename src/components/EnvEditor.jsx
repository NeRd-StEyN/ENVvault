import React, { useState, useEffect, useRef } from 'react';
import { addEnvironmentBlock, updateEnvironmentBlock, deleteEnvironmentBlock, getEnvironmentBlocks } from '../vault/vault.js';
import { ArrowLeft, Save, Copy, Download, Trash2, Check, Upload, Eye, EyeOff } from 'lucide-react';

export default function EnvEditor({ projectId, projectName, initialBlock, onBack, onSaved }) {
  const isNew = !initialBlock;
  const [label, setLabel] = useState(initialBlock?.label || '');
  const [content, setContent] = useState(initialBlock?.content || '');
  const [copied, setCopied] = useState(false);
  const [copyTimer, setCopyTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [masked, setMasked] = useState(false);
  const fileInputRef = useRef(null);
  const copyTimerRef = useRef(null);

  // If this was opened from search, the content might be empty — load it
  useEffect(() => {
    if (initialBlock && !initialBlock.content) {
      getEnvironmentBlocks(projectId).then(blocks => {
        const block = blocks.find(b => b.id === initialBlock.id);
        if (block) setContent(block.content);
      });
    }
  }, [initialBlock, projectId]);

  const handleSave = async () => {
    if (!label.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        await addEnvironmentBlock(projectId, label, content);
      } else {
        await updateEnvironmentBlock(projectId, initialBlock.id, label, content);
      }
      onSaved();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Secure copy: clipboard is automatically cleared after 30 seconds
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setCopyTimer(30);

      // Countdown
      clearInterval(copyTimerRef.current);
      copyTimerRef.current = setInterval(() => {
        setCopyTimer(prev => {
          if (prev <= 1) {
            clearInterval(copyTimerRef.current);
            // Clear clipboard
            navigator.clipboard.writeText('').catch(() => {});
            setCopied(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // clipboard write failed (e.g. browser permissions)
    }
  };

  useEffect(() => () => clearInterval(copyTimerRef.current), []);

  const handleDownload = () => {
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
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      await deleteEnvironmentBlock(projectId, initialBlock.id);
      onBack();
    }
  };

  // Import .env file directly from disk
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent(ev.target.result);
      if (!label) setLabel(file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const variableCount = content.split('\n').filter(line => line.trim() && !line.startsWith('#') && line.includes('=')).length;

  return (
    <div>
      <div className="header">
        <button className="btn" onClick={onBack} style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={16} /> {projectName}
        </button>

        <input
          type="text"
          placeholder="Name (e.g. .env.local)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          style={{ fontSize: '1.5rem', fontWeight: 600, background: 'transparent', border: 'none', padding: 0, margin: 0, borderBottom: '1px solid transparent', borderRadius: 0 }}
        />
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          className="env-editor"
          placeholder={"DATABASE_URL=postgres://...\nAPI_KEY=sk-...\nSECRET_KEY=..."}
          value={content}
          onChange={e => setContent(e.target.value)}
          spellCheck="false"
          style={{ filter: masked ? 'blur(6px)' : 'none', transition: 'filter 0.2s' }}
        />
        <div style={{ position: 'absolute', bottom: '2rem', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => setMasked(m => !m)}
            title={masked ? 'Show content' : 'Mask content'}
          >
            {masked ? <Eye size={13} /> : <EyeOff size={13} />}
            {masked ? 'Show' : 'Mask'}
          </button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {variableCount} variable{variableCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="flex-between">
        <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Save size={16} className="spin" /> : <Save size={16} />}
            {isNew ? 'Encrypt & Save' : 'Save'}
          </button>

          {!isNew && (
            <>
              <button className="btn" onClick={handleCopy} title="Copies to clipboard, auto-clears in 30s">
                {copied
                  ? <><Check size={16} color="var(--success-color)" /> Copied ({copyTimer}s)</>
                  : <><Copy size={16} /> Copy</>
                }
              </button>

              <button className="btn" onClick={handleDownload}>
                <Download size={16} /> Download
              </button>
            </>
          )}

          {/* Import .env file from disk */}
          <button className="btn" onClick={() => fileInputRef.current?.click()} title="Import a .env file from disk">
            <Upload size={16} /> Import .env file
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".env,.env.*,.txt" onChange={handleFileImport} />
        </div>

        {!isNew && (
          <button className="btn btn-danger" style={{ background: 'transparent', border: 'none' }} onClick={handleDelete}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {copied && (
        <div className="text-small text-muted" style={{ marginTop: '0.75rem' }}>
          🔒 Clipboard will be automatically cleared in {copyTimer}s
        </div>
      )}
    </div>
  );
}
