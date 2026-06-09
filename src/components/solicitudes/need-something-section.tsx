"use client";

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, MapPin, MessageCircle, Send, Sparkles, Store } from 'lucide-react';
import { getCityOptions } from '@/lib/cities';
import { publicationCategories } from '@/lib/categories';
import { createSolicitudCliente, getActiveSolicitudes } from '@/lib/firebase/firestore';
import { sampleSolicitudes } from '@/lib/mockData';
import { normalizeSearchText } from '@/lib/search';
import { buildWhatsappUrl, cleanPhone } from '@/lib/utils/format';
import type { Comercio, SolicitudCliente } from '@/types';

type NeedSomethingSectionProps = {
  comercios: Comercio[];
};

const localSolicitudesKey = 'comerciospy:solicitudes:v1';

const examples = [
  {
    label: 'Electricista para hoy',
    text: 'Necesito electricista para hoy.',
    category: 'Electricidad'
  },
  {
    label: 'Tractorista manana',
    text: 'Busco tractorista para manana.',
    category: 'Servicios'
  },
  {
    label: 'Presupuesto de aire',
    text: 'Necesito presupuesto para aire acondicionado.',
    category: 'Vivienda'
  }
];

function getNowIso() {
  return new Date().toISOString();
}

function getLocalSolicitudes() {
  if (typeof window === 'undefined') return [];

  try {
    const rawValue = window.localStorage.getItem(localSolicitudesKey);
    const parsed = rawValue ? (JSON.parse(rawValue) as SolicitudCliente[]) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item.estado === 'activa') : [];
  } catch {
    return [];
  }
}

function saveLocalSolicitud(solicitud: SolicitudCliente) {
  if (typeof window === 'undefined') return;

  try {
    const nextSolicitudes = [solicitud, ...getLocalSolicitudes().filter((item) => item.id !== solicitud.id)].slice(0, 20);
    window.localStorage.setItem(localSolicitudesKey, JSON.stringify(nextSolicitudes));
  } catch {
    // The in-memory state still shows the request in this browser session.
  }
}

function mergeSolicitudes(...groups: SolicitudCliente[][]) {
  const map = new Map<string, SolicitudCliente>();

  groups.flat().forEach((item) => {
    if (item.estado === 'activa') map.set(item.id, item);
  });

  return Array.from(map.values())
    .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
    .slice(0, 8);
}

function formatRequestDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Ahora';
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
}

function buildReplyMessage(solicitud: SolicitudCliente) {
  return [
    'Hola, vi tu solicitud en ComerciosPY.',
    `"${solicitud.texto}"`,
    'Podemos ayudarte. Me gustaria coordinar por aca.'
  ].join('\n');
}

function getRelatedComercios(comercios: Comercio[], solicitud: SolicitudCliente) {
  const query = normalizeSearchText([solicitud.texto, solicitud.categoria, solicitud.ciudad].join(' '));

  return comercios
    .filter((comercio) => {
      const commerceText = normalizeSearchText([
        comercio.nombre,
        comercio.rubro,
        comercio.categoria,
        comercio.ciudad,
        comercio.barrio,
        comercio.servicios
      ]);

      return commerceText
        .split(' ')
        .some((term) => term.length > 3 && query.includes(term));
    })
    .slice(0, 3);
}

