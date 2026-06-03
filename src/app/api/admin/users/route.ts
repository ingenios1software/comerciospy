import { NextRequest, NextResponse } from 'next/server';
import { createFirestoreDocument, deleteFirestoreDocument, getFirestoreDocument, updateFirestoreDocument } from '@/lib/firebase/firestore-rest';
import { getSubscriptionVenceAt } from '@/lib/subscription';
import type { Comercio, SubscriptionStatus, UserRole, UsuarioApp } from '@/types';

export const runtime = 'nodejs';

const creatableRoles: UserRole[] = ['admin', 'comercio', 'usuario', 'cliente'];
const subscriptionStatuses: SubscriptionStatus[] = ['trial', 'active', 'past_due', 'expired', 'cancelled'];

type CreateUserBody = {
  email?: string;
  password?: string;
  nombre?: string;
  rol?: UserRole;
  comercio?: Partial<Comercio>;
  suscripcion?: SubscriptionInput;
};

type SubscriptionInput = {
  planNombre?: string;
  estado?: SubscriptionStatus;
  inicio?: string;
  venceEn?: string;
  montoMensual?: number;
  moneda?: string;
};

type UpdateUserBody = {
  id?: string;
  nombre?: string;
  rol?: UserRole;
  comercio?: Partial<Comercio>;
  suscripcion?: SubscriptionInput;
};

type FirebaseSignUpResponse = {
  localId?: string;
  email?: string;
  idToken?: string;
  error?: {
    message?: string;
  };
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildSubscriptionData({
  planNombre,
  suscripcionEstado,
  suscripcionInicio,
  suscripcionVenceEn,
  montoMensual,
  moneda
}: {
  planNombre: string;
  suscripcionEstado: SubscriptionStatus;
  suscripcionInicio: string;
  suscripcionVenceEn: string;
  montoMensual: number;
  moneda: string;
}) {
  return {
    planNombre,
    suscripcionEstado,
    suscripcionInicio,
    suscripcionVenceEn,
    suscripcionVenceAt: getSubscriptionVenceAt(suscripcionVenceEn),
    montoMensual: Number.isFinite(montoMensual) ? montoMensual : 0,
    moneda
  };
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : '';
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split('.');

  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { user_id?: string; sub?: string; email?: string };
  } catch {
    return null;
  }
}

function mapFirebaseAuthError(code?: string) {
  if (code === 'EMAIL_EXISTS') return 'Ya existe un usuario con ese email.';
  if (code === 'OPERATION_NOT_ALLOWED') return 'El inicio con email y contrasena no esta habilitado en Firebase Auth.';
  if (code === 'INVALID_EMAIL') return 'El email no es valido.';
  if (code === 'WEAK_PASSWORD') return 'La contrasena debe tener al menos 6 caracteres.';
  return 'No se pudo crear la cuenta en Firebase Auth.';
}

async function createAuthUser(apiKey: string, email: string, password: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const data = (await response.json()) as FirebaseSignUpResponse;

  if (!response.ok) {
    throw new Error(mapFirebaseAuthError(data.error?.message));
  }

  if (!data.localId || !data.idToken) {
    throw new Error('Firebase Auth no devolvio el ID del usuario creado.');
  }

  return {
    uid: data.localId,
    idToken: data.idToken
  };
}

