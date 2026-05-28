"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import { categories } from '@/lib/categories';
import { getAllComerciosForAdmin, getAllUsers } from '@/lib/firebase/firestore';
import type { Comercio, SubscriptionStatus, UserRole, UsuarioApp } from '@/types';

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

const planOptions = [
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

function daysUntil(value?: string) {
  if (!value) return null;
  const today = new Date();
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function getStatusLabel(status?: SubscriptionStatus) {
  return subscriptionStatusOptions.find((option) => option.value === status)?.label ?? 'Sin estado';
}

function formatAmount(value?: number, currency = 'PYG') {
  if (!value) return 'Sin monto';
  return `${new Intl.NumberFormat('es-PY').format(value)} ${currency}`;
}

export default function AdminUsuariosPage() {
  const { user, profile, loading } = useAuth();
  const categoryOptions = useMemo(() => categories.filter((category) => category.id !== 'Todos'), []);
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUserResponse | null>(null);
  const [users, setUsers] = useState<UsuarioApp[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const canCreateUsers = profile?.rol === 'superadmin';
  const comerciosById = useMemo(() => new Map(comercios.map((comercio) => [comercio.id, comercio])), [comercios]);
  const commerceUsers = useMemo(
    () =>
      users
        .filter((item) => item.rol === 'comercio')
        .sort((a, b) => (a.suscripcionVenceEn ?? '9999-12-31').localeCompare(b.suscripcionVenceEn ?? '9999-12-31')),
    [users]
  );
  const expiredCount = commerceUsers.filter((item) => {
    const remainingDays = daysUntil(item.suscripcionVenceEn);
    return remainingDays !== null && remainingDays < 0;
  }).length;
  const expiringSoonCount = commerceUsers.filter((item) => {
    const remainingDays = daysUntil(item.suscripcionVenceEn);
    return remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;
  }).length;

  const loadUsers = async () => {
    if (!canCreateUsers) return;
    setUsersLoading(true);
    setUsersError(null);

    try {
      const [usersData, comerciosData] = await Promise.all([getAllUsers(), getAllComerciosForAdmin()]);
      setUsers(usersData);
      setComercios(comerciosData);
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
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          rol,
          suscripcion:
            rol === 'comercio'
              ? {
                  planNombre,
                  estado: suscripcionEstado,
                  inicio: suscripcionInicio,
                  venceEn: suscripcionVenceEn,
                  montoMensual: Number(montoMensual || 0),
                  moneda: 'PYG'
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
                  activo: publicarComercio
                }
              : undefined
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? 'No se pudo crear el usuario.');
      }

      setCreatedUser(data as CreatedUserResponse);
      setPassword('');
      await loadUsers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo crear el usuario.');
    } finally {
      setSaving(false);
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
                <h1 className="mt-2 text-3xl font-semibold">Crear usuario</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Alta directa para cuentas internas y comercios.</p>
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="nombre" label="Nombre del usuario" value={nombre} onChange={setNombre} required />
                  <SelectField
                    id="rol"
                    label="Rol"
                    value={rol}
                    onChange={(value) => setRol(value as UserRole)}
                    options={roleOptions}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="email" label="Email" value={email} onChange={setEmail} type="email" required />
                  <Field id="password" label="Contrasena temporal" value={password} onChange={setPassword} type="password" required />
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

                    <label htmlFor="publicarComercio" className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                      <input
                        id="publicarComercio"
                        type="checkbox"
                        checked={publicarComercio}
                        onChange={(event) => setPublicarComercio(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-red-100"
                      />
                      Publicar en guia al crear
                    </label>
                  </div>
                ) : null}

                {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
                {createdUser ? (
                  <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Usuario creado correctamente.</p>
                      <p>{createdUser.user.email} ya puede iniciar sesion con la contrasena temporal.</p>
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <UserPlus className="h-4 w-4" />
                  {saving ? 'Creando...' : 'Crear usuario'}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : commerceUsers.length > 0 ? (
                      commerceUsers.map((item) => {
                        const comercio = comerciosById.get(item.comercioId ?? '');
                        const remainingDays = daysUntil(item.suscripcionVenceEn);
                        const isExpired = remainingDays !== null && remainingDays < 0;
                        const isExpiringSoon = remainingDays !== null && remainingDays >= 0 && remainingDays <= 7;
                        const statusLabel = isExpired ? 'Vencida' : getStatusLabel(item.suscripcionEstado);

                        return (
                          <tr key={item.id} className="align-top">
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
                            <td className="px-4 py-4 text-slate-700">{formatAmount(item.montoMensual, item.moneda)}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${comercio?.activo ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {comercio?.activo ? 'Publicado' : 'Pendiente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
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
  required
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
  options
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
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
