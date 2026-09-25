const { webcrypto } = require('crypto');

// Node.js WebCrypto (compatible with the browser implementation)
const crypto = webcrypto;

async function deriveKey(password, saltString, iterations = 250000) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const salt = enc.encode(saltString);
  
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
  return crypto.randomUUID();
}

// Convert Uint8Array to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToArrayBuffer(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

async function encryptData(dataString, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(dataString)
  );
  
  return {
    ciphertextBase64: arrayBufferToBase64(encrypted),
    ivBase64: arrayBufferToBase64(iv)
  };
}

async function decryptData(ciphertextBase64, ivBase64, key) {
  const dec = new TextDecoder();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(ivBase64)) },
    key,
    base64ToArrayBuffer(ciphertextBase64)
  );
  return dec.decode(decrypted);
}

module.exports = {
  deriveKey,
  generateSalt,
  encryptData,
  decryptData
};