async function deleteAuthUser(apiKey: string, idToken: string) {
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ idToken })
  }).catch(() => undefined);
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return jsonError('Falta configurar Firebase en el servidor.', 503);
  }

  const adminToken = getBearerToken(request);
  const decodedToken = decodeJwtPayload(adminToken);
  const requesterUid = decodedToken?.user_id ?? decodedToken?.sub;

  if (!adminToken || !requesterUid) {
    return jsonError('Sesion invalida.', 401);
  }

  let requesterProfile: UsuarioApp;

  try {
    requesterProfile = await getFirestoreDocument<UsuarioApp>(projectId, 'users', requesterUid, adminToken);
  } catch {
    return jsonError('No se pudo validar el perfil administrador.', 403);
  }

  if (requesterProfile.rol !== 'superadmin') {
    return jsonError('Solo un superadmin puede crear usuarios desde la app.', 403);
  }

  const body = (await request.json().catch(() => null)) as CreateUserBody | null;
  const email = clean(body?.email).toLowerCase();
  const password = clean(body?.password);
  const nombre = clean(body?.nombre);
  const rol = body?.rol ?? 'comercio';
  const suscripcion = body?.suscripcion ?? {};
  const planNombre = clean(suscripcion.planNombre) || (rol === 'comercio' ? 'Basico' : '');
  const suscripcionInicio = clean(suscripcion.inicio);
  const suscripcionVenceEn = clean(suscripcion.venceEn);
  const suscripcionEstado = subscriptionStatuses.includes(suscripcion.estado ?? 'active')
    ? suscripcion.estado ?? 'active'
    : 'active';
  const montoMensual = Number(suscripcion.montoMensual ?? 0);
  const moneda = clean(suscripcion.moneda) || 'PYG';

  if (!email || !email.includes('@')) {
    return jsonError('Ingresa un email valido.', 400);
  }

  if (password.length < 6) {
    return jsonError('La contrasena debe tener al menos 6 caracteres.', 400);
  }

  if (!nombre) {
    return jsonError('Ingresa el nombre del usuario.', 400);
  }

  if (!creatableRoles.includes(rol)) {
    return jsonError('El rol seleccionado no puede crearse desde este formulario.', 400);
  }

  if (rol === 'comercio' && !suscripcionVenceEn) {
    return jsonError('Ingresa el vencimiento de la suscripcion.', 400);
  }

  const comercio = body?.comercio ?? {};
  const comercioNombre = clean(comercio.nombre) || nombre;
  const rubro = clean(comercio.rubro);
  const categoria = clean(comercio.categoria) || 'Servicios';
  const ciudad = clean(comercio.ciudad);
  const direccion = clean(comercio.direccion);
  const telefono = clean(comercio.telefono);
  const whatsapp = clean(comercio.whatsapp);
  const horario = clean(comercio.horario);
  const descripcion = clean(comercio.descripcion);
  const resumen = clean(comercio.resumen);
  const ubicacionUrl = clean(comercio.ubicacionUrl);
  const activo = typeof comercio.activo === 'boolean' ? comercio.activo : false;

  if (rol === 'comercio' && (!comercioNombre || !rubro || !ciudad || !whatsapp)) {
    return jsonError('Completa nombre del comercio, rubro, ciudad y WhatsApp.', 400);
  }

  const createdAt = new Date().toISOString();
  const subscriptionData = buildSubscriptionData({
    planNombre,
    suscripcionEstado,
    suscripcionInicio: suscripcionInicio || createdAt.slice(0, 10),
    suscripcionVenceEn,
    montoMensual,
    moneda
  });
  let createdAuthUser: Awaited<ReturnType<typeof createAuthUser>>;

  try {
    createdAuthUser = await createAuthUser(apiKey, email, password);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'No se pudo crear la cuenta en Firebase Auth.', 400);
  }

  const uid = createdAuthUser.uid;

  const userProfile: UsuarioApp = {
    id: uid,
    nombre,
    email,
    rol,
    ...(rol === 'comercio' ? { comercioId: uid } : {}),
    ...(rol === 'comercio'
      ? subscriptionData
      : {}),
    activo: true,
    creadoEn: createdAt
  };

  const commerceDocument: Comercio | null =
    rol === 'comercio'
      ? {
          id: uid,
          ownerId: uid,
          nombre: comercioNombre,
          rubro,
          categoria,
          descripcion,
          resumen,
          ciudad,
          direccion,
          telefono,
          whatsapp,
          logoUrl: '',
          portadaUrl: '',
          fotos: [],
          servicios: [],
          horario,
          ...subscriptionData,
          ubicacionUrl,
          ubicacion: {
            lat: 0,
            lng: 0
          },
          activo,
          verificado: false,
          creadoEn: createdAt
        }
      : null;

  try {
    await createFirestoreDocument(projectId, 'users', uid, userProfile as unknown as Record<string, unknown>, adminToken);

    if (commerceDocument) {
      await createFirestoreDocument(projectId, 'comercios', uid, commerceDocument as unknown as Record<string, unknown>, adminToken);
    }
  } catch (error) {
    await Promise.allSettled([
      deleteFirestoreDocument(projectId, 'users', uid, adminToken),
      commerceDocument ? deleteFirestoreDocument(projectId, 'comercios', uid, adminToken) : Promise.resolve(),
      deleteAuthUser(apiKey, createdAuthUser.idToken)
    ]);

    return jsonError(error instanceof Error ? error.message : 'No se pudo guardar el usuario en Firestore.', 500);
  }

  return NextResponse.json({
    user: userProfile,
    comercio: commerceDocument
  });
}

