"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Ban, CalendarClock, CheckCircle2, CreditCard, Pencil, RefreshCw, Search, ShieldCheck, UserPlus, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import { categories } from '@/lib/categories';
import { getAllComerciosForAdmin, getAllPlansForAdmin, getAllUsers, removeCommerceSubscriptionFields, updateCommerce, updateUserProfile } from '@/lib/firebase/firestore';
import { defaultPlans } from '@/lib/plans';
import { daysUntilSubscription, getSubscriptionVenceAt, isSubscriptionExpired, isSubscriptionExpiringSoon } from '@/lib/subscription';
import type { Comercio, CommerceVisibilityStatus, PaymentStatus, SubscriptionStatus, UserRole, UsuarioApp } from '@/types';

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'comercio', label: 'Comercio' },
  { value: 'admin', label: 'Admin' },
  { value: 'usuario', label: 'Usuario' },
  { value: 'cliente', label: 'Cliente' }
];

const subscriptionStatusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: 'active', label: 'Activa' },
  { value: 'trial', label: 'Prueba' },
  { value: 'past_due', label: 'Pago pendiente' },
  { value: 'expired', label: 'Vencida' },
  { value: 'cancelled', label: 'Cancelada' }
];

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'overdue', label: 'Atrasado' },
  { value: 'cancelled', label: 'Cancelado' }
];

const paymentMethodOptions = [
  { value: '', label: 'Sin definir' },
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Giro', label: 'Giro' },
  { value: 'Tarjeta', label: 'Tarjeta' }
];

const visibilityStatusOptions: Array<{ value: CommerceVisibilityStatus; label: string }> = [
  { value: 'publicado', label: 'Publicado' },
  { value: 'oculto', label: 'Oculto' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'suspendido', label: 'Suspendido' }
];

const fallbackPlanOptions = [
  { value: 'Basico', label: 'Basico' },
  { value: 'Pro', label: 'Pro' },
  { value: 'Premium', label: 'Premium' }
];

type CreatedUserResponse = {
  user: UsuarioApp;
};

function dateInputAfterMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return 'Sin fecha';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusLabel(status?: SubscriptionStatus) {
  return subscriptionStatusOptions.find((option) => option.value === status)?.label ?? 'Sin estado';
}

function formatAmount(value?: number, currency = 'PYG') {
  if (!value) return 'Sin monto';
  return `${new Intl.NumberFormat('es-PY').format(value)} ${currency}`;
}

