import React from 'react';

export default function ConfirmModal({ title, description, confirmText, onConfirm, onCancel }) {
  return (
    <div className="search-overlay" style={{ alignItems: 'center', paddingTop: 0, zIndex: 9999 }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', margin: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', boxShadow: '0 32px 64px rgba(0,0,0,0.6)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>{title}</h3>
        <p className="text-muted text-small" style={{ marginBottom: '1.75rem', lineHeight: '1.6' }}>
          {description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn" onClick={onCancel} style={{ background: 'transparent' }}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
