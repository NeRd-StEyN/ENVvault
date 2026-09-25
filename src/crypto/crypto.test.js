import { describe, it, expect, beforeAll } from 'vitest';
import { webcrypto } from 'node:crypto';

// Polyfill window.crypto for Node environment
if (typeof window === 'undefined') {
  global.window = { crypto: webcrypto };
} else if (!window.crypto) {
  window.crypto = webcrypto;
}

import {
  deriveKey,
  generateSalt,
  generateIV,
  encryptData,
  decryptData
} from './crypto.js';

describe('Crypto Module', () => {
  const password = 'my-super-secret-master-password';

  it('generates a random salt of correct length', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    
    expect(salt1.length).toBe(16);
    expect(salt2.length).toBe(16);
    expect(salt1).not.toEqual(salt2);
  });

  it('generates a random IV of correct length', () => {
    const iv1 = generateIV();
    const iv2 = generateIV();
    
    expect(iv1.length).toBe(12); // 96 bits
    expect(iv2.length).toBe(12);
    expect(iv1).not.toEqual(iv2);
  });

  it('multiple encryption operations produce different IVs', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);

    const { iv: iv1 } = await encryptData('test1', key);
    const { iv: iv2 } = await encryptData('test2', key);

    expect(iv1).not.toEqual(iv2);
  });

  it('performs an encryption/decryption round trip', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = 'DATABASE_URL=postgres://user:pass@localhost:5432/db';
    
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypts and decrypts empty content', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = '';
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypts and decrypts unicode content', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = 'MY_VAR=hello 🌍 안녕하세요 😊';
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('encrypts and decrypts large .env content', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = Array(1000).fill('VAR_N=VALUE_N_SOMETHING_LONG').join('\n');
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    const decrypted = await decryptData(ciphertext, iv, key);
    expect(decrypted).toBe(plaintext);
  });

  it('fails decryption with wrong password', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = 'SECRET=123';
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    // Derive a different key using wrong password
    const wrongKey = await deriveKey('wrong-password', salt);
    
    await expect(decryptData(ciphertext, iv, wrongKey)).rejects.toThrow();
  });

  it('fails decryption with wrong key', async () => {
    const salt1 = generateSalt();
    const key1 = await deriveKey(password, salt1);
    
    const salt2 = generateSalt();
    const key2 = await deriveKey(password, salt2); // Different salt -> different key
    
    const plaintext = 'SECRET=123';
    const { ciphertext, iv } = await encryptData(plaintext, key1);
    
    await expect(decryptData(ciphertext, iv, key2)).rejects.toThrow();
  });

  it('fails decryption if ciphertext is modified (authentication failure)', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = 'SECRET=123';
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    // Modify one byte of the ciphertext
    const modifiedCiphertext = new Uint8Array(ciphertext);
    modifiedCiphertext[0] ^= 1; // flip a bit
    
    await expect(decryptData(modifiedCiphertext, iv, key)).rejects.toThrow();
  });

  it('fails decryption if IV is modified', async () => {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    
    const plaintext = 'SECRET=123';
    const { ciphertext, iv } = await encryptData(plaintext, key);
    
    // Modify one byte of the IV
    const modifiedIv = new Uint8Array(iv);
    modifiedIv[0] ^= 1; // flip a bit
    
    await expect(decryptData(ciphertext, modifiedIv, key)).rejects.toThrow();
  });
});
