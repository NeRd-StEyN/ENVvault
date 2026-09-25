const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
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
