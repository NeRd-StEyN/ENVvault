import React, { useState, useEffect, useCallback } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import LockScreen from './components/LockScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProjectView from './components/ProjectView.jsx';
import EnvEditor from './components/EnvEditor.jsx';
import Settings from './components/Settings.jsx';
import SecurityAbout from './components/SecurityAbout.jsx';
import CliDocs from './components/CliDocs.jsx';
import { lockVault, isUnlocked, searchVault, syncVaultToCloud, applyCloudVaultUpdate, onVaultChange, TAB_ID } from './vault/vault.js';
import { subscribeToVault } from './auth/cloud-sync.js';
import { onAuthState, signOutUser, getCurrentUser } from './auth/auth.js';
import {
  Shield, Lock, Settings as SettingsIcon, Info, LogOut,
  Search, X, Terminal, ChevronRight, HardDrive, Cpu, KeyRound
} from 'lucide-react';

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
  // ── Handlers (Defined before useEffects to prevent TDZ errors) ───────────
  const handleAuthenticated = useCallback(() => setAppState('locked'), []);

  const handleUnlocked = useCallback(() => {
    setAppState('unlocked');
    setCurrentView('dashboard');
  }, []);

  const handleLock = useCallback((broadcast = true) => {
    lockVault(broadcast);
    setActiveProjectId(null);
    setActiveEnvBlock(null);
    setSearchOpen(false);
    if (getCurrentUser()) {
      setAppState('locked');
    } else {
      setAppState('unauthenticated');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setActiveProjectId(null);
    setActiveEnvBlock(null);
    setSearchOpen(false);
    setFirebaseUser(null);
    setAppState('unauthenticated');
    lockVault(false);
    try {
      await signOutUser();
    } catch (err) {
      console.error('Failed to sign out from Firebase:', err);
    }
  }, []);

  // ── Network listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (isUnlocked()) {
        syncVaultToCloud().catch(() => { });
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Firebase Auth listener ────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthState((user) => {
      setFirebaseUser(user);
      if (!user) {
        lockVault(false);
        setAppState('unauthenticated');
      } else {
        if (isUnlocked()) {
          setAppState('unlocked');
        } else {
          setAppState('locked');
        }
      }
    });
    return () => unsub();
  }, []);

  // ── Real-time Cloud Sync Listener (Live updates from CLI or other tabs) ───
  useEffect(() => {
    if (appState === 'unlocked' && firebaseUser?.uid) {
      const unsubscribe = subscribeToVault(firebaseUser.uid, (incomingCloudVault) => {
        applyCloudVaultUpdate(incomingCloudVault).catch(() => {});
      });
      return () => unsubscribe();
    }
  }, [appState, firebaseUser?.uid]);

  // ── Multi-tab & Remote Lock / Change Listeners ───────────────────────────
  useEffect(() => {
    // 1. In-memory vault listener (e.g. password changed remotely)
    const unsub = onVaultChange((meta) => {
      if (meta?.reason === 'password_changed_remotely') {
        handleLock(false);
      }
    });

    // 2. BroadcastChannel across different browser tabs of the same origin
    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel('envvault_sync_channel');
      channel.onmessage = (e) => {
        // Ignore broadcasts that originated from this exact tab
        if (e.data?.tabId === TAB_ID) return;
        // Never lock if the user is not authenticated
        if (!getCurrentUser()) return;

        if (e.data?.type === 'LOCK' || e.data?.type === 'PASSWORD_CHANGED') {
          handleLock(false);
        }
      };
    }

    return () => {
      unsub();
      if (channel) channel.close();
    };
  }, [handleLock]);

  // ── Auto-lock timer (Touch, Mouse, Keyboard & Tab Visibility Aware) ───────
  useEffect(() => {
    let timeout;
    let lastActivity = Date.now();

    const getTimeoutMinutes = () => {
      const userKey = firebaseUser?.uid ? `envvault_autolock_${firebaseUser.uid}` : 'envvault_autolock';
      const setting = localStorage.getItem(userKey) || localStorage.getItem('envvault_autolock') || '10';
      if (setting === 'never') return null;
      const minutes = parseInt(setting, 10);
      return isNaN(minutes) ? 10 : minutes;
    };

    const resetTimer = () => {
      clearTimeout(timeout);
      lastActivity = Date.now();

      const minutes = getTimeoutMinutes();
      if (minutes === null) return;

      timeout = setTimeout(handleLock, minutes * 60 * 1000);
    };

    const handleVisibilityOrFocus = () => {
      const minutes = getTimeoutMinutes();
      if (minutes === null) return;

      const elapsedMs = Date.now() - lastActivity;
      if (elapsedMs >= minutes * 60 * 1000) {
        handleLock();
      } else {
        clearTimeout(timeout);
        const remainingMs = Math.max(0, minutes * 60 * 1000 - elapsedMs);
        timeout = setTimeout(handleLock, remainingMs);
      }
    };

    if (appState === 'unlocked') {
      const activityEvents = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'touchmove', 'scroll'];
      activityEvents.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
      window.addEventListener('focus', handleVisibilityOrFocus);

      resetTimer();
    }

    return () => {
      clearTimeout(timeout);
      const activityEvents = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'touchmove', 'scroll'];
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [appState, firebaseUser?.uid]);

  // ── Permanent Theme (Dark Gunmetal Hardware Vault) ────────────────────────
  useEffect(() => {
    localStorage.removeItem('envvault_theme');
    document.body.classList.remove('light-theme');
  }, []);

  // ── Keyboard shortcut: Ctrl+K / Cmd+K ─────────────────────────────────────
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
    if (result.blockId) {
      setActiveEnvBlock({ id: result.blockId, label: result.label, content: '' });
      setCurrentView('env-editor');
    } else {
      setActiveEnvBlock(null);
      setCurrentView('project');
    }
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (appState === 'loading') {
    return (
      <div className="center-screen" style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <div className="vault-door-chassis" style={{ textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div className="plate-screw top-left" />
          <div className="plate-screw top-right" />
          <div className="plate-screw bottom-left" />
          <div className="plate-screw bottom-right" />

          <div className="vault-tumbler-dial">
            <div className="vault-tumbler-hub">
              <KeyRound size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>Opening Vault...</h2>
          <p className="text-muted text-small text-mono">Loading encryption keys and local storage...</p>
        </div>
      </div>
    );
  }

  if (appState === 'unauthenticated') {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  if (appState === 'locked') {
    return (
      <LockScreen
        onUnlocked={handleUnlocked}
        user={firebaseUser}
        onSignOut={handleSignOut}
      />
    );
  }

  // ── UNLOCKED CONSOLE ──────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Search Overlay (Command Bay) */}
      {searchOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh'
          }}
          onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
        >
          <div
            className="metal-plate plate-with-screws"
            style={{ width: '100%', maxWidth: '580px', padding: 0, overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="plate-screw top-left" />
            <div className="plate-screw top-right" />
            <div className="plate-screw bottom-left" />
            <div className="plate-screw bottom-right" />

            <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Search size={18} color="var(--amber-core)" />
              <input
                type="text"
                placeholder="Search projects and variables…"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', color: '#fff', fontSize: '1.05rem', padding: 0 }}
              />
              <button
                className="btn btn-danger-ghost"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                style={{ padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {searchQuery && (
              <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
                {searchLoading && <div className="text-muted text-mono text-center" style={{ padding: '2rem' }}>Searching…</div>}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="text-muted text-mono text-center" style={{ padding: '2rem' }}>No matches found.</div>
                )}
                {!searchLoading && searchResults.map(r => (
                  <div
                    key={r.blockId || r.projectId}
                    className="card-interactive"
                    onClick={() => openSearchResult(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.35rem',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="stamped-badge">{r.projectName}</span>
                      <span className="text-mono" style={{ fontWeight: 600, color: '#f4f4f5' }}>{r.label}</span>
                    </div>
                    <span className="text-muted text-small text-mono">OPEN →</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1.25rem', background: '#080a0f', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              <span>Press <kbd>ESC</kbd> to close</span>
              <span><kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>⏎</kbd> select</span>
            </div>
          </div>
        </div>
      )}

      {/* Heavy Metal Top Console Bar */}
      <header
        className="metal-plate plate-with-screws flex-between"
        style={{ padding: '0.9rem 1.4rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div className="plate-screw top-left" />
        <div className="plate-screw top-right" />
        <div className="plate-screw bottom-left" />
        <div className="plate-screw bottom-right" />

        {/* Brand Plaque */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}
          onClick={() => setCurrentView('dashboard')}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(180deg, #303036 0%, #17171a 100%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 3px 6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--amber-core)'
            }}
          >
            <Shield size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em', color: '#fff', textShadow: 'var(--text-engraved)' }}>
                ENVVAULT
              </span>
              <span className="stamped-badge" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', color: 'var(--amber-core)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                SECURE
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setCurrentView('dashboard')}>
                Projects
              </span>
              {currentView === 'project' && (
                <>
                  <ChevronRight size={11} />
                  <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>{activeProjectName}</span>
                </>
              )}
              {currentView === 'env-editor' && (
                <>
                  <ChevronRight size={11} />
                  <span style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setCurrentView('project')}>{activeProjectName}</span>
                  <ChevronRight size={11} />
                  <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>{activeEnvBlock?.label || 'New File'}</span>
                </>
              )}
              {currentView === 'settings' && (
                <>
                  <ChevronRight size={11} />
                  <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>Settings</span>
                </>
              )}
              {currentView === 'about' && (
                <>
                  <ChevronRight size={11} />
                  <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>Security & How It Works</span>
                </>
              )}
              {currentView === 'cli' && (
                <>
                  <ChevronRight size={11} />
                  <span style={{ color: 'var(--amber-core)', fontWeight: 600 }}>CLI Commands</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Hardware Switches & Status */}
        <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
          {/* LED Hardware Diode Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#090c12',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            <span className={`led-diode ${isOnline ? 'green' : 'amber'}`} />
            <span className="text-mono" style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.04em', color: isOnline ? '#34d399' : '#fbbf24' }}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          {/* Quick Search Button */}
          <button className="btn" onClick={() => setSearchOpen(true)} title="Quick Search (Ctrl+K)">
            <Search size={14} color="var(--amber-core)" />
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>

          {/* CLI Reference */}
          <button
            className={`btn ${currentView === 'cli' ? 'btn-primary' : ''}`}
            onClick={() => setCurrentView('cli')}
            title="CLI & Terminal Commands"
          >
            <Terminal size={14} />
            <span>CLI</span>
          </button>

          {/* Security Schematics */}
          <button
            className={`btn ${currentView === 'about' ? 'btn-primary' : ''}`}
            onClick={() => setCurrentView('about')}
            title="Security & How It Works"
          >
            <Info size={14} />
          </button>

          {/* Settings */}
          <button
            className={`btn ${currentView === 'settings' ? 'btn-primary' : ''}`}
            onClick={() => setCurrentView('settings')}
            title="Settings"
          >
            <SettingsIcon size={14} />
          </button>

          {/* Lock Safe Button */}
          <button
            className="btn"
            onClick={handleLock}
            style={{ border: '1px solid rgba(245, 158, 11, 0.65)' }}
            title="Lock Vault"
          >
            <Lock size={14} color="var(--amber-core)" />
            <span>Lock</span>
          </button>

          {/* Sign Out */}
          <button
            className="btn btn-danger-ghost"
            onClick={handleSignOut}
            title="Sign Out"
            style={{ padding: '0.55rem' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Console Viewport */}
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

        {currentView === 'cli' && (
          <CliDocs onBack={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
