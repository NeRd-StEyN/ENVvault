import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveVault, loadVault, deleteVault } from './indexeddb.js';

describe('IndexedDB Storage Module', () => {
  beforeEach(async () => {
    // Ensure the DB is clear before each test
    // deleteVault relies on the DB existing, so we handle a potential failure gracefully
    try {
      await deleteVault();
    } catch (e) {
      // Ignored if DB doesn't exist yet
    }
  });

  it('loads null when no vault exists', async () => {
    const vault = await loadVault();
    expect(vault).toBeNull();
  });

  it('saves and loads an encrypted vault structure successfully', async () => {
    // This mocks the structure required by the data model
    const mockVault = {
      version: 1,
      salt: new Uint8Array([1, 2, 3]), // Mocks salt buffer
      kdfParams: {
        algorithm: 'PBKDF2',
        hash: 'SHA-256',
        iterations: 250000
      },
      projects: [
        {
          id: 'proj-1',
          nameCiphertext: new Uint8Array([4, 5, 6]),
          nameIv: new Uint8Array([7, 8, 9]),
          envBlocks: [
            {
              id: 'env-1',
              labelCiphertext: new Uint8Array([10, 11]),
              labelIv: new Uint8Array([12, 13]),
              contentCiphertext: new Uint8Array([14, 15, 16]),
              contentIv: new Uint8Array([17, 18, 19])
            }
          ]
        }
      ]
    };

    // Save
    await saveVault(mockVault);

    // Load
    const loadedVault = await loadVault();

    expect(loadedVault).not.toBeNull();
    expect(loadedVault.version).toBe(1);
    
    // Uint8Arrays should be deeply equal
    expect(loadedVault.salt).toEqual(mockVault.salt);
    expect(loadedVault.projects[0].nameCiphertext).toEqual(mockVault.projects[0].nameCiphertext);
    
    // Plaintext values must NOT exist in the structure (enforced by the mock logic)
    expect(loadedVault.projects[0].name).toBeUndefined();
    expect(loadedVault.projects[0].envBlocks[0].content).toBeUndefined();
  });

  it('overwrites an existing vault correctly', async () => {
    const vault1 = { version: 1, test: 'data1' };
    const vault2 = { version: 2, test: 'data2' };

    await saveVault(vault1);
    let loaded = await loadVault();
    expect(loaded.version).toBe(1);

    await saveVault(vault2);
    loaded = await loadVault();
    expect(loaded.version).toBe(2);
  });

  it('deletes the vault successfully', async () => {
    const vault = { version: 1 };
    
    await saveVault(vault);
    let loaded = await loadVault();
    expect(loaded).not.toBeNull();

    await deleteVault();
    loaded = await loadVault();
    expect(loaded).toBeNull();
  });
});
