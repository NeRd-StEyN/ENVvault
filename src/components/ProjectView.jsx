import React, { useState, useEffect } from 'react';
import { getEnvironmentBlocks, deleteProject } from '../vault/vault.js';
import ConfirmModal from './ConfirmModal.jsx';
import { ArrowLeft, FileText, Plus, Trash2 } from 'lucide-react';

export default function ProjectView({ projectId, projectName, onBack, onSelectEnv, onNewEnv }) {
  const [envBlocks, setEnvBlocks] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  return (
    <div>
      <div className="header flex-between">
        <div>
          <button className="btn" onClick={onBack} style={{ marginBottom: '1rem', border: 'none', background: 'transparent', padding: 0 }}>
            <ArrowLeft size={16} /> Projects
          </button>
          <h2 style={{ margin: 0 }}>{projectName}</h2>
          <span className="text-muted text-small">Environment Files</span>
        </div>
        <div className="flex-gap">
          <button className="btn btn-primary" onClick={onNewEnv}>
            <Plus size={16} /> Add Environment
          </button>
        </div>
      </div>

      <div>
        {envBlocks.length === 0 && (
          <div className="center-screen" style={{ minHeight: '200px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <p className="text-muted">No environment files yet.</p>
          </div>
        )}

        {envBlocks.map(block => (
          <div 
            key={block.id} 
            className="card card-interactive flex-between"
            onClick={() => onSelectEnv(block)}
          >
            <div className="flex-gap">
              <FileText size={20} className="text-muted" />
              <span style={{ fontFamily: 'var(--font-mono)' }}>{block.label}</span>
            </div>
            <span className="text-muted text-small">→</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
        <button className="btn btn-danger" style={{ background: 'transparent', border: 'none' }} onClick={() => setConfirmDelete(true)}>
          <Trash2 size={16} /> Delete Project
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${projectName}?`}
          description={`This will permanently remove ${envBlocks.length} encrypted environment files from this device.`}
          confirmText="Delete Project"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
