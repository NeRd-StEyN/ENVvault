#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer').default || require('inquirer');
const Conf = require('conf');
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
const { deriveKey, decryptData, encryptData } = require('./crypto.js');

const config = new Conf({ projectName: 'envvault-cli' });
const program = new Command();

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyA6C7lyO4B6UlRe8GncnAGMWicduuu-spY",
  authDomain: "envvault-4af47.firebaseapp.com",
  projectId: "envvault-4af47",
  storageBucket: "envvault-4af47.firebasestorage.app",
  messagingSenderId: "702783786776",
  appId: "1:702783786776:web:22fed42d12fe67b46a186d"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UTILS ---
async function fetchVault(uid) {
  const vaultRef = doc(db, 'vaults', uid);
  const snap = await getDoc(vaultRef);
  if (!snap.exists()) {
    throw new Error('No vault found in the cloud. Please create one in the web app first.');
  }
  return snap.data();
}

async function unlockVault(vaultData, masterPassword) {
  const key = await deriveKey(masterPassword, vaultData.salt, vaultData.iterations);
  const plaintext = await decryptData(vaultData.ciphertext, vaultData.iv, key);
  return { vault: JSON.parse(plaintext), key };
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
  .command('pull <project_name> [env_label]')
  .description('Pull env variables and print to stdout or save to file')
  .option('-o, --out <file>', 'Output file (e.g., .env)')
  .action(async (projectName, envLabel, options) => {
    const creds = getCredentials();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, creds.email, creds.password);
      const vaultData = await fetchVault(userCredential.user.uid);
      const masterPassword = await promptMasterPassword();
      
      const { vault } = await unlockVault(vaultData, masterPassword);
      
      const project = vault.projects.find(p => p.name === projectName);
      if (!project) throw new Error(`Project "${projectName}" not found.`);
      
      let block = null;
      if (envLabel) {
         block = project.environmentBlocks.find(b => b.label === envLabel);
         if (!block) throw new Error(`Env "${envLabel}" not found in project "${projectName}".`);
      } else {
         // default to the first one if not specified
         if (project.environmentBlocks.length === 0) throw new Error(`No env blocks found in project "${projectName}".`);
         block = project.environmentBlocks[0];
         console.warn(`[!] No env_label specified. Using the first one found: ${block.label}`);
      }

      if (options.out) {
        fs.writeFileSync(path.resolve(process.cwd(), options.out), block.content, 'utf8');
        console.log(`✅ Saved ${projectName} / ${block.label} to ${options.out}`);
      } else {
        console.log(block.content);
      }
      process.exit(0);
    } catch (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
