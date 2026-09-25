#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer').default || require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
const { deriveKey, decryptData, encryptData } = require('./crypto.js');

const dotenv = require('dotenv');

// Load environment variables (.env in cwd or project root)
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const configPath = path.join(os.homedir(), '.envvault-cli.json');
const config = {
  get: (key) => {
    try { return JSON.parse(fs.readFileSync(configPath, 'utf8'))[key]; } catch { return null; }
  },
  set: (key, value) => {
    let data = {};
    try { data = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { }
    data[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(data), 'utf8');
  }
};

const program = new Command();

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UTILS ---
function base64ToUint8Array(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function deserializeVault(data) {
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
  };
}

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
  };
}

async function fetchVault(uid) {
  const vaultRef = doc(db, 'vaults', uid);
  const snap = await getDoc(vaultRef);
  if (!snap.exists()) {
    throw new Error('No vault found in the cloud. Please create one in the web app first.');
  }
  return deserializeVault(snap.data());
}

async function uploadVault(uid, vaultData) {
  const vaultRef = doc(db, 'vaults', uid);
  await setDoc(vaultRef, serializeVault(vaultData));
}

async function unlockVault(vaultData, masterPassword) {
  const key = await deriveKey(masterPassword, vaultData.salt, vaultData.kdfParams.iterations);

  // Verify magic string
  const decryptedMagic = await decryptData(vaultData.magicCiphertext, vaultData.magicIv, key);
  if (decryptedMagic !== 'ENVVAULT_OK') {
    throw new Error('Authentication failed (wrong password)');
  }

  return key;
}

function getCredentials() {
  const email = config.get('email');
  const password = config.get('password');
  if (!email || !password) {
    console.error('Not logged in. Run: envvault login');
    process.exit(1);
  }
  return { email, password };
}

async function promptMasterPassword() {
  const { masterPassword } = await inquirer.prompt([
    {
      type: 'password',
      name: 'masterPassword',
      message: 'Enter Master Password to unlock vault:',
      mask: '*'
    }
  ]);
  return masterPassword;
}

async function authenticateAndUnlock() {
  const creds = getCredentials();
  await signInWithEmailAndPassword(auth, creds.email, creds.password);

  const user = await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        unsubscribe();
        resolve(u);
      }
    });
  });

  const vaultData = await fetchVault(user.uid);
  const masterPassword = await promptMasterPassword();
  const key = await unlockVault(vaultData, masterPassword);

  return { user, vaultData, key };
}

// --- COMMANDS ---

program
  .name('envvault')
  .description('CLI for EnvVault - Zero-Knowledge Secret Manager')
  .version('1.0.0');

