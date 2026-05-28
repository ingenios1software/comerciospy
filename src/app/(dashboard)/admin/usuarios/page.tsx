"use client";

import { FormEvent, useMemo, useState } from 'react';
import { CheckCircle2, ShieldCheck, UserPlus } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import { categories } from '@/lib/categories';
import type { UserRole, UsuarioApp } from '@/types';

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'comercio', label: 'Comercio' },
  { value: 'admin', label: 'Admin' },
  { value: 'usuario', label: 'Usuario' },
  { value: 'cliente', label: 'Cliente' }
];

type CreatedUserResponse = {
  user: UsuarioApp;
};

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<CreatedUserResponse | null>(null);

  const canCreateUsers = profile?.rol === 'superadmin';

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
        <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
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
