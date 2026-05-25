"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createUserProfile } from '@/lib/firebase/firestore';
import { registerUser } from '@/lib/firebase/auth';

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await registerUser(email, password);
      await createUserProfile({
        id: userCredential.user.uid,
        nombre: name,
        email,
        rol: 'comercio',
        comercioId: userCredential.user.uid,
        activo: true,
        creadoEn: new Date().toISOString()
      });
      router.push('/dashboard');
    } catch (err) {
      setError('No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-md space-y-6 rounded-[2rem] bg-slate-900/95 p-6 shadow-soft ring-1 ring-white/10">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Registro</p>
          <h1 className="text-3xl font-semibold">Empieza tu comercio</h1>
          <p className="text-sm text-slate-400">Crea tu cuenta y publica tu primer producto u oferta.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-slate-200">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre completo"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>
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
              placeholder="Mínimo 8 caracteres"
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
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
