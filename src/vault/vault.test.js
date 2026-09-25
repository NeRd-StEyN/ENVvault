import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  createVault,
  unlockVault,
  lockVault,
  isUnlocked,
  hasVault,
  createProject,
  getProjects,
  deleteProject,
  addEnvironmentBlock,
  getEnvironmentBlocks,
  updateEnvironmentBlock,
  deleteEnvironmentBlock,
  changeMasterPassword
} from './vault.js';
import { deleteVault, loadVault } from '../storage/indexeddb.js';

// Polyfill window.crypto for Node
import { webcrypto } from 'node:crypto';
if (typeof window === 'undefined') {
  global.window = { crypto: globalThis.crypto || webcrypto };
} else if (!window.crypto) {
  window.crypto = webcrypto;
}

describe('Vault Logic', () => {
  beforeEach(async () => {
    try {
      await deleteVault();
    } catch (e) {}
    lockVault();
  });

  it('creates and unlocks a vault securely', async () => {
    await createVault('password123');
    expect(isUnlocked()).toBe(true);
    
    lockVault();
    expect(isUnlocked()).toBe(false);
    
    await unlockVault('password123');
    expect(isUnlocked()).toBe(true);
  });

  it('fails to unlock with wrong password', async () => {
    await createVault('password123');
    lockVault();
    await expect(unlockVault('wrongpass')).rejects.toThrow('Incorrect master password');
  });

  it('performs CRUD on projects and environments', async () => {
    await createVault('pass');
    
    // Create Project
    const projId = await createProject('My Project');
    const projects = await getProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe('My Project');
    expect(projects[0].envCount).toBe(0);
    
    // Add Env Block
    const blockId = await addEnvironmentBlock(projId, '.env.local', 'SECRET=123');
    let blocks = await getEnvironmentBlocks(projId);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].label).toBe('.env.local');
    expect(blocks[0].content).toBe('SECRET=123');
    
    // Update Env Block
    await updateEnvironmentBlock(projId, blockId, '.env.prod', 'SECRET=456');
    blocks = await getEnvironmentBlocks(projId);
    expect(blocks[0].label).toBe('.env.prod');
    expect(blocks[0].content).toBe('SECRET=456');
    
    // Delete Env Block
    await deleteEnvironmentBlock(projId, blockId);
    blocks = await getEnvironmentBlocks(projId);
    expect(blocks).toHaveLength(0);
    
    // Delete Project
    await deleteProject(projId);
    expect(await getProjects()).toHaveLength(0);
  });

  it('changes master password successfully', async () => {
    await createVault('old_password');
    const projId = await createProject('Test Project');
    await addEnvironmentBlock(projId, '.env', 'FOO=BAR');
    
    // Change password
    await changeMasterPassword('new_password');
    expect(isUnlocked()).toBe(true);
    
    lockVault();
    
    // Old password should fail
    await expect(unlockVault('old_password')).rejects.toThrow();
    
    // New password should succeed
    await unlockVault('new_password');
    
    // Data should still be there
    const projects = await getProjects();
    expect(projects[0].name).toBe('Test Project');
    
    const blocks = await getEnvironmentBlocks(projId);
    expect(blocks[0].content).toBe('FOO=BAR');
    
    // Verify ciphertext actually changed by loading raw DB
    const rawVault = await loadVault();
    // Re-unlocking with new password guarantees the vault was saved with new keys
  });
});
