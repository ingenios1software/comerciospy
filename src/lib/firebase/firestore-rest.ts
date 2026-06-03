type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? { arrayValue: { values: value.map(toFirestoreValue) } } : { arrayValue: {} };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (typeof value === 'object') {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)])
        )
      }
    };
  }

  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  return { stringValue: String(value) };
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
  return null;
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function getFirestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function parseFirestoreError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error?.message ?? `Firestore request failed with status ${response.status}`;
}

export async function getFirestoreDocument<T>(projectId: string, collection: string, id: string, idToken: string) {
  const response = await fetch(`${getFirestoreBaseUrl(projectId)}/${collection}/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    throw new Error(await parseFirestoreError(response));
  }

  const document = (await response.json()) as FirestoreDocument;
  return fromFirestoreFields(document.fields ?? {}) as T;
}

export async function createFirestoreDocument(
  projectId: string,
  collection: string,
  id: string,
  data: Record<string, unknown>,
  idToken: string
) {
  const response = await fetch(`${getFirestoreBaseUrl(projectId)}/${collection}?documentId=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]))
    })
  });

  if (!response.ok) {
    throw new Error(await parseFirestoreError(response));
  }
}

export async function updateFirestoreDocument(
  projectId: string,
  collection: string,
  id: string,
  data: Record<string, unknown>,
  idToken: string
) {
  const params = new URLSearchParams();
  Object.keys(data).forEach((key) => params.append('updateMask.fieldPaths', key));

  const response = await fetch(`${getFirestoreBaseUrl(projectId)}/${collection}/${encodeURIComponent(id)}?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)]))
    })
  });

  if (!response.ok) {
    throw new Error(await parseFirestoreError(response));
  }
}

export async function deleteFirestoreDocument(projectId: string, collection: string, id: string, idToken: string) {
  const response = await fetch(`${getFirestoreBaseUrl(projectId)}/${collection}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(await parseFirestoreError(response));
  }
}
