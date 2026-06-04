"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, PlusCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import { getAllPlansForAdmin, upsertPlan } from '@/lib/firebase/firestore';
import { defaultPlans, formatPlanPrice, sortPlans } from '@/lib/plans';
import type { PlanComercial } from '@/types';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const emptyPlan = (): PlanComercial => ({
  id: '',
  nombre: '',
  descripcion: '',
  precio: 0,
  moneda: 'PYG',
  duracionDias: 30,
  etiqueta: '',
  destacado: false,
  activo: true,
  orden: 1
});

export default function AdminPlanesPage() {
  const { profile, loading } = useAuth();
  const [plans, setPlans] = useState<PlanComercial[]>([]);
  const [formPlan, setFormPlan] = useState<PlanComercial>(emptyPlan);
  const [saving, setSaving] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const canManagePlans = profile?.rol === 'superadmin';
  const sortedPlans = useMemo(() => sortPlans(plans), [plans]);
  const isEditing = Boolean(formPlan.id && plans.some((plan) => plan.id === formPlan.id));

  const loadPlans = async () => {
    if (!canManagePlans) return;
    setPlansLoading(true);
    setError('');

    try {
      const data = await getAllPlansForAdmin();
      setPlans(data);
    } catch {
      setError('No se pudieron cargar los planes.');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManagePlans]);

  const selectPlan = (plan: PlanComercial) => {
    setFormPlan({ ...plan });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setFormPlan(emptyPlan());
    setMessage('');
    setError('');
  };

  const handleSaveDefaults = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const now = new Date().toISOString();
      await Promise.all(defaultPlans.map((plan) => upsertPlan({ ...plan, creadoEn: now, actualizadoEn: now })));
      setMessage('Planes base guardados. Ahora podes editar los precios.');
      await loadPlans();
    } catch {
      setError('No se pudieron guardar los planes base.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const id = formPlan.id || slugify(formPlan.nombre);

    if (!id || !formPlan.nombre.trim()) {
      setError('Ingresa un nombre de plan.');
      setSaving(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      const nextPlan: PlanComercial = {
        ...formPlan,
        id,
        nombre: formPlan.nombre.trim(),
        descripcion: formPlan.descripcion?.trim() ?? '',
        etiqueta: formPlan.etiqueta?.trim() ?? '',
        precio: Number(formPlan.precio || 0),
        duracionDias: Number(formPlan.duracionDias || 30),
        orden: Number(formPlan.orden || 99),
        moneda: formPlan.moneda || 'PYG',
        creadoEn: formPlan.creadoEn ?? now,
        actualizadoEn: now
      };

      await upsertPlan(nextPlan);
      setMessage('Plan guardado correctamente.');
      setFormPlan(nextPlan);
      await loadPlans();
    } catch {
      setError('No se pudo guardar el plan.');
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
        <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Superadmin</p>
                <h1 className="mt-2 text-3xl font-semibold">Planes y precios</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Estos valores se muestran en la pagina publica de planes y llegan por WhatsApp al seleccionar.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>

            {!canManagePlans ? (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">Acceso solo para superadmin</p>
                <p>Tu usuario actual no tiene permisos para editar planes.</p>
              </div>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombre del plan" value={formPlan.nombre} onChange={(value) => setFormPlan((plan) => ({ ...plan, nombre: value }))} required />
                  <Field label="Etiqueta" value={formPlan.etiqueta ?? ''} onChange={(value) => setFormPlan((plan) => ({ ...plan, etiqueta: value }))} placeholder="Plan mensual / Promo 30+7 dias" />
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="Precio Gs." type="number" value={String(formPlan.precio)} onChange={(value) => setFormPlan((plan) => ({ ...plan, precio: Number(value || 0) }))} />
                  <Field label="Duracion dias" type="number" value={String(formPlan.duracionDias)} onChange={(value) => setFormPlan((plan) => ({ ...plan, duracionDias: Number(value || 0) }))} />
                  <Field label="Orden" type="number" value={String(formPlan.orden)} onChange={(value) => setFormPlan((plan) => ({ ...plan, orden: Number(value || 0) }))} />
                  <Field label="Moneda" value={formPlan.moneda} onChange={(value) => setFormPlan((plan) => ({ ...plan, moneda: value }))} />
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Descripcion</span>
                  <textarea
                    rows={3}
                    value={formPlan.descripcion ?? ''}
                    onChange={(event) => setFormPlan((plan) => ({ ...plan, descripcion: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formPlan.activo}
                      onChange={(event) => setFormPlan((plan) => ({ ...plan, activo: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-red-100"
                    />
                    Activo
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formPlan.destacado)}
                      onChange={(event) => setFormPlan((plan) => ({ ...plan, destacado: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-red-100"
                    />
                    Destacado
                  </label>
                </div>

                {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
                {message ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {message}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isEditing ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {saving ? 'Guardando...' : isEditing ? 'Guardar plan' : 'Crear plan'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Nuevo
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDefaults}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Base
                  </button>
                </div>
              </form>
            )}
          </section>

          {canManagePlans ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">Listado de planes</h2>
                  <p className="mt-1 text-sm text-slate-500">Toca editar para cambiar precio, duracion o estado.</p>
                </div>
                <button
                  type="button"
                  onClick={loadPlans}
                  disabled={plansLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualizar
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {sortedPlans.map((plan) => (
                  <article key={plan.id} className={`rounded-2xl border p-4 shadow-soft ${plan.destacado ? 'border-yellow-300 bg-yellow-50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">{plan.etiqueta || `${plan.duracionDias} dias`}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-950">{plan.nombre}</h3>
                        <p className="mt-1 text-sm font-black text-emerald-600">{formatPlanPrice(plan)}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black ${plan.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {plan.activo ? 'Activo' : 'Oculto'}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{plan.descripcion || 'Sin descripcion.'}</p>
                    <button
                      type="button"
                      onClick={() => selectPlan(plan)}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-accent focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}
