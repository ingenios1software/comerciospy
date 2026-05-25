import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import type { Comercio, Publicacion, UsuarioApp } from '@/types';

function getFirestoreInstance() {
  return getFirestore(getFirebaseApp());
}

const usersCollection = (id: string) => doc(getFirestoreInstance(), 'users', id);
const publicacionesCollection = (id: string) => doc(getFirestoreInstance(), 'publicaciones', id);
const comerciosCollection = (id: string) => doc(getFirestoreInstance(), 'comercios', id);
const comerciosCollectionRef = () => collection(getFirestoreInstance(), 'comercios');
const publicacionesCollectionRef = () => collection(getFirestoreInstance(), 'publicaciones');

export async function createUserProfile(user: UsuarioApp) {
  return setDoc(usersCollection(user.id), user);
}

export async function getUserProfile(id: string): Promise<UsuarioApp | null> {
  const userDoc = await getDoc(usersCollection(id));
  return userDoc.exists() ? (userDoc.data() as UsuarioApp) : null;
}

export async function createPublication(publicacion: Publicacion) {
  return setDoc(publicacionesCollection(publicacion.id), publicacion);
}

export async function getLatestPublications(limit = 10): Promise<Publicacion[]> {
  const publicacionesQuery = query(publicacionesCollectionRef(), where('activo', '==', true));
  const querySnapshot = await getDocs(publicacionesQuery);
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion).slice(0, limit);
}

export async function getPublicationsByCommerce(comercioId: string): Promise<Publicacion[]> {
  const publicacionesQuery = query(publicacionesCollectionRef(), where('comercioId', '==', comercioId));
  const querySnapshot = await getDocs(publicacionesQuery);
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion);
}

export async function getAllComercios(): Promise<Comercio[]> {
  const querySnapshot = await getDocs(comerciosCollectionRef());
  return querySnapshot.docs.map((docItem) => docItem.data() as Comercio);
}

export async function createCommerce(comercio: Comercio) {
  return setDoc(comerciosCollection(comercio.id), comercio);
}
