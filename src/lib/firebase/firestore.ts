import { collection, deleteField, doc, getDoc, getDocs, getFirestore, increment, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { getFirebaseApp } from './firebase';
import { isCommercePubliclyVisible } from '@/lib/subscription';
import { defaultPlans, sortPlans } from '@/lib/plans';
import type { Categoria, Comercio, PlanComercial, Publicacion, UsuarioApp } from '@/types';
import type { CommerceMetrics } from '@/types';

export function getFirestoreInstance() {
  return getFirestore(getFirebaseApp());
}

const usersCollection = (id: string) => doc(getFirestoreInstance(), 'users', id);
const publicacionesCollection = (id: string) => doc(getFirestoreInstance(), 'publicaciones', id);
const comerciosCollection = (id: string) => doc(getFirestoreInstance(), 'comercios', id);
const categoriasCollection = (id: string) => doc(getFirestoreInstance(), 'categorias', id);
const planesCollection = (id: string) => doc(getFirestoreInstance(), 'planes', id);
const usersCollectionRef = () => collection(getFirestoreInstance(), 'users');
const comerciosCollectionRef = () => collection(getFirestoreInstance(), 'comercios');
const publicacionesCollectionRef = () => collection(getFirestoreInstance(), 'publicaciones');
const categoriasCollectionRef = () => collection(getFirestoreInstance(), 'categorias');
const planesCollectionRef = () => collection(getFirestoreInstance(), 'planes');

const activeComerciosQuery = () => query(comerciosCollectionRef(), where('activo', '==', true));
const activePublicacionesQuery = () => query(publicacionesCollectionRef(), where('activo', '==', true));
const activeCategoriasQuery = () => query(categoriasCollectionRef(), where('activo', '==', true));
const activePlanesQuery = () => query(planesCollectionRef(), where('activo', '==', true));

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

export async function updateUserProfile(id: string, user: Partial<UsuarioApp>) {
  return setDoc(usersCollection(id), user, { merge: true });
}

export async function createPublication(publicacion: Publicacion) {
  return setDoc(publicacionesCollection(publicacion.id), publicacion);
}

export async function updatePublication(id: string, publicacion: Partial<Publicacion>) {
  return setDoc(publicacionesCollection(id), publicacion, { merge: true });
}

export async function markPublicationAsSold(id: string) {
  return updatePublication(id, {
    activo: false,
    estado: 'vendido',
    vendidoEn: new Date().toISOString()
  });
}

function isPublicationPubliclyVisible(publicacion: Publicacion) {
  return publicacion.moderacionEstado !== 'pending' && publicacion.moderacionEstado !== 'rejected';
}

function sortPublicationsNewestFirst(publicaciones: Publicacion[]) {
  const getCreatedAt = (publicacion: Publicacion) => {
    const createdAt = new Date(publicacion.creadoEn).getTime();
    return Number.isFinite(createdAt) ? createdAt : 0;
  };

  return [...publicaciones].sort((a, b) => getCreatedAt(b) - getCreatedAt(a) || b.id.localeCompare(a.id));
}

export async function getLatestPublications(limit = 10): Promise<Publicacion[]> {
  const [querySnapshot, comercios] = await Promise.all([getDocs(activePublicacionesQuery()), getAllComercios()]);
  const visibleCommerceIds = new Set(comercios.map((comercio) => comercio.id));

  return sortPublicationsNewestFirst(
    querySnapshot.docs
      .map((docItem) => docItem.data() as Publicacion)
      .filter(isPublicationPubliclyVisible)
      .filter((publicacion) => visibleCommerceIds.has(publicacion.comercioId))
  ).slice(0, limit);
}

export async function getAllPublications(): Promise<Publicacion[]> {
  const [querySnapshot, comercios] = await Promise.all([getDocs(activePublicacionesQuery()), getAllComercios()]);
  const visibleCommerceIds = new Set(comercios.map((comercio) => comercio.id));

  return sortPublicationsNewestFirst(
    querySnapshot.docs
      .map((docItem) => docItem.data() as Publicacion)
      .filter(isPublicationPubliclyVisible)
      .filter((publicacion) => visibleCommerceIds.has(publicacion.comercioId))
  );
}

export async function getAllPublicationsForAdmin(): Promise<Publicacion[]> {
  const querySnapshot = await getDocs(publicacionesCollectionRef());
  return querySnapshot.docs.map((docItem) => docItem.data() as Publicacion);
}

export async function getPublicationsByCommerce(comercioId: string): Promise<Publicacion[]> {
  const publicacionesQuery = query(
    publicacionesCollectionRef(),
    where('comercioId', '==', comercioId),
    where('activo', '==', true)
  );
  const querySnapshot = await getDocs(publicacionesQuery);
  return sortPublicationsNewestFirst(
    querySnapshot.docs.map((docItem) => docItem.data() as Publicacion).filter(isPublicationPubliclyVisible)
  );
}

export async function getAllComercios(): Promise<Comercio[]> {
  const querySnapshot = await getDocs(activeComerciosQuery());
  return querySnapshot.docs.map((docItem) => docItem.data() as Comercio).filter(isCommercePubliclyVisible);
}

export async function getAllComerciosForAdmin(): Promise<Comercio[]> {
  const querySnapshot = await getDocs(comerciosCollectionRef());
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

export async function trackCommerceMetric(id: string, metric: keyof CommerceMetrics) {
  return updateDoc(comerciosCollection(id), {
    [`metricas.${metric}`]: increment(1)
  }).catch(() => undefined);
}

export async function removeCommerceSubscriptionFields(id: string) {
  return updateDoc(comerciosCollection(id), {
    planNombre: deleteField(),
    suscripcionEstado: deleteField(),
    suscripcionInicio: deleteField(),
    suscripcionVenceEn: deleteField(),
    suscripcionVenceAt: deleteField(),
    montoMensual: deleteField(),
    moneda: deleteField()
  });
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

export async function getActivePlans(): Promise<PlanComercial[]> {
  const querySnapshot = await getDocs(activePlanesQuery());
  const plans = querySnapshot.docs.map((docItem) => docItem.data() as PlanComercial);
  return plans.length > 0 ? sortPlans(plans) : defaultPlans;
}

export async function getAllPlansForAdmin(): Promise<PlanComercial[]> {
  const querySnapshot = await getDocs(planesCollectionRef());
  const plans = querySnapshot.docs.map((docItem) => docItem.data() as PlanComercial);
  return plans.length > 0 ? sortPlans(plans) : defaultPlans;
}

export async function upsertPlan(plan: PlanComercial) {
  return setDoc(planesCollection(plan.id), plan, { merge: true });
}