program
  .command('login')
  .description('Log into your Firebase account')
  .action(async () => {
    const answers = await inquirer.prompt([
      { type: 'input', name: 'email', message: 'Email:' },
      { type: 'password', name: 'password', message: 'Account Password:', mask: '*' }
    ]);
    try {
      await signInWithEmailAndPassword(auth, answers.email, answers.password);
      config.set('email', answers.email);
      config.set('password', answers.password);
      console.log('✅ Logged in successfully!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Login failed:', err.message);
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Log out and clear saved credentials')
  .action(() => {
    config.set('email', null);
    config.set('password', null);
    console.log('✅ Logged out successfully.');
    process.exit(0);
  });

program
  .command('pull <project_name> [env_label]')
  .alias('get')
  .description('Pull env variables and print to stdout or save to file')
  .option('-o, --out <file>', 'Output file (e.g., .env)')
  .action(async (projectName, envLabel, options) => {
    try {
      const { vaultData, key } = await authenticateAndUnlock();

      let targetProject = null;
      for (const proj of vaultData.projects) {
        const name = await decryptData(proj.nameCiphertext, proj.nameIv, key);
        if (name === projectName) {
          targetProject = proj;
          break;
        }
      }
      if (!targetProject) throw new Error(`Project "${projectName}" not found.`);

      let targetBlock = null;
      let targetLabel = '';
      if (envLabel) {
        for (const block of targetProject.envBlocks) {
          const label = await decryptData(block.labelCiphertext, block.labelIv, key);
          if (label === envLabel) {
            targetBlock = block;
            targetLabel = label;
            break;
          }
        }
        if (!targetBlock) throw new Error(`Env "${envLabel}" not found in project "${projectName}".`);
      } else {
        if (targetProject.envBlocks.length === 0) throw new Error(`No env blocks found in project "${projectName}".`);
        targetBlock = targetProject.envBlocks[0];
        targetLabel = await decryptData(targetBlock.labelCiphertext, targetBlock.labelIv, key);
        console.warn(`[!] No env_label specified. Using the first one found: ${targetLabel}`);
      }

      const content = await decryptData(targetBlock.contentCiphertext, targetBlock.contentIv, key);

      if (options.out) {
        fs.writeFileSync(path.resolve(process.cwd(), options.out), content, 'utf8');
        console.log(`✅ Saved ${projectName} / ${targetLabel} to ${options.out}`);
      } else {
        console.log(content);
      }
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('push <project_name> <env_label>')
  .alias('add')
  .description('Push local file to the vault (creates project/env if not exists)')
  .requiredOption('-i, --in <file>', 'Input file (e.g., .env)')
  .action(async (projectName, envLabel, options) => {
    try {
      const { user, vaultData, key } = await authenticateAndUnlock();
      const content = fs.readFileSync(path.resolve(process.cwd(), options.in), 'utf8');

      let targetProject = null;
      for (const proj of vaultData.projects) {
        const name = await decryptData(proj.nameCiphertext, proj.nameIv, key);
        if (name === projectName) {
          targetProject = proj;
          break;
        }
      }

      if (!targetProject) {
        const encName = await encryptData(projectName, key);
        targetProject = {
          id: randomUUID(),
          nameCiphertext: encName.ciphertext,
          nameIv: encName.iv,
          envBlocks: []
        };
        vaultData.projects.push(targetProject);
        console.log(`Created new project: ${projectName}`);
      }

      let targetBlock = null;
      for (const block of targetProject.envBlocks) {
        const label = await decryptData(block.labelCiphertext, block.labelIv, key);
        if (label === envLabel) {
          targetBlock = block;
          break;
        }
      }

      const encContent = await encryptData(content, key);

      if (!targetBlock) {
        const encLabel = await encryptData(envLabel, key);
        targetBlock = {
          id: randomUUID(),
          labelCiphertext: encLabel.ciphertext,
          labelIv: encLabel.iv,
          contentCiphertext: encContent.ciphertext,
          contentIv: encContent.iv
        };
        targetProject.envBlocks.push(targetBlock);
        console.log(`Created new env: ${envLabel}`);
      } else {
        targetBlock.contentCiphertext = encContent.ciphertext;
        targetBlock.contentIv = encContent.iv;
        console.log(`Updated env: ${envLabel}`);
      }

      await uploadVault(user.uid, vaultData);
      console.log('✅ Push successful!');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('delete-project <project_name>')
  .alias('rm-p')
  .description('Delete a project from the vault')
  .action(async (projectName) => {
    try {
      const { user, vaultData, key } = await authenticateAndUnlock();

      let projIndex = -1;
      for (let i = 0; i < vaultData.projects.length; i++) {
        const name = await decryptData(vaultData.projects[i].nameCiphertext, vaultData.projects[i].nameIv, key);
        if (name === projectName) {
          projIndex = i;
          break;
        }
      }

      if (projIndex === -1) throw new Error(`Project "${projectName}" not found.`);

      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'sure',
        message: `Are you sure you want to delete project "${projectName}"?`,
        default: false
      }]);

      if (!confirm.sure) {
        console.log('Cancelled.');
        process.exit(0);
      }

      vaultData.projects.splice(projIndex, 1);
      await uploadVault(user.uid, vaultData);
      console.log(`✅ Deleted project: ${projectName}`);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program
  .command('delete-env <project_name> <env_label>')
  .alias('rm-e')
  .description('Delete an environment block from a project')
  .action(async (projectName, envLabel) => {
    try {
      const { user, vaultData, key } = await authenticateAndUnlock();

      let targetProject = null;
      for (const proj of vaultData.projects) {
        const name = await decryptData(proj.nameCiphertext, proj.nameIv, key);
        if (name === projectName) {
          targetProject = proj;
          break;
        }
      }

      if (!targetProject) throw new Error(`Project "${projectName}" not found.`);

      let blockIndex = -1;
      for (let i = 0; i < targetProject.envBlocks.length; i++) {
        const label = await decryptData(targetProject.envBlocks[i].labelCiphertext, targetProject.envBlocks[i].labelIv, key);
        if (label === envLabel) {
          blockIndex = i;
          break;
        }
      }

      if (blockIndex === -1) throw new Error(`Env "${envLabel}" not found in project "${projectName}".`);

      const confirm = await inquirer.prompt([{
        type: 'confirm',
        name: 'sure',
        message: `Are you sure you want to delete "${envLabel}" from "${projectName}"?`,
        default: false
      }]);

      if (!confirm.sure) {
        console.log('Cancelled.');
        process.exit(0);
      }

      targetProject.envBlocks.splice(blockIndex, 1);
      await uploadVault(user.uid, vaultData);
      console.log(`✅ Deleted env: ${envLabel}`);
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
