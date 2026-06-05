"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Check, Clipboard, ExternalLink, ImagePlus, Loader2, MapPin, Navigation, Save, Search } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { ImageLightbox, type LightboxImage } from '@/components/ui/image-lightbox';
import { RenewalNotice } from '@/components/subscription/renewal-notice';
import { useAuth } from '@/lib/firebase/auth-context';
import { getComercioById, updateCommerce } from '@/lib/firebase/firestore';
import { uploadFile } from '@/lib/firebase/storage';
import { categories } from '@/lib/categories';
import { isSubscriptionExpired } from '@/lib/subscription';
import { buildPublicCommerceUrl } from '@/lib/utils/format';
import type { Comercio } from '@/types';

const requiredProfileFields: Array<{ label: string; value: (data: ProfileFormData) => string }> = [
  { label: 'Nombre del negocio', value: (data) => data.nombre },
  { label: 'Rubro', value: (data) => data.rubro },
  { label: 'Categoria', value: (data) => data.categoria },
  { label: 'Horario', value: (data) => data.horario },
  { label: 'WhatsApp', value: (data) => data.whatsapp },
  { label: 'Ciudad', value: (data) => data.ciudad },
  { label: 'Direccion', value: (data) => data.direccion },
  { label: 'Descripcion', value: (data) => data.descripcion }
];

type ProfileFormData = {
  nombre: string;
  rubro: string;
  categoria: string;
  descripcion: string;
  resumen: string;
  ciudad: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  horario: string;
  ubicacionUrl: string;
  servicios: string;
};

function clean(value: string) {
  return value.trim();
}

function normalizeCoordinateInput(value: string) {
  return value.trim().replace(',', '.');
}

