import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  sendPasswordResetEmail,
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
  const persistenceOptions = [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence];

  for (const persistence of persistenceOptions) {
    try {
      await setPersistence(authInstance, persistence);
      return authInstance;
    } catch {
      // Try the next persistence mode so login still works in restricted browsers.
    }
  }

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

export async function sendUserPasswordReset(email: string): Promise<void> {
  const auth = await ensureLocalPersistence(getAuthInstance());
  return sendPasswordResetEmail(auth, normalizeEmail(email));
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = await ensureLocalPersistence(getAuthInstance());
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logoutUser() {
  return signOut(getAuthInstance());
}

function getAuthErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
}

export function getAuthErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);
  const message = error instanceof Error ? error.message : '';

  if (code === 'auth/invalid-email') {
    return 'El email no es valido. Revisa que este escrito completo.';
  }

  if (code === 'auth/missing-password') {
    return 'Ingresa la contrasena de la cuenta.';
  }

  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'El email o la contrasena no coinciden. Usa la contrasena temporal exacta o restablecela desde esta pantalla.';
  }

  if (code === 'auth/user-disabled') {
    return 'Esta cuenta esta deshabilitada en Firebase Auth.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Firebase bloqueo temporalmente los intentos por seguridad. Espera unos minutos o restablece la contrasena.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'El inicio con email y contrasena no esta habilitado en Firebase Auth.';
  }

  if (code === 'auth/unauthorized-domain') {
    return 'Este dominio no esta autorizado en Firebase Authentication.';
  }

  if (code.includes('requests-from-referer') || message.includes('requests from referer')) {
    return 'Firebase esta bloqueando este dominio o IP por restriccion de API key. Agrega el dominio actual en Google Cloud/Firebase o entra desde el dominio de produccion.';
  }

  if (code.includes('api-key-not-valid') || code === 'auth/invalid-api-key') {
    return 'La API key de Firebase no es valida para este dominio. Revisa las restricciones de la clave en Google Cloud.';
  }

  if (code === 'auth/network-request-failed') {
    return 'No se pudo conectar con Firebase. Revisa la conexion e intenta nuevamente.';
  }

  if (code === 'auth/configuration-not-found') {
    return 'Firebase Auth no esta configurado para este proyecto.';
  }

  return 'No se pudo iniciar sesion. Revisa tus datos e intenta nuevamente.';
}

export function getPasswordResetErrorMessage(error: unknown) {
  const code = getAuthErrorCode(error);
  const message = error instanceof Error ? error.message : '';

  if (code === 'auth/invalid-email' || code === 'auth/missing-email') {
    return 'Ingresa un email valido para enviar la recuperacion.';
  }

  if (code === 'auth/user-not-found') {
    return 'No encontramos una cuenta creada con ese email.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Firebase bloqueo temporalmente los intentos. Espera unos minutos y vuelve a probar.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'El inicio con email y contrasena no esta habilitado en Firebase Auth.';
  }

  if (code.includes('requests-from-referer') || message.includes('requests from referer')) {
    return 'Firebase esta bloqueando este dominio o IP por restriccion de API key. Agrega el dominio actual en Google Cloud/Firebase o entra desde el dominio de produccion.';
  }

  if (code.includes('api-key-not-valid') || code === 'auth/invalid-api-key') {
    return 'La API key de Firebase no es valida para este dominio. Revisa las restricciones de la clave en Google Cloud.';
  }

  if (code === 'auth/network-request-failed') {
    return 'No se pudo conectar con Firebase. Revisa la conexion e intenta nuevamente.';
  }

  return 'No se pudo enviar el correo de recuperacion.';
}
