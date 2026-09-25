import React, { useState, useEffect, useCallback } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import LockScreen from './components/LockScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProjectView from './components/ProjectView.jsx';
import EnvEditor from './components/EnvEditor.jsx';
import Settings from './components/Settings.jsx';
import SecurityAbout from './components/SecurityAbout.jsx';
import { lockVault, isUnlocked } from './vault/vault.js';
import { onAuthState, signOutUser } from './auth/auth.js';
import {
  Lock, Settings as SettingsIcon, Info, LogOut,
  Wifi, WifiOff, CloudOff, Cloud, Search, X
} from 'lucide-react';
import { searchVault } from './vault/vault.js';

// ─── Top-level app states ────────────────────────────────────────────────────
// 'loading' → checking Firebase auth state
// 'unauthenticated' → show AuthScreen (Firebase login/signup)
// 'locked' → authenticated but vault not unlocked
// 'unlocked' → fully in the app
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [appState, setAppState] = useState('loading');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Navigation
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeProjectName, setActiveProjectName] = useState('');
  const [activeEnvBlock, setActiveEnvBlock] = useState(null);

  // Global search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Network status indicator ──────────────────────────────────────────────
  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // ── Firebase Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthState((user) => {
      setFirebaseUser(user);
      if (!user) {
        // Logged out — lock vault and go to auth
        lockVault();
        setAppState('unauthenticated');
      } else {
        // User is authenticated — check if vault is unlocked
        if (isUnlocked()) {
          setAppState('unlocked');
        } else {
          setAppState('locked');
        }
      }
    });
    return () => unsub();
  }, []);

  // ── Auto-lock timer ───────────────────────────────────────────────────────
  useEffect(() => {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      const setting = localStorage.getItem('envvault_autolock') || '10';
      if (setting === 'never') return;
      const minutes = parseInt(setting, 10);
      if (!isNaN(minutes)) {
        timeout = setTimeout(handleLock, minutes * 60 * 1000);
      }
    };

    if (appState === 'unlocked') {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('keydown', resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [appState]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem('envvault_theme') || 'system';
      if (theme === 'light') {
        document.body.classList.add('light-theme');
      } else if (theme === 'dark') {
        document.body.classList.remove('light-theme');
      } else {
        if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
          document.body.classList.add('light-theme');
        } else {
          document.body.classList.remove('light-theme');
        }
      }
    };
    applyTheme();
    window.addEventListener('theme_changed', applyTheme);
    return () => window.removeEventListener('theme_changed', applyTheme);
  }, []);

  // ── Keyboard shortcut: Ctrl+K / Cmd+K for search ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (appState === 'unlocked') setSearchOpen(s => !s);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [appState]);

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const results = await searchVault(q);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const openSearchResult = (result) => {
    setActiveProjectId(result.projectId);
    setActiveProjectName(result.projectName);
    setActiveEnvBlock({ id: result.blockId, label: result.label, content: '' });
    setCurrentView('env-editor');
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleAuthenticated = () => setAppState('locked');

  const handleUnlocked = () => {
    setAppState('unlocked');
    setCurrentView('dashboard');
  };

  const handleLock = () => {
    lockVault();
    setAppState('locked');
    setActiveProjectId(null);
    setActiveEnvBlock(null);
    setSearchOpen(false);
  };

  const handleSignOut = async () => {
    lockVault();
    await signOutUser();
    // onAuthState listener will set appState to 'unauthenticated'
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ─────────────────────────────────────────────────────────────────────────

  if (appState === 'loading') {
    return (
      <div className="app-container center-screen">
        <div className="auth-logo" style={{ marginBottom: '1rem' }}>
          <Lock size={32} color="var(--accent-color)" />
        </div>
        <p className="text-muted text-small">Loading…</p>
      </div>
    );
  }

  if (appState === 'unauthenticated') {
    return (
      <div className="app-container">
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  if (appState === 'locked') {
    return (
      <div className="app-container">
        <LockScreen onUnlocked={handleUnlocked} user={firebaseUser} onSignOut={handleSignOut} />
      </div>
    );
  }

  // ── Unlocked UI ───────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Global Search Overlay */}
      {searchOpen && (
        <div className="search-overlay" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                className="search-input"
                type="text"
                placeholder="Search projects and env files…"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
              />
              <button className="search-close" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}>
                <X size={16} />
              </button>
            </div>
            {searchQuery && (
              <div className="search-results">
                {searchLoading && <div className="search-empty">Searching…</div>}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="search-empty">No results for "{searchQuery}"</div>
                )}
                {!searchLoading && searchResults.map(r => (
                  <button
                    key={r.blockId}
                    className="search-result-item"
                    onClick={() => openSearchResult(r)}
                  >
                    <span className="search-result-project">{r.projectName}</span>
                    <span className="search-result-label">{r.label}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="search-hint">Press Esc to close · Enter to open</div>
          </div>
        </div>
      )}

      {/* App Header */}
      <header className="app-header flex-between">
        <h1 className="app-title" onClick={() => setCurrentView('dashboard')}>
          <Lock size={20} color="var(--accent-color)" /> EnvVault
        </h1>

        <div className="flex-gap" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {/* Network + sync status */}
          <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline-bad'}`} title={isOnline ? 'Online — vault syncing to cloud' : 'Offline — working from local cache'}>
            {isOnline
              ? <><Cloud size={12} /> Synced</>
              : <><CloudOff size={12} /> Offline</>
            }
          </div>

          {/* User email pill */}
          {firebaseUser && (
            <div className="status-badge" title={firebaseUser.email}>
              {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
            </div>
          )}

          {/* Search */}
          <button className="btn" onClick={() => setSearchOpen(true)} title="Search (Ctrl+K)">
            <Search size={14} /> Search
          </button>

          <button className="btn" onClick={() => setCurrentView('about')} title="Security & About">
            <Info size={14} />
          </button>

          <button className="btn" onClick={() => setCurrentView('settings')}>
            <SettingsIcon size={14} /> Settings
          </button>

          <button className="btn" onClick={handleLock} title="Lock vault">
            <Lock size={14} /> Lock
          </button>

          <button className="btn btn-danger-ghost" onClick={handleSignOut} title="Sign out of account">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && (
          <Dashboard
            onProjectSelect={(id, name) => {
              setActiveProjectId(id);
              setActiveProjectName(name);
              setCurrentView('project');
            }}
          />
        )}

        {currentView === 'project' && (
          <ProjectView
            projectId={activeProjectId}
            projectName={activeProjectName}
            onBack={() => setCurrentView('dashboard')}
            onSelectEnv={(block) => {
              setActiveEnvBlock(block);
              setCurrentView('env-editor');
            }}
            onNewEnv={() => {
              setActiveEnvBlock(null);
              setCurrentView('env-editor');
            }}
          />
        )}

        {currentView === 'env-editor' && (
          <EnvEditor
            projectId={activeProjectId}
            projectName={activeProjectName}
            initialBlock={activeEnvBlock}
            onBack={() => setCurrentView('project')}
            onSaved={() => setCurrentView('project')}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            onBack={() => setCurrentView('dashboard')}
            onLock={handleLock}
            onSignOut={handleSignOut}
            user={firebaseUser}
          />
        )}

        {currentView === 'about' && (
          <SecurityAbout onBack={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
