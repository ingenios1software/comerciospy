"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createCommerce, createUserProfile } from '@/lib/firebase/firestore';
import { registerUser } from '@/lib/firebase/auth';

export default function RegistroPage() {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rubro, setRubro] = useState('');
  const [categoria, setCategoria] = useState('Servicios');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await registerUser(email, password);
      const commerceId = userCredential.user.uid;

      await createUserProfile({
        id: commerceId,
        nombre: ownerName,
        email,
        rol: 'comercio',
        comercioId: commerceId,
        activo: true,
        creadoEn: new Date().toISOString()
      });

      await createCommerce({
        id: commerceId,
        nombre: businessName,
        rubro,
        categoria,
        descripcion,
        ciudad,
        direccion,
        whatsapp,
        logoUrl: 'https://images.unsplash.com/photo-1523475496153-3d6ccf030a5f?auto=format&fit=crop&w=200&q=60',
        portadaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=60',
        horario: '09:00 - 21:00',
        ubicacion: { lat: -34.6037, lng: -58.3816 },
        activo: true,
        verificado: false,
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
      <div className="mx-auto max-w-2xl space-y-6 rounded-[2rem] bg-slate-900/95 p-6 shadow-soft ring-1 ring-white/10">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Registro de comercio</p>
          <h1 className="text-3xl font-semibold">Lleva tu negocio al móvil</h1>
          <p className="text-sm text-slate-400">Crea tu cuenta y registra tu comercio en un solo paso.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ownerName" className="mb-2 block text-sm font-medium text-slate-200">
                Nombre del responsable
              </label>
              <input
                id="ownerName"
                value={ownerName}
                onChange={(event) => setOwnerName(event.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
            <div>
              <label htmlFor="businessName" className="mb-2 block text-sm font-medium text-slate-200">
                Nombre del comercio
              </label>
              <input
                id="businessName"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Tu comercio"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rubro" className="mb-2 block text-sm font-medium text-slate-200">
                Rubro
              </label>
              <input
                id="rubro"
                value={rubro}
                onChange={(event) => setRubro(event.target.value)}
                placeholder="Ej. Cafetería, Peluquería"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
            <div>
              <label htmlFor="categoria" className="mb-2 block text-sm font-medium text-slate-200">
                Categoría
              </label>
              <input
                id="categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                placeholder="Ej. Servicios, Moda"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ciudad" className="mb-2 block text-sm font-medium text-slate-200">
                Ciudad
              </label>
              <input
                id="ciudad"
                value={ciudad}
                onChange={(event) => setCiudad(event.target.value)}
                placeholder="Ciudad"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
            <div>
              <label htmlFor="direccion" className="mb-2 block text-sm font-medium text-slate-200">
                Dirección
              </label>
              <input
                id="direccion"
                value={direccion}
                onChange={(event) => setDireccion(event.target.value)}
                placeholder="Calle y número"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="whatsapp" className="mb-2 block text-sm font-medium text-slate-200">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="5493412345678"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-slate-200">
              Descripción del comercio
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              rows={4}
              placeholder="Describe brevemente tu comercio"
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
            {loading ? 'Registrando comercio...' : 'Registrar comercio'}
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
