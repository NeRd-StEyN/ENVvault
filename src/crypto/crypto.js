/**
 * This application encrypts vault data locally in the user's browser.
 *
 * A 256-bit encryption key is derived from the user's master password
 * using PBKDF2-HMAC-SHA-256 with a random per-vault salt and at least
 * 250,000 iterations.
 *
 * Vault data is encrypted using AES-256-GCM.
 *
 * Every encryption operation uses a fresh random 96-bit IV.
 *
 * The derived encryption key exists only in memory while the vault
 * is unlocked and is never persisted.
 */

/**
 * Generates a cryptographically secure random salt for PBKDF2.
 * @returns {Uint8Array} A 16-byte random salt.
 */
export function generateSalt() {
  return window.crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generates a cryptographically secure random IV for AES-GCM.
 * @returns {Uint8Array} A 12-byte (96-bit) random IV.
 */
export function generateIV() {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derives a 256-bit AES-GCM key from a password using PBKDF2.
 * @param {string} password The master password.
 * @param {Uint8Array} salt The salt for key derivation.
 * @param {number} iterations Number of iterations (minimum 250,000 recommended).
 * @returns {Promise<CryptoKey>} The derived CryptoKey (AES-GCM 256-bit).
 */
export async function deriveKey(password, salt, iterations = 250000) {
  const enc = new TextEncoder();
  
  // Import the password as a raw key for derivation
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive the AES-GCM key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // Do not allow extracting the key material
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data using AES-GCM.
 * @param {string} plaintext The text to encrypt.
 * @param {CryptoKey} key The derived AES-GCM key.
 * @returns {Promise<{ ciphertext: Uint8Array, iv: Uint8Array }>} The encrypted data and the IV used.
 */
export async function encryptData(plaintext, key) {
  const iv = generateIV();
  const enc = new TextEncoder();
  const encodedData = enc.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    ciphertext: new Uint8Array(encryptedBuffer),
    iv: iv,
  };
}

/**
 * Decrypts data using AES-GCM.
 * @param {Uint8Array} ciphertext The encrypted data.
 * @param {Uint8Array} iv The IV used during encryption.
 * @param {CryptoKey} key The AES-GCM key.
 * @returns {Promise<string>} The decrypted plaintext.
 */
export async function decryptData(ciphertext, iv, key) {
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (error) {
    throw new Error('Decryption failed. The data may have been tampered with or the wrong key/IV was used.');
  }
}
