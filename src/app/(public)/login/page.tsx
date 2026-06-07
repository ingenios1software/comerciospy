"use client";

import Link from 'next/link';
import { KeyRound, LockKeyhole, LogIn, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getAuthErrorMessage, getPasswordResetErrorMessage, sendUserPasswordReset, signInUser } from '@/lib/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signInUser(email, password);
      router.replace('/');
    } catch (loginError) {
      setError(getAuthErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Ingresa tu email para enviarte la recuperacion.');
      return;
    }

    setResetLoading(true);

    try {
      await sendUserPasswordReset(email);
      setSuccess('Te enviamos un correo para restablecer la contrasena. Revisa tambien spam o promociones.');
    } catch (resetError) {
      setError(getPasswordResetErrorMessage(resetError));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
          <div className="space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-accent">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Acceso privado</p>
            <h1 className="text-3xl font-semibold">Entrar al panel</h1>
            <p className="text-sm leading-6 text-slate-600">Usa la cuenta creada por administracion para editar tu comercio y publicar contenido.</p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                autoCapitalize="none"
                inputMode="email"
                spellCheck={false}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                Contrasena
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="********"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>
            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || resetLoading}
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Entrando...' : 'Iniciar sesion'}
            </button>
            <button
              type="button"
              onClick={handlePasswordReset}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading || resetLoading}
            >
              <KeyRound className="h-4 w-4" />
              {resetLoading ? 'Enviando...' : 'Restablecer contrasena'}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Nuevos comercios</p>
            <h2 className="text-3xl font-semibold leading-tight">Para unirte, primero contactas con administracion.</h2>
            <p className="text-sm leading-6 text-slate-600">Despues del pago se crea tu ficha, se asigna tu usuario y queda listo el panel para que cargues fotos, servicios y publicaciones.</p>
          </div>
          <Link href="/planes" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700">
            <MessageCircle className="h-4 w-4" />
            Ver planes
          </Link>
        </aside>
      </div>
    </main>
  );
}
