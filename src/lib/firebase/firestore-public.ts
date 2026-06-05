import { isCommercePubliclyVisible } from '@/lib/subscription';
import type { Comercio, Publicacion } from '@/types';

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { geoPointValue: { latitude: number; longitude: number } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

type FirestoreRunQueryResult = {
  document?: FirestoreDocument;
};

const publicFirestoreRevalidateSeconds = 300;

function getPublicFirestoreConfig() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !apiKey) return null;

  return { projectId, apiKey };
}

function getFirestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function fromFirestoreValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue.fields ?? {});
  if ('geoPointValue' in value) {
    return {
      lat: value.geoPointValue.latitude,
      lng: value.geoPointValue.longitude
    };
  }

  return null;
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function getDocumentId(name: string) {
  return name.split('/').pop() ?? '';
}

function fromFirestoreDocument<T extends { id?: string }>(document: FirestoreDocument): T {
  const data = fromFirestoreFields(document.fields ?? {}) as T;

  return {
    ...data,
    id: data.id ?? getDocumentId(document.name)
  };
}

async function fetchPublicFirestore<T>(path: string, init?: RequestInit): Promise<T | null> {
  const config = getPublicFirestoreConfig();
  if (!config) return null;

  const separator = path.includes('?') ? '&' : '?';
  let response: Response;

  try {
    response = await fetch(`${getFirestoreBaseUrl(config.projectId)}${path}${separator}key=${config.apiKey}`, {
      ...init,
      next: { revalidate: publicFirestoreRevalidateSeconds }
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  return (await response.json()) as T;
}

async function runPublicQuery<T extends { id?: string }>(structuredQuery: Record<string, unknown>) {
  const result = await fetchPublicFirestore<FirestoreRunQueryResult[]>(':runQuery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery })
  });

  return (result ?? [])
    .map((item) => item.document)
    .filter((document): document is FirestoreDocument => Boolean(document))
    .map((document) => fromFirestoreDocument<T>(document));
}

export async function getPublicComercioById(id: string): Promise<Comercio | null> {
  const document = await fetchPublicFirestore<FirestoreDocument>(`/comercios/${encodeURIComponent(id)}`);
  if (!document) return null;

  const comercio = fromFirestoreDocument<Comercio>(document);
  return isCommercePubliclyVisible(comercio) ? comercio : null;
}

export async function getPublicComerciosForSeo(): Promise<Comercio[]> {
  const comercios = await runPublicQuery<Comercio>({
    from: [{ collectionId: 'comercios' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'activo' },
        op: 'EQUAL',
        value: { booleanValue: true }
      }
    }
  });

  return comercios
    .filter(isCommercePubliclyVisible)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function getPublicPublicationsByCommerce(comercioId: string): Promise<Publicacion[]> {
  const publicaciones = await runPublicQuery<Publicacion>({
    from: [{ collectionId: 'publicaciones' }],
    where: {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: 'comercioId' },
              op: 'EQUAL',
              value: { stringValue: comercioId }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: 'activo' },
              op: 'EQUAL',
              value: { booleanValue: true }
            }
          }
        ]
      }
    }
  });

  return publicaciones
    .filter((publicacion) => publicacion.moderacionEstado !== 'pending' && publicacion.moderacionEstado !== 'rejected')
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
}