export function NeedSomethingSection({ comercios }: NeedSomethingSectionProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudCliente[]>(sampleSolicitudes);
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState('Servicios');
  const [ciudad, setCiudad] = useState(comercios[0]?.ciudad ?? 'Asuncion');
  const [barrio, setBarrio] = useState('');
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const cityOptions = useMemo(() => getCityOptions(comercios), [comercios]);
  const categoryOptions = useMemo(() => publicationCategories, []);

  useEffect(() => {
    let active = true;

    getActiveSolicitudes()
      .then((remoteSolicitudes) => {
        if (!active) return;
        setSolicitudes(mergeSolicitudes(remoteSolicitudes, getLocalSolicitudes(), sampleSolicitudes));
      })
      .catch(() => {
        if (active) setSolicitudes(mergeSolicitudes(getLocalSolicitudes(), sampleSolicitudes));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cityOptions.length > 1 && !cityOptions.some((option) => option.id === ciudad)) {
      setCiudad(cityOptions[1].id);
    }
  }, [cityOptions, ciudad]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const cleanText = texto.trim();
    const cleanWhatsapp = cleanPhone(whatsapp);

    if (cleanText.length < 8) {
      setError('Escribi un pedido un poco mas claro.');
      return;
    }

    if (cleanWhatsapp.length < 6) {
      setError('Agrega un WhatsApp para que puedan responderte.');
      return;
    }

    const solicitud: SolicitudCliente = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `solicitud-${Date.now()}`,
      texto: cleanText,
      categoria,
      ciudad,
      barrio: barrio.trim() || undefined,
      nombre: nombre.trim() || undefined,
      whatsapp: cleanWhatsapp,
      estado: 'activa',
      creadoEn: getNowIso()
    };

    setSaving(true);

    try {
      await createSolicitudCliente(solicitud);
      setMessage('Solicitud publicada. Los comercios relacionados ya pueden verla.');
    } catch {
      saveLocalSolicitud(solicitud);
      setMessage('Solicitud guardada en este dispositivo. Se mostrara aunque Firestore no este disponible.');
    } finally {
      setSolicitudes((current) => mergeSolicitudes([solicitud], current));
      setTexto('');
      setBarrio('');
      setNombre('');
      setWhatsapp('');
      setSaving(false);
    }
  };

  return (
    <section id="necesito-algo" className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form className="rounded-md border border-slate-200 bg-white p-3 shadow-sm" onSubmit={handleSubmit}>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-accent">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[17px] font-black text-slate-950">Necesito Algo</h2>
            <p className="text-[11px] font-semibold text-slate-500">Publica una solicitud y recibe contacto por WhatsApp.</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {examples.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => {
                setTexto(example.text);
                setCategoria(example.category);
              }}
              className="shrink-0 rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-red-50 hover:text-accent"
            >
              {example.label}
            </button>
          ))}
        </div>

        <label htmlFor="need-text" className="mt-3 block text-[11px] font-black uppercase text-slate-600">
          Que necesitas
        </label>
        <textarea
          id="need-text"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          rows={3}
          placeholder="Ej: Necesito electricista para hoy."
          className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
          required
        />

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="block text-[11px] font-black uppercase text-slate-600">
            Categoria
            <select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-accent focus:bg-white"
            >
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-black uppercase text-slate-600">
            Ciudad
            <select
              value={ciudad}
              onChange={(event) => setCiudad(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-accent focus:bg-white"
            >
              {cityOptions.filter((option) => option.id !== 'Todas').map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-black uppercase text-slate-600">
            Barrio
            <input
              value={barrio}
              onChange={(event) => setBarrio(event.target.value)}
              placeholder="Opcional"
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-accent focus:bg-white"
            />
          </label>
          <label className="block text-[11px] font-black uppercase text-slate-600">
            WhatsApp
            <input
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="0981..."
              inputMode="tel"
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-accent focus:bg-white"
              required
            />
          </label>
          <label className="block text-[11px] font-black uppercase text-slate-600 sm:col-span-2">
            Nombre
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Opcional"
              className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-accent focus:bg-white"
            />
          </label>
        </div>

        {error ? <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-[11px] font-bold text-accent">{error}</p> : null}
        {message ? <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publicar solicitud
        </button>
      </form>

      <div className="min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-black text-slate-950">Solicitudes activas</h2>
            <p className="text-[11px] font-semibold text-slate-500">Comercios relacionados pueden contactar al cliente.</p>
          </div>
          <span className="rounded-md bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
            {solicitudes.length}
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {solicitudes.slice(0, 4).map((solicitud) => {
            const relatedComercios = getRelatedComercios(comercios, solicitud);
            const whatsappUrl = buildWhatsappUrl(solicitud.whatsapp, buildReplyMessage(solicitud));

            return (
              <article key={solicitud.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate rounded bg-red-50 px-2 py-1 text-[10px] font-black text-accent ring-1 ring-red-100">{solicitud.categoria}</span>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">{formatRequestDate(solicitud.creadoEn)}</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-slate-950">{solicitud.texto}</p>
                <p className="mt-2 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate">{solicitud.barrio ? `${solicitud.ciudad}, ${solicitud.barrio}` : solicitud.ciudad}</span>
                </p>
                {relatedComercios.length > 0 ? (
                  <p className="mt-2 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-600">
                    <Store className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">Relacionado: {relatedComercios.map((item) => item.nombre).join(', ')}</span>
                  </p>
                ) : null}
                {whatsappUrl !== '#' ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-[11px] font-black text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Contactar por WhatsApp
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