function parseCoordinate(value: string) {
  const parsed = Number(normalizeCoordinateInput(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidCoordinates(lat: number | null, lng: number | null) {
  return lat !== null && lng !== null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function getValidCoordinates(latValue: string, lngValue: string) {
  const lat = parseCoordinate(latValue);
  const lng = parseCoordinate(lngValue);

  return isValidCoordinates(lat, lng) && lat !== null && lng !== null ? { lat, lng } : null;
}

function isUsableSavedCoordinates(lat?: number, lng?: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

function formatCoordinate(value: number) {
  return value.toFixed(6).replace(/\.?0+$/, '');
}

function buildCoordinateMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${formatCoordinate(lat)},${formatCoordinate(lng)}`;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCoordinatesFromText(value: string) {
  const text = safeDecodeURIComponent(value.trim());
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (isValidCoordinates(lat, lng)) return { lat, lng };
  }

  return null;
}

function isZeroCoordinateLocation(value: string) {
  const coordinates = parseCoordinatesFromText(value);
  const text = safeDecodeURIComponent(value.trim());

  return (
    (coordinates?.lat === 0 && coordinates?.lng === 0) ||
    /0[\u00b0\u00ba]\s*0['\u2019]\s*0(?:\.0+)?["\u201d]?[NS]\s+0[\u00b0\u00ba]\s*0['\u2019]\s*0(?:\.0+)?["\u201d]?[EW]/i.test(text)
  );
}

function cleanLocationPhone(value: string) {
  return value.replace(/[^0-9]/g, '');
}

function buildGoogleBusinessSearchUrl(data: Pick<ProfileFormData, 'nombre' | 'direccion' | 'ciudad' | 'telefono' | 'whatsapp'>) {
  const phone = cleanLocationPhone(data.whatsapp || data.telefono);
  const locationHint = phone || data.direccion;
  const query = [data.nombre, data.ciudad, locationHint].map(clean).filter(Boolean).join(' ');
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : 'https://www.google.com/maps';
}

const googleBusinessProfileUrl = 'https://business.google.com/add';

function getGeolocationErrorMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return 'El celular no dio permiso para usar la ubicacion. Activa el permiso del navegador e intenta de nuevo.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'No pudimos detectar la ubicacion actual. Intenta al aire libre o carga el link de Google Maps.';
  }

  if (error.code === error.TIMEOUT) {
    return 'La ubicacion tardo demasiado. Intenta nuevamente o carga el link de Google Maps.';
  }

  return 'No pudimos obtener la ubicacion actual.';
}

function getFirebaseSaveMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';

  if (code.includes('permission-denied') || code === 'storage/unauthorized') {
    return 'No tenes permisos para guardar esta ficha. Revisa que las reglas de Firestore/Storage esten publicadas y que tu usuario tenga rol comercio con su comercioId correcto.';
  }

  if (code === 'storage/quota-exceeded') {
    return 'No se pudo subir la imagen porque el Storage supero la cuota disponible.';
  }

  if (code === 'storage/retry-limit-exceeded') {
    return 'No se pudo subir la imagen por conexion inestable. Intenta nuevamente.';
  }

  if (message) {
    return message;
  }

  return 'No se pudo guardar la ficha. Revisa los datos e intenta nuevamente.';
}

export default function PerfilPage() {
  const { user, profile, loading } = useAuth();
  const subscriptionExpired = profile?.rol === 'comercio' && isSubscriptionExpired(profile);
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
  const [ubicacionLat, setUbicacionLat] = useState('');
  const [ubicacionLng, setUbicacionLng] = useState('');
  const [servicios, setServicios] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [copiedGoogleField, setCopiedGoogleField] = useState('');

  const comercioId = profile?.comercioId ?? user?.uid;
  const photoLightboxItems = useMemo<LightboxImage[]>(
    () =>
      (comercio?.fotos ?? []).slice(0, 8).map((foto, index) => ({
        src: foto,
        alt: `Foto ${index + 1}`
      })),
    [comercio?.fotos]
  );

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
          const savedUrl = isZeroCoordinateLocation(data.ubicacionUrl ?? '') ? '' : data.ubicacionUrl ?? '';
          setUbicacionUrl(savedUrl);
          if (isUsableSavedCoordinates(data.ubicacion?.lat, data.ubicacion?.lng)) {
            setUbicacionLat(formatCoordinate(data.ubicacion.lat));
            setUbicacionLng(formatCoordinate(data.ubicacion.lng));
          } else {
            const parsedCoordinates = parseCoordinatesFromText(savedUrl);
            setUbicacionLat(parsedCoordinates ? formatCoordinate(parsedCoordinates.lat) : '');
            setUbicacionLng(parsedCoordinates ? formatCoordinate(parsedCoordinates.lng) : '');
          }
          setServicios((data.servicios ?? []).join(', '));
        }
      } catch {
        setComercio(null);
      }
    };

    loadCommerce();
  }, [comercioId]);

  const googleBusinessSearchUrl = useMemo(
    () => buildGoogleBusinessSearchUrl({ nombre, direccion, ciudad, telefono, whatsapp }),
    [nombre, direccion, ciudad, telefono, whatsapp]
  );

  const currentLocationUrl = useMemo(() => {
    const savedUrl = ubicacionUrl.trim();
    if (savedUrl && !isZeroCoordinateLocation(savedUrl)) return savedUrl;

    const coordinates = getValidCoordinates(ubicacionLat, ubicacionLng);
    if (coordinates) return buildCoordinateMapsUrl(coordinates.lat, coordinates.lng);

    return '';
  }, [ubicacionLat, ubicacionLng, ubicacionUrl]);

  const publicCommerceUrl = useMemo(() => (comercioId ? buildPublicCommerceUrl(comercioId) : ''), [comercioId]);

  const googleBusinessProfileFields = useMemo(
    () =>
      [
        { id: 'nombre', label: 'Nombre', value: clean(nombre) },
        { id: 'categoria', label: 'Categoria sugerida', value: clean(rubro || categoria) },
        { id: 'direccion', label: 'Direccion', value: [clean(direccion), clean(ciudad)].filter(Boolean).join(', ') },
        { id: 'telefono', label: 'Telefono', value: clean(telefono || whatsapp) },
        { id: 'horario', label: 'Horario', value: clean(horario) },
        { id: 'sitio', label: 'Sitio web', value: publicCommerceUrl },
        { id: 'ubicacion', label: 'Link de Maps', value: currentLocationUrl },
        { id: 'descripcion', label: 'Descripcion', value: clean(resumen || descripcion) }
      ].filter((field) => field.value),
    [categoria, ciudad, currentLocationUrl, descripcion, direccion, horario, nombre, publicCommerceUrl, resumen, rubro, telefono, whatsapp]
  );

  const syncCoordinates = (lat: number, lng: number, options?: { updateUrl?: boolean }) => {
    setUbicacionLat(formatCoordinate(lat));
    setUbicacionLng(formatCoordinate(lng));
    if (options?.updateUrl !== false) {
      setUbicacionUrl(buildCoordinateMapsUrl(lat, lng));
    }
  };

  const handleLocationUrlChange = (value: string) => {
    setUbicacionUrl(value);
    const coordinates = parseCoordinatesFromText(value);
    if (coordinates && isUsableSavedCoordinates(coordinates.lat, coordinates.lng)) {
      syncCoordinates(coordinates.lat, coordinates.lng, { updateUrl: false });
    } else if (isZeroCoordinateLocation(value)) {
      setUbicacionLat('');
      setUbicacionLng('');
    }
  };

  const handleCoordinateChange = (nextLat: string, nextLng: string) => {
    setUbicacionLat(nextLat);
    setUbicacionLng(nextLng);

    const coordinates = getValidCoordinates(nextLat, nextLng);
    if (coordinates) {
      setUbicacionUrl(buildCoordinateMapsUrl(coordinates.lat, coordinates.lng));
    }
  };

  const handleUseCurrentLocation = () => {
    setError(null);
    setSuccess(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Este navegador no permite obtener la ubicacion actual.');
      return;
    }

    if (!window.isSecureContext) {
      setError('Para usar la ubicacion actual desde el celular, abre la app en HTTPS.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        syncCoordinates(position.coords.latitude, position.coords.longitude);
        setSuccess('Ubicacion detectada. Guarda la ficha para publicarla.');
        setLocating(false);
      },
      (geoError) => {
        setError(getGeolocationErrorMessage(geoError));
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 15_000
      }
    );
  };

  const handleClearLocation = () => {
    setUbicacionLat('');
    setUbicacionLng('');
    setUbicacionUrl('');
  };

  const handleCopyGoogleField = async (fieldId: string, value: string) => {
    setError(null);

    try {
      await navigator.clipboard.writeText(value);
      setCopiedGoogleField(fieldId);
      window.setTimeout(() => setCopiedGoogleField((current) => (current === fieldId ? '' : current)), 1600);
    } catch {
      setError('No se pudo copiar el dato. Seleccionalo manualmente e intenta de nuevo.');
    }
  };

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

    const formData: ProfileFormData = {
      nombre: clean(nombre),
      rubro: clean(rubro),
      categoria: clean(categoria),
      descripcion: clean(descripcion),
      resumen: clean(resumen),
      ciudad: clean(ciudad),
      direccion: clean(direccion),
      telefono: clean(telefono),
      whatsapp: clean(whatsapp),
      horario: clean(horario),
      ubicacionUrl: clean(ubicacionUrl),
      servicios
    };
    const hasLocationInput = Boolean(ubicacionLat.trim() || ubicacionLng.trim());
    const ubicacion = getValidCoordinates(ubicacionLat, ubicacionLng);
    const savedUrl = isZeroCoordinateLocation(formData.ubicacionUrl) ? '' : formData.ubicacionUrl;

    if (hasLocationInput && !ubicacion) {
      setError('Revisa las coordenadas de ubicacion.');
      setSaving(false);
      return;
    }

    const savedLocation = ubicacion ?? { lat: 0, lng: 0 };
    const locationUrl = savedUrl || (ubicacion ? buildCoordinateMapsUrl(ubicacion.lat, ubicacion.lng) : '');

    const missingFields = requiredProfileFields
      .filter((field) => !field.value(formData))
      .map((field) => field.label);

    if (missingFields.length > 0) {
      setError(`Falta completar: ${missingFields.join(', ')}.`);
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
        nombre: formData.nombre,
        rubro: formData.rubro,
        categoria: formData.categoria,
        descripcion: formData.descripcion,
        resumen: formData.resumen,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        telefono: formData.telefono,
        whatsapp: formData.whatsapp,
        horario: formData.horario,
        ubicacionUrl: locationUrl,
        ubicacion: savedLocation,
        fotos,
        servicios: formData.servicios
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
    } catch (saveError) {
      setError(getFirebaseSaveMessage(saveError));
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

  if (user && subscriptionExpired) {
    return (
      <main className="min-h-screen bg-surface text-slate-950">
        <div className="lg:flex lg:min-h-screen">
          <Sidebar />
          <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-24 sm:px-6 lg:px-8 lg:pt-8">
            <RenewalNotice owner={profile} showBackLink />
          </div>
        </div>
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-slate-950">Ubicacion del negocio</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Ficha de Google Maps o GPS del celular.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <a
                      href={googleBusinessSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Search className="h-4 w-4" />
                      Buscar ficha en Maps
                    </a>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                      {locating ? 'Detectando...' : 'Usar ubicacion actual'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <Field id="ubicacionUrl" label="Link de Google Maps" value={ubicacionUrl} onChange={handleLocationUrlChange} placeholder="https://www.google.com/maps/..." />
                  <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Ajuste manual de coordenadas</summary>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        id="ubicacionLat"
                        label="Latitud"
                        value={ubicacionLat}
                        onChange={(value) => handleCoordinateChange(value, ubicacionLng)}
                        placeholder="-25.2867"
                      />
                      <Field
                        id="ubicacionLng"
                        label="Longitud"
                        value={ubicacionLng}
                        onChange={(value) => handleCoordinateChange(ubicacionLat, value)}
                        placeholder="-57.3333"
                      />
                    </div>
                  </details>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {currentLocationUrl ? (
                      <a
                        href={currentLocationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver en Maps
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Limpiar ubicacion
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-accent" />
                      <p className="text-sm font-semibold text-slate-950">Google Business Profile</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Datos listos para crear o reclamar la ficha del negocio en Google.</p>
                  </div>
                  <a
                    href={googleBusinessProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Publicar en Google Maps
                  </a>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {googleBusinessProfileFields.map((field) => (
                    <div key={field.id} className="flex min-h-14 min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase text-slate-500">{field.label}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">{field.value}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyGoogleField(field.id, field.value)}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-950"
                        aria-label={`Copiar ${field.label}`}
                      >
                        {copiedGoogleField === field.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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

              {photoLightboxItems.length ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {photoLightboxItems.map((foto, index) => (
                    <button
                      type="button"
                      key={`${foto.src}-${index}`}
                      onClick={() => setActivePhotoIndex(index)}
                      className="group aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                      aria-label={`Ampliar foto ${index + 1}`}
                    >
                      <img src={foto.src} alt={foto.alt} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </button>
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
      <ImageLightbox images={photoLightboxItems} activeIndex={activePhotoIndex} onChange={setActivePhotoIndex} onClose={() => setActivePhotoIndex(null)} />
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
