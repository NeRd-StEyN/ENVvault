/**
 * Firebase Initialization
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (free)
 * 3. Go to Project Settings > General > Your Apps > Add Web App
 * 4. Copy the firebaseConfig object and paste it below
 * 5. In Firebase Console: Enable Authentication > Email/Password
 * 6. In Firebase Console: Enable Firestore Database (start in production mode)
 * 7. Set Firestore security rules (see below)
 *
 * FIRESTORE SECURITY RULES (paste in Firebase Console > Firestore > Rules):
 * ─────────────────────────────────────────────────────────────────────────
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /vaults/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 * ─────────────────────────────────────────────────────────────────────────
 * This ensures each user can ONLY access their own encrypted vault document.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// ─── FIREBASE CONFIG ─────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.FIREBASE_PROJECT_ID || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.FIREBASE_APP_ID || import.meta.env.VITE_FIREBASE_APP_ID
  // measurementId omitted — Analytics disabled intentionally (security app)
};
// ─────────────────────────────────────────────────────────────────────────────

if (!firebaseConfig.apiKey) {
  console.error(
    '[EnvVault] Missing FIREBASE_API_KEY environment variable. ' +
    'Please set FIREBASE_API_KEY in your .env file or deployment platform settings, then trigger a redeploy.'
  );
}

// Guard against duplicate-app initialization during hot module reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use new persistentLocalCache API (replaces deprecated enableIndexedDbPersistence)
// This enables offline support — writes are queued locally and auto-synced on reconnect
export const db = getApps().length <= 1
  ? initializeFirestore(app, {
    cache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  })
  : getFirestore(app);

export default app;