function addDaysToDate(value: string | undefined, days: number) {
  const base = value ? new Date(`${value}T00:00:00`) : new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = Number.isNaN(base.getTime()) || base < today ? today : base;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getCommerceVisibilityStatus(comercio?: Comercio | null): CommerceVisibilityStatus {
  if (comercio?.visibilidadEstado) return comercio.visibilidadEstado;
  return comercio?.activo ? 'publicado' : 'pendiente';
}

function getCommercialFilterStatus(user: UsuarioApp, comercio?: Comercio | null) {
  if (isSubscriptionExpired(user) || user.suscripcionEstado === 'expired' || user.suscripcionEstado === 'cancelled') return 'vencido';
  if (user.suscripcionEstado === 'past_due' || getCommerceVisibilityStatus(comercio) === 'pendiente') return 'pendiente';
  return 'activo';
}

const commerceSubscriptionKeys = [
  'planNombre',
  'suscripcionEstado',
  'suscripcionInicio',
  'suscripcionVenceEn',
  'suscripcionVenceAt',
  'montoMensual',
  'moneda'
] as const;

function hasCommerceSubscriptionFields(comercio: Comercio) {
  return commerceSubscriptionKeys.some((key) => comercio[key] !== undefined);
}

function stripCommerceSubscriptionFields(comercio: Comercio): Comercio {
  return Object.fromEntries(Object.entries(comercio).filter(([key]) => !commerceSubscriptionKeys.includes(key as (typeof commerceSubscriptionKeys)[number]))) as Comercio;
}

async function cleanupCommerceSubscriptionFields(comercios: Comercio[]) {
  const updates = comercios.filter(hasCommerceSubscriptionFields).map((comercio) => removeCommerceSubscriptionFields(comercio.id));

  if (updates.length > 0) {
    await Promise.allSettled(updates);
  }

  return comercios.map(stripCommerceSubscriptionFields);
}

export default function AdminUsuariosPage() {
  const { user, profile, loading } = useAuth();
  const categoryOptions = useMemo(() => categories.filter((category) => category.id !== 'Todos'), []);
  const defaultPlanOptions = useMemo(() => defaultPlans.map((plan) => ({ value: plan.nombre, label: plan.nombre })), []);
  const [planOptions, setPlanOptions] = useState(defaultPlanOptions.length > 0 ? defaultPlanOptions : fallbackPlanOptions);
  const [rol, setRol] = useState<UserRole>('comercio');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [comercioNombre, setComercioNombre] = useState('');
  const [rubro, setRubro] = useState('');
  const [categoria, setCategoria] = useState(categoryOptions[0]?.label ?? 'Servicios');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [publicarComercio, setPublicarComercio] = useState(true);
  const [planNombre, setPlanNombre] = useState('Basico');
  const [suscripcionEstado, setSuscripcionEstado] = useState<SubscriptionStatus>('active');
  const [suscripcionInicio, setSuscripcionInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [suscripcionVenceEn, setSuscripcionVenceEn] = useState(() => dateInputAfterMonths(1));
  const [montoMensual, setMontoMensual] = useState('');
  const [estadoPago, setEstadoPago] = useState<PaymentStatus>('pending');
  const [metodoPago, setMetodoPago] = useState('');
  const [observacionCobranza, setObservacionCobranza] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState('');
  const [visibilidadEstado, setVisibilidadEstado] = useState<CommerceVisibilityStatus>('publicado');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUserResponse | null>(null);
  const [users, setUsers] = useState<UsuarioApp[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [planFilter, setPlanFilter] = useState('todos');
  const [cityFilter, setCityFilter] = useState('todos');
  const [searchFilter, setSearchFilter] = useState('');

  const canCreateUsers = profile?.rol === 'superadmin';
  const isEditing = Boolean(editingUserId);
  const comerciosById = useMemo(() => new Map(comercios.map((comercio) => [comercio.id, comercio])), [comercios]);
  const commerceUsers = useMemo(
    () =>
      users
        .filter((item) => item.rol === 'comercio')
        .sort((a, b) => (a.suscripcionVenceEn ?? '9999-12-31').localeCompare(b.suscripcionVenceEn ?? '9999-12-31')),
    [users]
  );
  const cityOptions = useMemo(() => {
    return Array.from(new Set(comercios.map((comercio) => comercio.ciudad).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
  }, [comercios]);
  const filteredCommerceUsers = useMemo(() => {
    const search = searchFilter.trim().toLowerCase();

    return commerceUsers.filter((item) => {
      const comercio = comerciosById.get(item.comercioId ?? '');
      const filterStatus = getCommercialFilterStatus(item, comercio);
      const matchesStatus = statusFilter === 'todos' || filterStatus === statusFilter;
      const matchesPlan = planFilter === 'todos' || item.planNombre === planFilter;
      const matchesCity = cityFilter === 'todos' || comercio?.ciudad === cityFilter;
      const searchable = [item.nombre, item.email, comercio?.nombre, comercio?.ciudad].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !search || searchable.includes(search);

      return matchesStatus && matchesPlan && matchesCity && matchesSearch;
    });
  }, [cityFilter, commerceUsers, comerciosById, planFilter, searchFilter, statusFilter]);
  const expiredCount = commerceUsers.filter(isSubscriptionExpired).length;
  const expiringSoonCount = commerceUsers.filter((item) => !isSubscriptionExpired(item) && isSubscriptionExpiringSoon(item)).length;

  const loadUsers = async () => {
    if (!canCreateUsers) return;
    setUsersLoading(true);
    setUsersError(null);

    try {
      const [usersData, comerciosData, plansData] = await Promise.all([getAllUsers(), getAllComerciosForAdmin(), getAllPlansForAdmin()]);
      const cleanComercios = await cleanupCommerceSubscriptionFields(comerciosData);
      setUsers(usersData);
      setComercios(cleanComercios);
      setPlanOptions(plansData.map((plan) => ({ value: plan.nombre, label: plan.nombre })));
    } catch {
      setUsersError('No se pudo cargar el listado de usuarios.');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateUsers]);

  const resetForm = () => {
    setEditingUserId(null);
    setRol('comercio');
    setNombre('');
    setEmail('');
    setPassword('');
    setComercioNombre('');
    setRubro('');
    setCategoria(categoryOptions[0]?.label ?? 'Servicios');
    setCiudad('');
    setDireccion('');
    setTelefono('');
    setWhatsapp('');
    setHorario('');
    setDescripcion('');
    setPublicarComercio(true);
    setPlanNombre('Basico');
    setSuscripcionEstado('active');
    setSuscripcionInicio(new Date().toISOString().slice(0, 10));
    setSuscripcionVenceEn(dateInputAfterMonths(1));
    setMontoMensual('');
    setEstadoPago('pending');
    setMetodoPago('');
    setObservacionCobranza('');
    setComprobanteUrl('');
    setVisibilidadEstado('publicado');
    setError(null);
    setCreatedUser(null);
  };

  const handleEditUser = (selectedUser: UsuarioApp) => {
    const comercio = comerciosById.get(selectedUser.comercioId ?? selectedUser.id);

    setEditingUserId(selectedUser.id);
    setRol(selectedUser.rol);
    setNombre(selectedUser.nombre);
    setEmail(selectedUser.email);
    setPassword('');
    setComercioNombre(comercio?.nombre ?? selectedUser.nombre);
    setRubro(comercio?.rubro ?? '');
    setCategoria(comercio?.categoria ?? categoryOptions[0]?.label ?? 'Servicios');
    setCiudad(comercio?.ciudad ?? '');
    setDireccion(comercio?.direccion ?? '');
    setTelefono(comercio?.telefono ?? '');
    setWhatsapp(comercio?.whatsapp ?? '');
    setHorario(comercio?.horario ?? '');
    setDescripcion(comercio?.descripcion ?? '');
    setPublicarComercio(Boolean(comercio?.activo));
    setPlanNombre(selectedUser.planNombre ?? 'Basico');
    setSuscripcionEstado(selectedUser.suscripcionEstado ?? 'active');
    setSuscripcionInicio(selectedUser.suscripcionInicio ?? new Date().toISOString().slice(0, 10));
    setSuscripcionVenceEn(selectedUser.suscripcionVenceEn ?? dateInputAfterMonths(1));
    setMontoMensual(selectedUser.montoMensual ? String(selectedUser.montoMensual) : '');
    setEstadoPago(selectedUser.estadoPago ?? 'pending');
    setMetodoPago(selectedUser.metodoPago ?? '');
    setObservacionCobranza(selectedUser.observacionCobranza ?? '');
    setComprobanteUrl(selectedUser.comprobanteUrl ?? '');
    setVisibilidadEstado(getCommerceVisibilityStatus(comercio));
    setError(null);
    setCreatedUser(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setCreatedUser(null);
    setSaving(true);

    if (!user) {
      setError('Tu sesion ya no esta activa.');
      setSaving(false);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/admin/users', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: editingUserId,
          nombre,
          email,
          password: isEditing ? undefined : password,
          rol,
          suscripcion:
            rol === 'comercio'
              ? {
                  planNombre,
                  estado: suscripcionEstado,
                  inicio: suscripcionInicio,
                  venceEn: suscripcionVenceEn,
                  montoMensual: Number(montoMensual || 0),
                  moneda: 'PYG',
                  estadoPago,
                  metodoPago,
                  observacion: observacionCobranza,
                  comprobanteUrl
                }
              : undefined,
          comercio:
            rol === 'comercio'
              ? {
                  nombre: comercioNombre,
                  rubro,
                  categoria,
                  ciudad,
                  direccion,
                  telefono,
                  whatsapp,
                  horario,
                  descripcion,
                  activo: visibilidadEstado === 'publicado' && publicarComercio,
                  visibilidadEstado
                }
              : undefined
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? 'No se pudo crear el usuario.');
      }

      setCreatedUser(data as CreatedUserResponse);
      await loadUsers();
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (selectedUser: UsuarioApp) => {
    setUsersError(null);
    try {
      await updateUserProfile(selectedUser.id, {
        suscripcionEstado: 'active',
        estadoPago: 'paid',
        pagoActualizadoEn: new Date().toISOString()
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === selectedUser.id
            ? {
                ...item,
                suscripcionEstado: 'active',
                estadoPago: 'paid',
                pagoActualizadoEn: new Date().toISOString()
              }
            : item
        )
      );
    } catch {
      setUsersError('No se pudo marcar como pagado.');
    }
  };

  const handleRenew30Days = async (selectedUser: UsuarioApp) => {
    const nextDueDate = addDaysToDate(selectedUser.suscripcionVenceEn, 30);
    setUsersError(null);

    try {
      await updateUserProfile(selectedUser.id, {
        suscripcionEstado: 'active',
        suscripcionVenceEn: nextDueDate,
        suscripcionVenceAt: getSubscriptionVenceAt(nextDueDate),
        estadoPago: 'paid',
        pagoActualizadoEn: new Date().toISOString()
      });
      setUsers((current) =>
        current.map((item) =>
          item.id === selectedUser.id
            ? {
                ...item,
                suscripcionEstado: 'active',
                suscripcionVenceEn: nextDueDate,
                suscripcionVenceAt: getSubscriptionVenceAt(nextDueDate),
                estadoPago: 'paid',
                pagoActualizadoEn: new Date().toISOString()
              }
            : item
        )
      );
    } catch {
      setUsersError('No se pudo renovar el plan.');
    }
  };

  const handleCommerceVisibility = async (selectedUser: UsuarioApp, nextVisibility: CommerceVisibilityStatus) => {
    const comercioId = selectedUser.comercioId ?? selectedUser.id;
    setUsersError(null);

    try {
      await updateCommerce(comercioId, {
        visibilidadEstado: nextVisibility,
        activo: nextVisibility === 'publicado',
        verificado: nextVisibility === 'publicado' ? true : comerciosById.get(comercioId)?.verificado
      });
      setComercios((current) =>
        current.map((comercio) =>
          comercio.id === comercioId
            ? {
                ...comercio,
                visibilidadEstado: nextVisibility,
                activo: nextVisibility === 'publicado',
                verificado: nextVisibility === 'publicado' ? true : comercio.verificado
              }
            : comercio
        )
      );
    } catch {
      setUsersError('No se pudo cambiar la visibilidad del comercio.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando administracion...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface text-slate-950">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar />
        <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Administracion</p>
                <h1 className="mt-2 text-3xl font-semibold">{isEditing ? 'Editar usuario' : 'Crear usuario'}</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isEditing ? 'Actualiza datos comerciales, plan y vencimiento sin crear otra cuenta.' : 'Alta directa para cuentas internas y comercios.'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            {!canCreateUsers ? (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Acceso solo para superadmin</p>
                <p>Tu usuario actual no tiene permisos para crear cuentas desde la app.</p>
              </div>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                {isEditing ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                    <span>Editando usuario existente. La contrasena no se cambia desde este formulario.</span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-amber-900 ring-1 ring-amber-200"
                    >
                      <X className="h-4 w-4" />
                      Cancelar edicion
                    </button>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="nombre" label="Nombre del usuario" value={nombre} onChange={setNombre} required />
                  <SelectField
                    id="rol"
                    label="Rol"
                    value={rol}
                    onChange={(value) => setRol(value as UserRole)}
                    options={roleOptions}
                    disabled={isEditing}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="email" label="Email" value={email} onChange={setEmail} type="email" required disabled={isEditing} />
                  <Field
                    id="password"
                    label={isEditing ? 'Contrasena' : 'Contrasena temporal'}
                    value={password}
                    onChange={setPassword}
                    type="password"
                    placeholder={isEditing ? 'No se modifica al editar' : undefined}
                    required={!isEditing}
                    disabled={isEditing}
                  />
                </div>

                {rol === 'comercio' ? (
                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-accent" />
                      <h2 className="text-base font-semibold text-slate-950">Ficha inicial del comercio</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="comercioNombre" label="Nombre del comercio" value={comercioNombre} onChange={setComercioNombre} required />
                      <Field id="rubro" label="Rubro" value={rubro} onChange={setRubro} required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField id="categoria" label="Categoria" value={categoria} onChange={setCategoria} options={categoryOptions.map((category) => ({ value: category.label, label: category.label }))} />
                      <Field id="ciudad" label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ej: Asuncion, Pilar, San Ignacio, Saltos del Guaira" required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="whatsapp" label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+595981000000" required />
                      <Field id="telefono" label="Telefono" value={telefono} onChange={setTelefono} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="direccion" label="Direccion" value={direccion} onChange={setDireccion} />
                      <Field id="horario" label="Horario" value={horario} onChange={setHorario} placeholder="Lun a sab, 08:00 - 18:00" />
                    </div>

                    <div>
                      <label htmlFor="descripcion" className="mb-2 block text-sm font-semibold text-slate-700">
                        Descripcion
                      </label>
                      <textarea
                        id="descripcion"
                        rows={4}
                        value={descripcion}
                        onChange={(event) => setDescripcion(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                      <SelectField id="planNombre" label="Plan" value={planNombre} onChange={setPlanNombre} options={planOptions} />
                      <SelectField
                        id="suscripcionEstado"
                        label="Estado de suscripcion"
                        value={suscripcionEstado}
                        onChange={(value) => setSuscripcionEstado(value as SubscriptionStatus)}
                        options={subscriptionStatusOptions}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field id="suscripcionInicio" label="Inicio" value={suscripcionInicio} onChange={setSuscripcionInicio} type="date" required />
                      <Field id="suscripcionVenceEn" label="Vencimiento" value={suscripcionVenceEn} onChange={setSuscripcionVenceEn} type="date" required />
                      <Field id="montoMensual" label="Monto mensual Gs." value={montoMensual} onChange={setMontoMensual} type="number" placeholder="150000" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <SelectField
                        id="estadoPago"
                        label="Estado de pago"
                        value={estadoPago}
                        onChange={(value) => setEstadoPago(value as PaymentStatus)}
                        options={paymentStatusOptions}
                      />
                      <SelectField id="metodoPago" label="Metodo de pago" value={metodoPago} onChange={setMetodoPago} options={paymentMethodOptions} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="comprobanteUrl" label="Comprobante opcional" value={comprobanteUrl} onChange={setComprobanteUrl} placeholder="URL del comprobante" />
                      <SelectField
                        id="visibilidadEstado"
                        label="Visibilidad publica"
                        value={visibilidadEstado}
                        onChange={(value) => {
                          const nextVisibility = value as CommerceVisibilityStatus;
                          setVisibilidadEstado(nextVisibility);
                          setPublicarComercio(nextVisibility === 'publicado');
                        }}
                        options={visibilityStatusOptions}
                      />
                    </div>

                    <div>
                      <label htmlFor="observacionCobranza" className="mb-2 block text-sm font-semibold text-slate-700">
                        Observacion de cobranza
                      </label>
                      <textarea
                        id="observacionCobranza"
                        rows={3}
                        value={observacionCobranza}
                        onChange={(event) => setObservacionCobranza(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                ) : null}

                {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
                {createdUser ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">{isEditing ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.'}</p>
                      <p>
                        {isEditing
                          ? `${createdUser.user.nombre} ya tiene sus datos actualizados.`
                          : `${createdUser.user.email} ya puede iniciar sesion con la contrasena temporal.`}
                      </p>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isEditing ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {saving ? (isEditing ? 'Guardando...' : 'Creando...') : isEditing ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </form>
            )}
          </section>

          {canCreateUsers ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">SaaS</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Usuarios y suscripciones</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Control de clientes, planes y vencimientos.</p>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={usersLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric label="Clientes comercio" value={commerceUsers.length.toString()} />
                <Metric label="Vencen en 7 dias" value={expiringSoonCount.toString()} />
                <Metric label="Vencidos" value={expiredCount.toString()} danger={expiredCount > 0} />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                  <div>
                    <label htmlFor="buscarUsuarios" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Buscar
                    </label>
                    <div className="flex rounded-2xl border border-slate-200 bg-white">
                      <span className="flex w-10 items-center justify-center text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        id="buscarUsuarios"
                        value={searchFilter}
                        onChange={(event) => setSearchFilter(event.target.value)}
                        placeholder="Nombre, comercio o email"
                        className="min-w-0 flex-1 rounded-2xl bg-transparent px-2 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <SelectField
                    id="filtroEstado"
                    label="Estado"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: 'todos', label: 'Todos' },
                      { value: 'activo', label: 'Activo' },
                      { value: 'pendiente', label: 'Pendiente' },
                      { value: 'vencido', label: 'Vencido' }
                    ]}
                  />
                  <SelectField
                    id="filtroPlan"
                    label="Plan"
                    value={planFilter}
                    onChange={setPlanFilter}
                    options={[{ value: 'todos', label: 'Todos' }, ...planOptions]}
                  />
                  <SelectField
                    id="filtroCiudad"
                    label="Ciudad"
                    value={cityFilter}
                    onChange={setCityFilter}
                    options={[{ value: 'todos', label: 'Todas' }, ...cityOptions.map((city) => ({ value: city, label: city }))]}
                  />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Mostrando {filteredCommerceUsers.length} de {commerceUsers.length}. Ordenado por vencimiento mas proximo.
                </p>
              </div>

              {usersError ? <p className="mt-5 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{usersError}</p> : null}

              <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Vencimiento</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Guia</th>
                      <th className="px-4 py-3">Accion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : filteredCommerceUsers.length > 0 ? (
                      filteredCommerceUsers.map((item) => {
                        const comercio = comerciosById.get(item.comercioId ?? '');
                        const remainingDays = daysUntilSubscription(item.suscripcionVenceEn);
                        const isExpired = isSubscriptionExpired(item);
                        const isExpiringSoon = !isExpired && isSubscriptionExpiringSoon(item);
                        const statusLabel = item.suscripcionEstado === 'cancelled' ? 'Cancelada' : isExpired ? 'Vencida' : getStatusLabel(item.suscripcionEstado);
                        const guideStatus = isExpired ? 'Pausado' : getCommerceVisibilityStatus(comercio);
                        const rowTone = isExpired ? 'border-l-rose-500' : isExpiringSoon ? 'border-l-amber-400' : 'border-l-emerald-500';

                        return (
                          <tr key={item.id} className={`align-top border-l-4 ${rowTone}`}>
                            <td className="px-4 py-4">
                              <p className="font-semibold text-slate-950">{comercio?.nombre ?? item.nombre}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.email}</p>
                            </td>
                            <td className="px-4 py-4 text-slate-700">{item.planNombre ?? 'Sin plan'}</td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isExpired
                                    ? 'bg-rose-50 text-rose-700'
                                    : isExpiringSoon
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-slate-700">
                                <CalendarClock className="h-4 w-4 text-slate-400" />
                                <span>{formatDate(item.suscripcionVenceEn)}</span>
                              </div>
                              {remainingDays !== null ? (
                                <p className={`mt-1 text-xs ${isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-500'}`}>
                                  {isExpired ? `Vencio hace ${Math.abs(remainingDays)} dias` : `Faltan ${remainingDays} dias`}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              <p>{formatAmount(item.montoMensual, item.moneda)}</p>
                              <p className="mt-1 text-xs text-slate-500">{paymentStatusOptions.find((option) => option.value === item.estadoPago)?.label ?? 'Pago pendiente'}</p>
                              {item.metodoPago ? <p className="mt-1 text-xs text-slate-500">{item.metodoPago}</p> : null}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                  isExpired
                                    ? 'bg-rose-50 text-rose-700'
                                    : getCommerceVisibilityStatus(comercio) === 'publicado'
                                      ? 'bg-slate-950 text-white'
                                      : getCommerceVisibilityStatus(comercio) === 'suspendido'
                                        ? 'bg-rose-50 text-rose-700'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {guideStatus}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex min-w-[220px] flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(item)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(item)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  Pagado
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRenew30Days(item)}
                                  className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                >
                                  +30 dias
                                </button>
                                {getCommerceVisibilityStatus(comercio) === 'publicado' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleCommerceVisibility(item, 'suspendido')}
                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    Suspender
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCommerceVisibility(item, 'publicado')}
                                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                                  >
                                    Activar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                          Todavia no hay clientes comercio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoCapitalize={type === 'email' ? 'none' : undefined}
        inputMode={type === 'email' ? 'email' : undefined}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
        required={required}
        disabled={disabled}
      />
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${danger ? 'border-rose-100 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${danger ? 'text-rose-600' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${danger ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
