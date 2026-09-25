import { deriveKey, generateSalt, encryptData, decryptData } from '../crypto/crypto.js';
import { saveVault, loadVault, deleteVault } from '../storage/indexeddb.js';
import { uploadVault, downloadVault } from '../auth/cloud-sync.js';
import { getCurrentUser } from '../auth/auth.js';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../auth/firebase.js';

// In-memory state for the unlocked vault
let currentKey = null;
let currentVaultData = null;

const MAGIC_STRING = 'ENVVAULT_OK';

/**
 * Generates a unique ID (UUID v4 equivalent for our purposes)
 */
function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

/**
 * Creates a brand new vault, replacing any existing one.
 */
export async function createVault(password) {
  const salt = generateSalt();
  const key = await deriveKey(password, salt);
  
  const { ciphertext: magicCiphertext, iv: magicIv } = await encryptData(MAGIC_STRING, key);

  const newVault = {
    version: 1,
    salt,
    kdfParams: {
      algorithm: 'PBKDF2',
      hash: 'SHA-256',
      iterations: 250000
    },
    magicCiphertext,
    magicIv,
    projects: []
  };

  await saveVault(newVault);
  currentKey = key;
  currentVaultData = newVault;

  // Sync to cloud if user is logged in
  await syncToCloud(newVault);
}

/**
 * Unlocks an existing vault.
 * Priority: try to pull the latest from cloud first, fall back to local IndexedDB.
 * Throws if password is wrong or no vault is found anywhere.
 */
export async function unlockVault(password) {
  let vault = null;

  // 1. Try to pull the freshest copy from the cloud (works online only)
  const user = getCurrentUser();
  if (user) {
    try {
      const cloudVault = await downloadVault(user.uid);
      if (cloudVault) {
        vault = cloudVault;
        // Keep local copy up to date
        await saveVault(vault);
      }
    } catch {
      // Cloud fetch failed — fall through to local
    }
  }

  // 2. Fall back to local IndexedDB (works offline)
  if (!vault) {
    vault = await loadVault();
  }

  if (!vault) {
    throw new Error('No vault found. Please create one.');
  }

  const key = await deriveKey(password, vault.salt, vault.kdfParams.iterations);

  // Verify the password by decrypting the magic string
  try {
    const decrypted = await decryptData(vault.magicCiphertext, vault.magicIv, key);
    if (decrypted !== MAGIC_STRING) {
      throw new Error('Authentication failed');
    }
  } catch {
    throw new Error('Incorrect master password or corrupted vault.');
  }

  currentKey = key;
  currentVaultData = vault;
}

/**
 * Locks the vault, clearing the key and data from memory.
 */
export function lockVault() {
  currentKey = null;
  currentVaultData = null;
}

/**
 * Returns true if the vault is currently unlocked in memory.
 */
export function isUnlocked() {
  return currentKey !== null && currentVaultData !== null;
}

/**
 * Checks if a vault exists locally in IndexedDB.
 */
export async function hasVault() {
  const user = getCurrentUser();
  if (user) {
    try {
      const cloudVault = await downloadVault(user.uid);
      if (cloudVault) return true;
    } catch (err) {
      console.warn("Could not check cloud vault:", err);
    }
  }

  const vault = await loadVault();
  return !!vault;
}

/**
 * Deletes the vault from both local storage and the cloud.
 */
