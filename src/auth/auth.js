/**
 * Authentication Module
 *
 * Wraps Firebase Auth for sign-up, sign-in, sign-out, and auth state.
 * NOTE: Firebase account credentials (email/password) are completely separate
 * from the vault master password. Firebase Auth only identifies WHO you are.
 * The vault master password is what encrypts/decrypts your secrets and
 * NEVER leaves your device.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase.js';

/**
 * Register a new account with email and password.
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function registerUser(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential;
}

/**
 * Sign in an existing account.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').UserCredential>}
 */
export async function signInUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  return signOut(auth);
}

/**
 * Send a password reset email.
 * @param {string} email
 */
export async function sendResetEmail(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback - called with the user object or null
 * @returns {Function} unsubscribe function
 */
export function onAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the currently signed-in user (synchronously, may be null on first load).
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}
