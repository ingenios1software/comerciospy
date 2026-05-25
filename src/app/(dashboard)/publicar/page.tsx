"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { uploadFile } from '@/lib/firebase/storage';
import { createPublication } from '@/lib/firebase/firestore';

export default function PublicarPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'producto' | 'servicio' | 'oferta' | 'novedad'>('producto');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!user) {
      setError('Debes iniciar sesión antes de publicar.');
      setSubmitting(false);
      return;
    }

    try {
      const id = crypto.randomUUID();
      const imageUrl = file ? await uploadFile(`publicaciones/${id}`, file) : '';
      const comercioId = profile?.comercioId ?? user.uid;

      await createPublication({
        id,
        comercioId,
        tipo,
        titulo,
        descripcion,
        precio: precio ? Number(precio) : null,
        imagenUrl: imageUrl,
        categoria,
        ciudad: 'Ciudad',
        activo: true,
        creadoEn: new Date().toISOString(),
      });

      router.push('/dashboard');
    } catch (err) {
      setError('No se pudo publicar. Revisa tu conexión o la configuración de Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-28 pt-24 text-slate-50 sm:px-6">
      <div className="mx-auto max-w-md space-y-6 rounded-[2rem] bg-slate-900/95 p-5 shadow-soft ring-1 ring-white/10 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Publicar</p>
          <h1 className="text-3xl font-semibold">Publica tu oferta en segundos</h1>
          <p className="text-sm text-slate-400">Formulario simple para cargar producto, servicio, oferta o novedad desde el celular.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="titulo" className="mb-2 block text-sm font-medium text-slate-200">Título</label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej: Combo especial para el almuerzo"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo" className="mb-2 block text-sm font-medium text-slate-200">Tipo</label>
              <select
                id="tipo"
                value={tipo}
                onChange={(event) => setTipo(event.target.value as typeof tipo)}
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
                <option value="oferta">Oferta</option>
                <option value="novedad">Novedad</option>
              </select>
            </div>
            <div>
              <label htmlFor="precio" className="mb-2 block text-sm font-medium text-slate-200">Precio</label>
              <input
                id="precio"
                type="number"
                value={precio}
                onChange={(event) => setPrecio(event.target.value)}
                placeholder="Opcional"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
          </div>
          <div>
            <label htmlFor="categoria" className="mb-2 block text-sm font-medium text-slate-200">Categoría</label>
            <input
              id="categoria"
              type="text"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              placeholder="Ej: Bebidas, Panadería, Moda"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </div>
          <div>
            <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-slate-200">Descripción</label>
            <textarea
              id="descripcion"
              rows={4}
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              placeholder="Describe brevemente tu oferta o producto"
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              required
            />
          </div>
          <div>
            <label htmlFor="imagen" className="mb-2 block text-sm font-medium text-slate-200">Foto</label>
            <input
              id="imagen"
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none"
            />
          </div>
          {error ? <p className="rounded-3xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-3xl bg-cyan-500 px-5 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Publicando...' : 'Publicar ahora'}
          </button>
          <p className="text-center text-xs text-slate-500">Las publicaciones se guardan en la app y luego se sincronizan con Firestore cuando configures Firebase.</p>
        </form>
      </div>
    </main>
  );
}
