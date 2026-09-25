/**
 * Cloud Sync Module — Zero-Knowledge
 *
 * Syncs the encrypted vault blob to/from Firestore.
 *
 * SECURITY GUARANTEE:
 * Only AES-256-GCM ciphertext is ever uploaded. The plaintext master password
 * and derived encryption key never leave the device. Even Firebase/Google
 * cannot read your secrets.
 *
 * Firestore document structure (per user):
 *   /vaults/{userId} = {
 *     version: number,
 *     salt: string (base64),
 *     kdfParams: { algorithm, hash, iterations },
 *     magicCiphertext: string (base64),
 *     magicIv: string (base64),
 *     projects: Array<EncryptedProject>,
 *     lastModified: Firestore Timestamp,
 *   }
 */

import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64.js';

/**
 * Converts the raw IndexedDB vault (with Uint8Arrays) to a Firestore-safe
 * serializable object (all binary fields become base64 strings).
 */
function serializeVault(vault) {
  return {
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
        contentIv: uint8ArrayToBase64(block.contentIv),
      })),
    })),
    updatedAt: vault.updatedAt || Date.now(),
    lastModified: serverTimestamp(),
  };
}

/**
 * Converts a Firestore vault document (base64 strings) back to the raw
 * vault structure (with Uint8Arrays) for use in IndexedDB / vault.js.
 */
function deserializeVault(data) {
  let time = data.updatedAt;
  if (!time && data.lastModified) {
    time = typeof data.lastModified.toMillis === 'function' ? data.lastModified.toMillis() : data.lastModified;
  }

  return {
    version: data.version,
    salt: base64ToUint8Array(data.salt),
    kdfParams: data.kdfParams,
    magicCiphertext: base64ToUint8Array(data.magicCiphertext),
    magicIv: base64ToUint8Array(data.magicIv),
    projects: (data.projects || []).map(proj => ({
      id: proj.id,
      nameCiphertext: base64ToUint8Array(proj.nameCiphertext),
      nameIv: base64ToUint8Array(proj.nameIv),
      envBlocks: (proj.envBlocks || []).map(block => ({
        id: block.id,
        labelCiphertext: base64ToUint8Array(block.labelCiphertext),
        labelIv: base64ToUint8Array(block.labelIv),
        contentCiphertext: base64ToUint8Array(block.contentCiphertext),
        contentIv: base64ToUint8Array(block.contentIv),
      })),
    })),
    updatedAt: time || 0
  };
}

/**
 * Uploads the encrypted vault to Firestore for the given user.
 * Safe to call while offline — Firestore SDK queues the write and
 * flushes it automatically when connectivity is restored.
 *
 * @param {string} userId  Firebase user UID
 * @param {Object} vault   Raw vault object (with Uint8Arrays)
 */
export async function uploadVault(userId, vault) {
  if (!userId) throw new Error('Not authenticated');
  const ref = doc(db, 'vaults', userId);
  await setDoc(ref, serializeVault(vault));
}

/**
 * Downloads the encrypted vault from Firestore for the given user.
 * Falls back gracefully if offline (returns null so callers can use
 * the local IndexedDB copy instead).
 *
 * @param {string} userId  Firebase user UID
 * @returns {Object|null}  Raw vault object (with Uint8Arrays) or null
 */
export async function downloadVault(userId) {
  if (!userId) return null;
  try {
    const ref = doc(db, 'vaults', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return deserializeVault(snap.data());
  } catch (err) {
    // If offline and no local cache, getDoc throws — return null
    // so callers fall back to local IndexedDB copy.
    if (err.code === 'unavailable' || err.message?.includes('offline')) {
      return null;
    }
    throw err;
  }
}
