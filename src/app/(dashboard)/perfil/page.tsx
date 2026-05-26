"use client";

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Save } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/firebase/auth-context';
import { getComercioById, updateCommerce } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { categories } from '@/lib/categories';
import type { Comercio } from '@/types';

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();
  const categoryOptions = categories.filter((category) => category.id !== 'Todos');
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('');
  const [categoria, setCategoria] = useState(categoryOptions[0]?.label ?? 'Servicios');
  const [descripcion, setDescripcion] = useState('');
  const [resumen, setResumen] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('');
  const [ubicacionUrl, setUbicacionUrl] = useState('');
  const [servicios, setServicios] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const comercioId = profile?.comercioId ?? user?.uid;

  useEffect(() => {
    const loadCommerce = async () => {
      if (!comercioId) return;
      try {
        const data = await getComercioById(comercioId);
        setComercio(data);

        if (data) {
          setNombre(data.nombre);
          setRubro(data.rubro);
          setCategoria(data.categoria);
          setDescripcion(data.descripcion);
          setResumen(data.resumen ?? '');
          setCiudad(data.ciudad);
          setDireccion(data.direccion);
          setTelefono(data.telefono ?? '');
          setWhatsapp(data.whatsapp);
          setHorario(data.horario);
          setUbicacionUrl(data.ubicacionUrl ?? '');
          setServicios((data.servicios ?? []).join(', '));
        }
      } catch {
        setComercio(null);
      }
    };

    loadCommerce();
  }, [comercioId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    if (!user || !comercioId) {
      setError('No encontramos una cuenta de comercio asignada.');
      setSaving(false);
      return;
    }

    try {
      const uploads: Partial<Comercio> = {};
      if (logoFile) uploads.logoUrl = await uploadFile(`comercios/${comercioId}/logo-${Date.now()}`, logoFile);
      if (portadaFile) uploads.portadaUrl = await uploadFile(`comercios/${comercioId}/portada-${Date.now()}`, portadaFile);

      let fotos = comercio?.fotos ?? [];
      if (galleryFiles.length > 0) {
        const uploadedGallery = await Promise.all(
          galleryFiles.map((file, index) => uploadFile(`comercios/${comercioId}/galeria-${Date.now()}-${index}`, file))
        );
        fotos = [...uploadedGallery, ...fotos].slice(0, 8);
      }

      const payload: Partial<Comercio> = {
        ...uploads,
        ownerId: user.uid,
        nombre,
        rubro,
        categoria,
        descripcion,
        resumen,
        ciudad,
        direccion,
        telefono,
        whatsapp,
        horario,
        ubicacionUrl,
        fotos,
        servicios: servicios
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 12)
      };

      await updateCommerce(comercioId, payload);
      setComercio((current) => (current ? { ...current, ...payload } : ({ id: comercioId, ...payload } as Comercio)));
      setLogoFile(null);
      setPortadaFile(null);
      setGalleryFiles([]);
      setSuccess('Ficha actualizada correctamente.');
    } catch {
      setError('No se pudo guardar la ficha. Revisa Firebase Storage y vuelve a intentar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando perfil...</div>
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
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Mi comercio</p>
                <h1 className="mt-2 text-3xl font-semibold">Editar ficha publica</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">Estos datos aparecen en el listado, la ficha, los botones de contacto y tu tarjeta digital compartible.</p>
              </div>
              {comercio ? (
                <Link href={`/comercios/${comercio.id}`} className="inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Ver ficha
                </Link>
              ) : null}
            </div>

            {!comercio ? (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                <p className="font-semibold">No hay comercio asignado</p>
                <p>Cuando administracion cree tu ficha y la vincule a tu usuario, vas a poder editarla desde aqui.</p>
              </div>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="nombre" label="Nombre del negocio" value={nombre} onChange={setNombre} required />
                <Field id="rubro" label="Rubro" value={rubro} onChange={setRubro} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                <Field id="horario" label="Horario" value={horario} onChange={setHorario} placeholder="Lun a sab, 08:00 - 18:00" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="telefono" label="Telefono" value={telefono} onChange={setTelefono} />
                <Field id="whatsapp" label="WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="+595981000000" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="ciudad" label="Ciudad" value={ciudad} onChange={setCiudad} required />
                <Field id="direccion" label="Direccion" value={direccion} onChange={setDireccion} required />
              </div>

              <Field id="ubicacionUrl" label="Link de Google Maps" value={ubicacionUrl} onChange={setUbicacionUrl} placeholder="https://www.google.com/maps/..." />
              <Field id="resumen" label="Resumen corto" value={resumen} onChange={setResumen} placeholder="Una frase corta para el listado" />
              <Field id="servicios" label="Servicios separados por coma" value={servicios} onChange={setServicios} placeholder="Delivery, reservas, reparaciones" />

              <div>
                <label htmlFor="descripcion" className="mb-2 block text-sm font-semibold text-slate-700">
                  Descripcion
                </label>
                <textarea
                  id="descripcion"
                  rows={5}
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FileField id="logo" label="Logo" onChange={(files) => setLogoFile(files[0] ?? null)} />
                <FileField id="portada" label="Portada" onChange={(files) => setPortadaFile(files[0] ?? null)} />
                <FileField id="galeria" label="Agregar fotos" multiple onChange={(files) => setGalleryFiles(files)} />
              </div>

              {comercio?.fotos?.length ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {comercio.fotos.slice(0, 8).map((foto, index) => (
                    <div key={`${foto}-${index}`} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                      <img src={foto} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}

              {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
              {success ? <p className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
              <button
                type="submit"
                disabled={saving || !comercio}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar ficha'}
              </button>
            </form>
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
  placeholder,
  required
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
        required={required}
      />
    </div>
  );
}

function FileField({
  id,
  label,
  multiple,
  onChange
}: {
  id: string;
  label: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-700 transition hover:border-accent hover:bg-red-50/40">
      <ImagePlus className="h-5 w-5 text-slate-400" />
      <span className="mt-2">{label}</span>
      <input
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(event) => onChange(Array.from(event.target.files ?? []))}
        className="sr-only"
      />
    </label>
  );
}
