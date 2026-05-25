import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut, type UserCredential } from 'firebase/auth';
import { getFirebaseApp } from './firebase';

export function getAuthInstance() {
  return getAuth(getFirebaseApp());
}

export async function signInUser(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function registerUser(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(getAuthInstance(), email, password);
}

export async function logoutUser() {
  return signOut(getAuthInstance());
}
