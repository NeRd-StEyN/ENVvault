/**
 * Encrypted Vault Storage
 *
 * This module manages storing and retrieving the encrypted vault
 * in the browser's native IndexedDB.
 *
 * IMPORTANT SECURITY RULE:
 * Never store plaintext vault information (project names, environment names,
 * .env contents) via these functions. Only the structure defined in the
 * architectural data model (with ciphertexts and IVs) is permitted.
 */

const DB_NAME = 'EnvVaultDB';
const DB_VERSION = 1;
const STORE_NAME = 'vault';
const VAULT_KEY = 'main';

/**
 * Opens and initializes the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    // We use globalThis.indexedDB to work across browser and test environments
    const indexedDB = globalThis.indexedDB || globalThis.window?.indexedDB;
    if (!indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Saves the encrypted vault data to IndexedDB.
 * @param {Object} vaultData The encrypted vault structure.
 * @returns {Promise<void>}
 */
export async function saveVault(vaultData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(vaultData, VAULT_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    // Ensure the db connection is closed when the transaction completes
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Loads the encrypted vault data from IndexedDB.
 * @returns {Promise<Object|null>} The encrypted vault structure or null if empty.
 */
export async function loadVault() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(VAULT_KEY);

    request.onsuccess = (event) => resolve(event.target.result || null);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}

/**
 * Deletes the encrypted vault data from IndexedDB.
 * @returns {Promise<void>}
 */
export async function deleteVault() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(VAULT_KEY);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
}
