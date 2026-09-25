const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function test() {
  try {
    const creds = fs.readFileSync(path.join(os.homedir(), '.envvault-cli.json'), 'utf8');
    const { email, password } = JSON.parse(creds);
    console.log("Signing in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const token = await userCredential.user.getIdToken();
    
    console.log("Fetching vault via REST...");
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/vaults/${uid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data keys:", Object.keys(data));
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}
test();
