"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Loader2, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { uploadFile } from '@/lib/firebase/storage';
import { createPublication, getComercioById } from '@/lib/firebase/firestore';
import { categories } from '@/lib/categories';
import type { AiPublicationSuggestion, Comercio, Publicacion } from '@/types';

type AiResponse = {
  suggestion?: AiPublicationSuggestion;
  error?: string;
};

export default function PublicarPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const categoryOptions = categories.filter((category) => category.id !== 'Todos');
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<Publicacion['tipo']>('producto');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState(categoryOptions[0]?.label ?? 'Servicios');
  const [descripcion, setDescripcion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiPublicationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadCommerce = async () => {
      if (!profile?.comercioId) return;
      try {
        const data = await getComercioById(profile.comercioId);
        setComercio(data);
        if (data?.categoria) setCategoria(data.categoria);
      } catch {
        setComercio(null);
      }
    };

    loadCommerce();
  }, [profile?.comercioId]);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAnalyze = async () => {
    setError(null);
    setAiSuggestion(null);

    if (!file) {
      setError('Sube una foto para que la IA pueda analizarla.');
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('businessName', comercio?.nombre ?? profile?.nombre ?? '');
      formData.append('businessCategory', comercio?.categoria ?? categoria);
      formData.append('currentTitle', titulo);
      formData.append('currentDescription', descripcion);

      const response = await fetch('/api/ai/publicacion', {
        method: 'POST',
        body: formData
      });
      const data = (await response.json()) as AiResponse;

      if (!response.ok || !data.suggestion) {
        throw new Error(data.error ?? 'No se pudo analizar la foto.');
      }

      setAiSuggestion(data.suggestion);
      setTitulo(data.suggestion.titulo);
      setDescripcion(data.suggestion.descripcion);
      setCategoria(data.suggestion.categoria);
      setTipo(data.suggestion.tipo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo analizar la foto.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!user) {
      setError('Debes iniciar sesion antes de publicar.');
      setSubmitting(false);
      return;
    }

    try {
      const id = crypto.randomUUID();
      const imageUrl = file ? await uploadFile(`publicaciones/${profile?.comercioId ?? user.uid}/${id}`, file) : '';
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
        ciudad: comercio?.ciudad ?? 'Ciudad',
        activo: true,
        creadoEn: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch {
      setError('No se pudo publicar. Revisa tu conexion o la configuracion de Firebase.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando sesion...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-glow">
          <h1 className="text-2xl font-semibold">Necesitas iniciar sesion</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Solo los comercios dados de alta pueden crear publicaciones.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
            Ir al acceso
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Publicar</p>
              <h1 className="mt-2 text-3xl font-semibold">Nueva publicacion</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Carga una foto y usa la IA para escribir una descripcion mas clara.</p>
            </div>
            {comercio ? (
              <Link href={`/comercios/${comercio.id}`} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Ver ficha
              </Link>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="imagen" className="mb-2 block text-sm font-semibold text-slate-700">
                Foto
              </label>
              <label htmlFor="imagen" className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-accent hover:bg-red-50/40">
                {previewUrl ? (
                  <img src={previewUrl} alt="Vista previa" className="max-h-72 w-full rounded-2xl object-cover" />
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 text-slate-400" />
                    <span className="mt-3 text-sm font-semibold text-slate-700">Subir foto del producto o servicio</span>
                    <span className="mt-1 text-xs text-slate-500">JPG, PNG o WebP hasta 8 MB para IA.</span>
                  </>
                )}
                <input
                  id="imagen"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setAiSuggestion(null);
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !file}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {analyzing ? 'Analizando foto...' : 'Mejorar con IA'}
            </button>

            <div>
              <label htmlFor="titulo" className="mb-2 block text-sm font-semibold text-slate-700">
                Titulo
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ej: Combo especial para el almuerzo"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tipo" className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as Publicacion['tipo'])}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                  <option value="oferta">Oferta</option>
                  <option value="novedad">Novedad</option>
                </select>
              </div>
              <div>
                <label htmlFor="precio" className="mb-2 block text-sm font-semibold text-slate-700">
                  Precio
                </label>
                <input
                  id="precio"
                  type="number"
                  value={precio}
                  onChange={(event) => setPrecio(event.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="categoria" className="mb-2 block text-sm font-semibold text-slate-700">
                Categoria
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
              >
                {categoryOptions.map((option) => (
                  <option key={option.id} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-2 block text-sm font-semibold text-slate-700">
                Descripcion
              </label>
              <textarea
                id="descripcion"
                rows={5}
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Describe brevemente tu oferta, producto o servicio"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>

            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Publicando...' : 'Publicar ahora'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-slate-950">Asistente IA</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">La sugerencia se genera desde la foto. Luego podes editar todo antes de publicar.</p>
          </div>

          {aiSuggestion ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-slate-950">Ideas para mejorar la publicacion</p>
                <div className="mt-3 space-y-2">
                  {aiSuggestion.ideas.map((idea) => (
                    <p key={idea} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      {idea}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Mejoras para la foto</p>
                <div className="mt-3 space-y-2">
                  {aiSuggestion.mejorasFoto.map((idea) => (
                    <p key={idea} className="rounded-2xl bg-red-50 p-3 text-sm leading-6 text-slate-700">
                      {idea}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <p className="font-semibold">Texto para WhatsApp</p>
                <p className="mt-2">{aiSuggestion.textoWhatsapp}</p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
