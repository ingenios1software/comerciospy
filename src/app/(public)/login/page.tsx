"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { signInUser } from '@/lib/firebase/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInUser(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('No se pudo iniciar sesión. Revisa tus datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-md space-y-6 rounded-[2rem] bg-slate-900/95 p-6 shadow-soft ring-1 ring-white/10">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Acceso</p>
          <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-slate-400">Accede a tu cuenta para administrar tu comercio y publicaciones.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ejemplo@correo.com"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>
          {error ? <p className="rounded-3xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-3xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
