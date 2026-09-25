import { loadVault, saveVault } from '../storage/indexeddb.js';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64.js';

/**
 * Exports the currently stored vault from IndexedDB to a JSON string.
 */
export async function exportBackup() {
  const vault = await loadVault();
  if (!vault) {
    throw new Error('No vault to export');
  }

  // Convert all Uint8Array fields to Base64 strings for JSON serialization
  const backup = {
    version: vault.version,
    salt: uint8ArrayToBase64(vault.salt),
    kdfParams: vault.kdfParams,
    magicCiphertext: uint8ArrayToBase64(vault.magicCiphertext),
    magicIv: uint8ArrayToBase64(vault.magicIv),
    projects: vault.projects.map(proj => ({
      id: proj.id,
      nameCiphertext: uint8ArrayToBase64(proj.nameCiphertext),
      nameIv: uint8ArrayToBase64(proj.nameIv),
      envBlocks: proj.envBlocks.map(block => ({
        id: block.id,
        labelCiphertext: uint8ArrayToBase64(block.labelCiphertext),
        labelIv: uint8ArrayToBase64(block.labelIv),
        contentCiphertext: uint8ArrayToBase64(block.contentCiphertext),
        contentIv: uint8ArrayToBase64(block.contentIv)
      }))
    }))
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Imports a JSON backup string into IndexedDB.
 */
export async function importBackup(jsonString) {
  let backup;
  try {
    backup = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid backup file formatting');
  }

  if (backup.version !== 1) {
    throw new Error('Unsupported backup version');
  }

  // Reconstruct Uint8Arrays
  const vault = {
    version: backup.version,
    salt: base64ToUint8Array(backup.salt),
    kdfParams: backup.kdfParams,
    magicCiphertext: base64ToUint8Array(backup.magicCiphertext),
    magicIv: base64ToUint8Array(backup.magicIv),
    projects: backup.projects.map(proj => ({
      id: proj.id,
      nameCiphertext: base64ToUint8Array(proj.nameCiphertext),
      nameIv: base64ToUint8Array(proj.nameIv),
      envBlocks: proj.envBlocks.map(block => ({
        id: block.id,
        labelCiphertext: base64ToUint8Array(block.labelCiphertext),
        labelIv: base64ToUint8Array(block.labelIv),
        contentCiphertext: base64ToUint8Array(block.contentCiphertext),
        contentIv: base64ToUint8Array(block.contentIv)
      }))
    }))
  };

  await saveVault(vault);
}
