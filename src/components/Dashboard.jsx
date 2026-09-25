import React, { useState, useEffect } from 'react';
import { getProjects, createProject } from '../vault/vault.js';
import { Folder, Plus } from 'lucide-react';

export default function Dashboard({ onProjectSelect }) {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const list = await getProjects();
    setProjects(list);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setIsCreating(false);
    loadProjects();
  };

  return (
    <div>
      <div className="header flex-between">
        <div>
          <h2 style={{ margin: 0 }}>Vault</h2>
          <span className="text-muted text-small">Your projects</span>
        </div>
        {!isCreating && (
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {isCreating && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="text-small" style={{ marginTop: 0 }}>New Project</h3>
          <form onSubmit={handleCreateProject} className="flex-gap">
            <input
              type="text"
              placeholder="Project name (e.g. RepoVerse)"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              autoFocus
              style={{ margin: 0, flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn" onClick={() => setIsCreating(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div>
        {projects.length === 0 && !isCreating && (
          <div className="center-screen" style={{ minHeight: '200px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <p className="text-muted">No projects found.</p>
          </div>
        )}

        {projects.map(proj => (
          <div 
            key={proj.id} 
            className="card card-interactive flex-between"
            onClick={() => onProjectSelect(proj.id, proj.name)}
          >
            <div className="flex-gap">
              <Folder size={20} className="text-muted" />
              <span style={{ fontWeight: 500 }}>{proj.name}</span>
            </div>
            <span className="text-muted text-small">{proj.envCount} env{proj.envCount !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
