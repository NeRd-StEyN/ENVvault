const { webcrypto } = require('crypto');
const crypto = webcrypto;

async function deriveKey(password, salt, iterations = 250000) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

async function encryptData(plaintext, key) {
  const iv = generateIV();
  const enc = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plaintext)
  );
  
  return {
    ciphertext: new Uint8Array(encrypted),
    iv: iv
  };
}

async function decryptData(ciphertext, iv, key) {
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed. Incorrect master password or tampered data.');
  }
}

module.exports = {
  deriveKey,
  generateSalt,
  encryptData,
  decryptData
};
