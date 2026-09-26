import React, { useState, useEffect, useRef } from 'react';
import { addEnvironmentBlock, updateEnvironmentBlock, deleteEnvironmentBlock, getEnvironmentBlocks } from '../vault/vault.js';
import ConfirmModal from './ConfirmModal.jsx';
import { ArrowLeft, Save, Copy, Download, Trash2, Check, Upload, Eye, EyeOff, Plus } from 'lucide-react';

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
      if (val.includes('\n') || val.includes(' ')) {
        val = `"${val.replace(/"/g, '\\"')}"`;
      }
      return `${key}=${val}`;
    })
    .join('\n');
};

export default function EnvEditor({ projectId, projectName, initialBlock, onBack, onSaved }) {
  const isNew = !initialBlock;
  const [label, setLabel] = useState(initialBlock?.label || '');
  
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
  const [masked, setMasked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialBlock && !initialBlock.content) {
      getEnvironmentBlocks(projectId).then(blocks => {
        const block = blocks.find(b => b.id === initialBlock.id);
        if (block) {
          const parsed = parseEnv(block.content);
          setVars(parsed.length ? parsed : [{ key: '', value: '' }]);
        }
      });
    }
  }, [initialBlock, projectId]);

  const handleVarChange = (index, field, val) => {
    const newVars = [...vars];
    newVars[index][field] = val;
    // Auto-add new row if the last row is being typed in
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
        // Ensure there is always an empty row at the end
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
    const finalContent = stringifyVars(vars);
    try {
      if (isNew) {
        await addEnvironmentBlock(projectId, label, finalContent);
      } else {
        await updateEnvironmentBlock(projectId, initialBlock.id, label, finalContent);
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
      await navigator.clipboard.writeText(stringifyVars(vars));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleCopyValue = async (index) => {
    try {
      await navigator.clipboard.writeText(vars[index].value);
      setCopiedRow(index);
      setTimeout(() => setCopiedRow(null), 2000);
    } catch {}
  };

  const handleDownload = () => {
    const blob = new Blob([stringifyVars(vars)], { type: 'text/plain' });
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
      const parsed = parseEnv(ev.target.result);
      setVars(parsed.length ? parsed : [{ key: '', value: '' }]);
      if (!label) setLabel(file.name);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

      <div style={{ position: 'relative', marginBottom: '2rem', padding: '1rem', background: 'var(--card-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            className="btn"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            onClick={() => setMasked(m => !m)}
            title={masked ? 'Show content' : 'Mask content'}
          >
            {masked ? <Eye size={13} /> : <EyeOff size={13} />}
            {masked ? 'Show' : 'Mask'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {vars.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="KEY"
                value={v.key}
                onChange={e => handleVarChange(i, 'key', e.target.value)}
                onPaste={e => handlePaste(e, i)}
                style={{ flex: 1, fontFamily: 'monospace', margin: 0 }}
              />
              <input
                type={masked ? 'password' : 'text'}
                placeholder="VALUE"
                value={v.value}
                onChange={e => handleVarChange(i, 'value', e.target.value)}
                onPaste={e => handlePaste(e, i)}
                style={{ flex: 2, fontFamily: 'monospace', margin: 0 }}
              />
              <button
                className="btn"
                style={{ padding: '0.6rem', border: 'none', background: 'transparent', color: copiedRow === i ? 'var(--success-color)' : 'var(--text-secondary)', transition: 'color 0.2s' }}
                onClick={() => handleCopyValue(i)}
                title="Copy value"
              >
                {copiedRow === i ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button 
                className="btn btn-danger" 
                style={{ padding: '0.6rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)' }} 
                onClick={() => handleRemoveVar(i)} 
                title="Remove variable"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        
        <button 
          className="btn" 
          style={{ marginTop: '1rem', background: 'transparent', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', width: '100%', justifyContent: 'center' }} 
          onClick={() => setVars([...vars, { key: '', value: '' }])}
        >
          <Plus size={16} /> Add Variable
        </button>
      </div>

      <div className="flex-between">
        <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Save size={16} className="spin" /> : <Save size={16} />}
            {isNew ? 'Encrypt & Save' : 'Save'}
          </button>

          {!isNew && (
            <>
              <button className="btn" onClick={handleCopy} title="Copy to clipboard">
                {copied
                  ? <><Check size={16} color="var(--success-color)" /> Copied</>
                  : <><Copy size={16} /> Copy</>
                }
              </button>

              <button className="btn" onClick={handleDownload}>
                <Download size={16} /> Download
              </button>
            </>
          )}

          <button className="btn" onClick={() => fileInputRef.current?.click()} title="Import a .env file from disk">
            <Upload size={16} /> Import .env file
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".env,.env.*,.txt" onChange={handleFileImport} />
        </div>

        {!isNew && (
          <button className="btn btn-danger" style={{ background: 'transparent', border: 'none' }} onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title={`Delete "${label}"?`}
          description="This action cannot be undone. This will permanently remove this environment file from your vault."
          confirmText="Delete Environment"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
