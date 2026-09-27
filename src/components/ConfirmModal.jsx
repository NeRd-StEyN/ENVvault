import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ title, description, confirmText, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }}
      onClick={onCancel}
    >
      <div
        className="metal-plate hazard-stripes plate-with-screws"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '1.75rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(239, 68, 68, 0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-xs)',
              background: 'linear-gradient(180deg, #991b1b 0%, #450a0a 100%)',
              border: '1px solid rgba(255, 100, 100, 0.4)',
              borderBottom: '2px solid #280505',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fee2e2',
              boxShadow: '0 3px 6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.3)',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={22} />
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {title}
            </h3>
            <p className="text-muted text-small text-mono" style={{ marginTop: '0.4rem', lineHeight: '1.6' }}>
              {description}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: '1rem'
          }}
        >
          <span className="text-muted text-small text-mono" style={{ fontSize: '0.7rem' }}>
            <kbd>ESC</kbd> Cancel · <kbd>⏎</kbd> Confirm
          </span>

          <div className="flex-gap">
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={onConfirm}>
              {confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