export async function wipeVault() {
  await deleteVault();
  const user = getCurrentUser();
  if (user) {
    try {
      await deleteDoc(doc(db, 'vaults', user.uid));
    } catch {
      // Best effort — may be offline
    }
  }
  currentKey = null;
  currentVaultData = null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function ensureUnlocked() {
  if (!isUnlocked()) throw new Error('Vault is locked.');
}

/**
 * Persists the current vault state to local IndexedDB AND queues a cloud sync.
 * Cloud sync is fire-and-forget — local save always happens first.
 */
async function persist() {
  await saveVault(currentVaultData);
  // Fire-and-forget cloud sync (non-blocking)
  syncToCloud(currentVaultData).catch(() => {
    // Silently ignored — Firestore SDK queues the write locally
    // and retries automatically when connectivity is restored
  });
}

/**
 * Uploads the current vault to Firestore if user is logged in.
 */
async function syncToCloud(vault) {
  const user = getCurrentUser();
  if (user) {
    await uploadVault(user.uid, vault || currentVaultData);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD OPERATIONS (require unlocked vault)
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjects() {
  ensureUnlocked();
  
  const projects = [];
  for (const proj of currentVaultData.projects) {
    const name = await decryptData(proj.nameCiphertext, proj.nameIv, currentKey);
    projects.push({
      id: proj.id,
      name,
      envCount: proj.envBlocks.length
    });
  }
  return projects;
}

export async function createProject(name) {
  ensureUnlocked();
  
  const { ciphertext: nameCiphertext, iv: nameIv } = await encryptData(name, currentKey);
  
  const newProject = {
    id: generateId(),
    nameCiphertext,
    nameIv,
    envBlocks: []
  };
  
  currentVaultData.projects.push(newProject);
  await persist();
  return newProject.id;
}

export async function renameProject(projectId, newName) {
  ensureUnlocked();

  const project = currentVaultData.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const { ciphertext: nameCiphertext, iv: nameIv } = await encryptData(newName, currentKey);
  project.nameCiphertext = nameCiphertext;
  project.nameIv = nameIv;
  await persist();
}

export async function deleteProject(projectId) {
  ensureUnlocked();
  currentVaultData.projects = currentVaultData.projects.filter(p => p.id !== projectId);
  await persist();
}

export async function getEnvironmentBlocks(projectId) {
  ensureUnlocked();
  
  const project = currentVaultData.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  
  const blocks = [];
  for (const block of project.envBlocks) {
    const label = await decryptData(block.labelCiphertext, block.labelIv, currentKey);
    const content = await decryptData(block.contentCiphertext, block.contentIv, currentKey);
    blocks.push({
      id: block.id,
      label,
      content
    });
  }
  return blocks;
}

export async function addEnvironmentBlock(projectId, label, content) {
  ensureUnlocked();
  
  const project = currentVaultData.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  
  const { ciphertext: labelCiphertext, iv: labelIv } = await encryptData(label, currentKey);
  const { ciphertext: contentCiphertext, iv: contentIv } = await encryptData(content, currentKey);
  
  const newBlock = {
    id: generateId(),
    labelCiphertext,
    labelIv,
    contentCiphertext,
    contentIv
  };
  
  project.envBlocks.push(newBlock);
  await persist();
  return newBlock.id;
}

export async function updateEnvironmentBlock(projectId, blockId, label, content) {
  ensureUnlocked();
  
  const project = currentVaultData.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  
  const block = project.envBlocks.find(b => b.id === blockId);
  if (!block) throw new Error('Block not found');
  
  const { ciphertext: labelCiphertext, iv: labelIv } = await encryptData(label, currentKey);
  const { ciphertext: contentCiphertext, iv: contentIv } = await encryptData(content, currentKey);
  
  block.labelCiphertext = labelCiphertext;
  block.labelIv = labelIv;
  block.contentCiphertext = contentCiphertext;
  block.contentIv = contentIv;
  
  await persist();
}

export async function deleteEnvironmentBlock(projectId, blockId) {
  ensureUnlocked();
  
  const project = currentVaultData.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  
  project.envBlocks = project.envBlocks.filter(b => b.id !== blockId);
  await persist();
}

/**
 * Changes the master password by deriving a new key, re-encrypting all data, and saving.
 */
export async function changeMasterPassword(newPassword) {
  ensureUnlocked();
  
  const newSalt = generateSalt();
  const newKey = await deriveKey(newPassword, newSalt);
  
  const { ciphertext: newMagic, iv: newMagicIv } = await encryptData(MAGIC_STRING, newKey);
  
  const newProjects = [];
  
  // Re-encrypt all projects and env blocks
  for (const proj of currentVaultData.projects) {
    const name = await decryptData(proj.nameCiphertext, proj.nameIv, currentKey);
    const { ciphertext: nameCiphertext, iv: nameIv } = await encryptData(name, newKey);
    
    const newEnvBlocks = [];
    for (const block of proj.envBlocks) {
      const label = await decryptData(block.labelCiphertext, block.labelIv, currentKey);
      const content = await decryptData(block.contentCiphertext, block.contentIv, currentKey);
      
      const { ciphertext: labelCiphertext, iv: labelIv } = await encryptData(label, newKey);
      const { ciphertext: contentCiphertext, iv: contentIv } = await encryptData(content, newKey);
      
      newEnvBlocks.push({
        id: block.id,
        labelCiphertext,
        labelIv,
        contentCiphertext,
        contentIv
      });
    }
    
    newProjects.push({
      id: proj.id,
      nameCiphertext,
      nameIv,
      envBlocks: newEnvBlocks
    });
  }
  
  const newVault = {
    version: 1,
    salt: newSalt,
    kdfParams: currentVaultData.kdfParams,
    magicCiphertext: newMagic,
    magicIv: newMagicIv,
    projects: newProjects
  };
  
  await saveVault(newVault);
  currentKey = newKey;
  currentVaultData = newVault;

  // Sync the re-encrypted vault to cloud
  await syncToCloud(newVault);
}

/**
 * Search across all decrypted project names and env block labels.
 * Returns an array of match objects without decrypting env content.
 */
export async function searchVault(query) {
  ensureUnlocked();
  if (!query || !query.trim()) return [];

  const q = query.toLowerCase();
  const results = [];

  for (const proj of currentVaultData.projects) {
    const projName = await decryptData(proj.nameCiphertext, proj.nameIv, currentKey);
    for (const block of proj.envBlocks) {
      const label = await decryptData(block.labelCiphertext, block.labelIv, currentKey);
      if (projName.toLowerCase().includes(q) || label.toLowerCase().includes(q)) {
        results.push({
          projectId: proj.id,
          projectName: projName,
          blockId: block.id,
          label,
        });
      }
    }
  }
  return results;
}
