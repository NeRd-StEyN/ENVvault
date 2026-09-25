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
  apiKey: "AIzaSyA6C7lyO4B6UlRe8GncnAGMWicduuu-spY",
  authDomain: "envvault-4af47.firebaseapp.com",
  projectId: "envvault-4af47",
  storageBucket: "envvault-4af47.firebasestorage.app",
  messagingSenderId: "702783786776",
  appId: "1:702783786776:web:22fed42d12fe67b46a186d"
  // measurementId omitted — Analytics disabled intentionally (security app)
};
// ─────────────────────────────────────────────────────────────────────────────

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