export async function PATCH(request: NextRequest) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    return jsonError('Falta configurar Firebase en el servidor.', 503);
  }

  const adminToken = getBearerToken(request);
  const decodedToken = decodeJwtPayload(adminToken);
  const requesterUid = decodedToken?.user_id ?? decodedToken?.sub;

  if (!adminToken || !requesterUid) {
    return jsonError('Sesion invalida.', 401);
  }

  let requesterProfile: UsuarioApp;

  try {
    requesterProfile = await getFirestoreDocument<UsuarioApp>(projectId, 'users', requesterUid, adminToken);
  } catch {
    return jsonError('No se pudo validar el perfil administrador.', 403);
  }

  if (requesterProfile.rol !== 'superadmin') {
    return jsonError('Solo un superadmin puede actualizar usuarios desde la app.', 403);
  }

  const body = (await request.json().catch(() => null)) as UpdateUserBody | null;
  const id = clean(body?.id);
  const nombre = clean(body?.nombre);
  const rol = body?.rol ?? 'comercio';
  const suscripcion = body?.suscripcion ?? {};
  const planNombre = clean(suscripcion.planNombre) || (rol === 'comercio' ? 'Basico' : '');
  const suscripcionInicio = clean(suscripcion.inicio);
  const suscripcionVenceEn = clean(suscripcion.venceEn);
  const suscripcionEstado = subscriptionStatuses.includes(suscripcion.estado ?? 'active')
    ? suscripcion.estado ?? 'active'
    : 'active';
  const montoMensual = Number(suscripcion.montoMensual ?? 0);
  const moneda = clean(suscripcion.moneda) || 'PYG';

  if (!id) {
    return jsonError('Selecciona un usuario para actualizar.', 400);
  }

  if (!nombre) {
    return jsonError('Ingresa el nombre del usuario.', 400);
  }

  if (!creatableRoles.includes(rol)) {
    return jsonError('El rol seleccionado no puede actualizarse desde este formulario.', 400);
  }

  if (rol === 'comercio' && !suscripcionVenceEn) {
    return jsonError('Ingresa el vencimiento de la suscripcion.', 400);
  }

  const comercio = body?.comercio ?? {};
  const comercioNombre = clean(comercio.nombre) || nombre;
  const rubro = clean(comercio.rubro);
  const categoria = clean(comercio.categoria) || 'Servicios';
  const ciudad = clean(comercio.ciudad);
  const direccion = clean(comercio.direccion);
  const telefono = clean(comercio.telefono);
  const whatsapp = clean(comercio.whatsapp);
  const horario = clean(comercio.horario);
  const descripcion = clean(comercio.descripcion);
  const activo = typeof comercio.activo === 'boolean' ? comercio.activo : false;

  if (rol === 'comercio' && (!comercioNombre || !rubro || !ciudad || !whatsapp)) {
    return jsonError('Completa nombre del comercio, rubro, ciudad y WhatsApp.', 400);
  }

  const userUpdate: Partial<UsuarioApp> = {
    nombre,
    rol,
    ...(rol === 'comercio'
      ? {
          comercioId: id,
          ...buildSubscriptionData({
            planNombre,
            suscripcionEstado,
            suscripcionInicio,
            suscripcionVenceEn,
            montoMensual,
            moneda
          })
        }
      : {})
  };

  const commerceUpdate: Partial<Comercio> | null =
    rol === 'comercio'
      ? {
          id,
          ownerId: id,
          nombre: comercioNombre,
          rubro,
          categoria,
          descripcion,
          ciudad,
          direccion,
          telefono,
          whatsapp,
          horario,
          planNombre,
          suscripcionEstado,
          suscripcionInicio,
          suscripcionVenceEn,
          suscripcionVenceAt: getSubscriptionVenceAt(suscripcionVenceEn),
          montoMensual: Number.isFinite(montoMensual) ? montoMensual : 0,
          moneda,
          activo
        }
      : null;

  try {
    await updateFirestoreDocument(projectId, 'users', id, userUpdate as Record<string, unknown>, adminToken);

    if (commerceUpdate) {
      await updateFirestoreDocument(projectId, 'comercios', id, commerceUpdate as Record<string, unknown>, adminToken);
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'No se pudo actualizar el usuario.', 500);
  }

  return NextResponse.json({
    user: {
      id,
      ...userUpdate
    },
    comercio: commerceUpdate
  });
}
