import { collection, doc, getDoc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import type { Categoria, Comercio, Publicacion, UsuarioApp } from '@/types';

function getFirestoreInstance() {
  return getFirestore(getFirebaseApp());
}

const usersCollection = (id: string) => doc(getFirestoreInstance(), 'users', id);
const publicacionesCollection = (id: string) => doc(getFirestoreInstance(), 'publicaciones', id);
const comerciosCollection = (id: string) => doc(getFirestoreInstance(), 'comercios', id);
const categoriasCollection = (id: string) => doc(getFirestoreInstance(), 'categorias', id);
const usersCollectionRef = () => collection(getFirestoreInstance(), 'users');
const comerciosCollectionRef = () => collection(getFirestoreInstance(), 'comercios');
const publicacionesCollectionRef = () => collection(getFirestoreInstance(), 'publicaciones');
const categoriasCollectionRef = () => collection(getFirestoreInstance(), 'categorias');

const activeComerciosQuery = () => query(comerciosCollectionRef(), where('activo', '==', true));
const activePublicacionesQuery = () => query(publicacionesCollectionRef(), where('activo', '==', true));
const activeCategoriasQuery = () => query(categoriasCollectionRef(), where('activo', '==', true));

export async function createUserProfile(user: UsuarioApp) {
  return setDoc(usersCollection(user.id), user);
}

export async function getUserProfile(id: string): Promise<UsuarioApp | null> {
  const userDoc = await getDoc(usersCollection(id));
  return userDoc.exists() ? (userDoc.data() as UsuarioApp) : null;
}

export async function getAllUsers(): Promise<UsuarioApp[]> {
  const querySnapshot = await getDocs(usersCollectionRef());
  return querySnapshot.docs.map((docItem) => docItem.data() as UsuarioApp);
}

export async function createPublication(publicacion: Publicacion) {
  return setDoc(publicacionesCollection(publicacion.id), publicacion);
}

export async function getLatestPublications(limit = 10): Promise<Publicacion[]> {
  const publicacionesQuery = activePublicacionesQuery();
  const querySnapshot = await getDocs(publicacionesQuery);
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion).slice(0, limit);
}

export async function getAllPublications(): Promise<Publicacion[]> {
  const querySnapshot = await getDocs(activePublicacionesQuery());
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion);
}

export async function getPublicationsByCommerce(comercioId: string): Promise<Publicacion[]> {
  const publicacionesQuery = query(
    publicacionesCollectionRef(),
    where('comercioId', '==', comercioId),
    where('activo', '==', true)
  );
  const querySnapshot = await getDocs(publicacionesQuery);
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion);
}

export async function getAllComercios(): Promise<Comercio[]> {
  const querySnapshot = await getDocs(activeComerciosQuery());
  return querySnapshot.docs.map((docItem) => docItem.data() as Comercio);
}

export async function getComercioById(id: string): Promise<Comercio | null> {
  const comercioDoc = await getDoc(comerciosCollection(id));
  return comercioDoc.exists() ? (comercioDoc.data() as Comercio) : null;
}

export async function createCommerce(comercio: Comercio) {
  return setDoc(comerciosCollection(comercio.id), comercio);
}

export async function updateCommerce(id: string, comercio: Partial<Comercio>) {
  return setDoc(comerciosCollection(id), comercio, { merge: true });
}

export async function getCommerceByOwner(ownerId: string): Promise<Comercio | null> {
  const comerciosQuery = query(comerciosCollectionRef(), where('ownerId', '==', ownerId));
  const querySnapshot = await getDocs(comerciosQuery);
  return querySnapshot.docs[0]?.data() as Comercio | null;
}

export async function createCategory(categoria: Categoria) {
  return setDoc(categoriasCollection(categoria.id), categoria);
}

export async function getAllCategories(): Promise<Categoria[]> {
  const querySnapshot = await getDocs(categoriasCollectionRef());
  return querySnapshot.docs.map((docItem) => docItem.data() as Categoria);
}

export async function getActiveCategories(): Promise<Categoria[]> {
  const querySnapshot = await getDocs(activeCategoriasQuery());
  return querySnapshot.docs.map((docItem) => docItem.data() as Categoria);
}

export async function getCategoryById(id: string): Promise<Categoria | null> {
  const categoryDoc = await getDoc(categoriasCollection(id));
  return categoryDoc.exists() ? (categoryDoc.data() as Categoria) : null;
}

export async function seedCategories(categorias: Categoria[]) {
  return Promise.all(categorias.map((categoria) => setDoc(categoriasCollection(categoria.id), categoria)));
}
