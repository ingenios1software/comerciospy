"use client";

import { sampleComercios } from '@/lib/mockData';
import { useAuth } from '@/lib/firebase/auth-context';

const comercio = sampleComercios[0];

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-center py-24 text-slate-400">Cargando perfil...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Perfil</p>
            <h1 className="text-3xl font-semibold">Tu cuenta</h1>
            <p className="text-sm text-slate-400">Verifica tu información y administra tu comercio en un panel diseñado para móvil.</p>
          </div>
          <div className="mt-5 space-y-4 rounded-3xl bg-slate-950/90 p-4">
            <div className="space-y-2 rounded-3xl bg-slate-900/90 p-4">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Información del usuario</p>
              <p className="text-lg font-semibold text-slate-100">{profile?.nombre ?? user?.email ?? 'Comercio'}</p>
              <p className="text-sm text-slate-300">{profile?.email ?? user?.email}</p>
              <p className="text-sm text-slate-400">Rol: {profile?.rol ?? 'Cliente'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-400">
                <p className="text-slate-100">Estado</p>
                <p className="mt-3 text-base text-slate-100">{profile?.activo ? 'Activo' : 'Pendiente'}</p>
              </div>
              <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-400">
                <p className="text-slate-100">Comercio</p>
                <p className="mt-3 text-base text-slate-100">{profile?.comercioId ?? 'Sin comercio asignado'}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950/90 p-4 text-sm text-slate-300">
              <p className="text-slate-200">Consejo</p>
              <p className="mt-2">Actualiza tu comercio y publica ofertas para mejorar tu visibilidad.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Actividad</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950/90 p-4 text-sm">
              <p className="font-semibold text-slate-100">12</p>
              <p className="text-slate-400">Publicaciones activas</p>
            </div>
            <div className="rounded-3xl bg-slate-950/90 p-4 text-sm">
              <p className="font-semibold text-slate-100">8</p>
              <p className="text-slate-400">Consultas recibidas</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
