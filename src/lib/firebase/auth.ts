import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';

export function getAuthInstance() {
  return getAuth(getFirebaseApp());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureLocalPersistence(authInstance: ReturnType<typeof getAuthInstance>) {
  await setPersistence(authInstance, browserLocalPersistence);
  return authInstance;
}

export async function signInUser(email: string, password: string): Promise<UserCredential> {
  const auth = await ensureLocalPersistence(getAuthInstance());
  return signInWithEmailAndPassword(auth, normalizeEmail(email), password);
}

export async function registerUser(email: string, password: string): Promise<UserCredential> {
  const auth = await ensureLocalPersistence(getAuthInstance());
  return createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = await ensureLocalPersistence(getAuthInstance());
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser() {
  return signOut(getAuthInstance());
}
