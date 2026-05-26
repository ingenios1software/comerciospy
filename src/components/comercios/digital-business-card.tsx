"use client";

import { Check, Copy, ExternalLink, MessageCircle, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Comercio } from '@/types';
import { buildPublicCommerceUrl } from '@/lib/utils/format';

type DigitalBusinessCardProps = {
  comercio: Comercio;
  compact?: boolean;
};

function buildShareText(comercio: Comercio, url: string) {
  return [
    comercio.nombre,
    comercio.rubro,
    comercio.resumen ?? comercio.descripcion,
    `Ciudad: ${comercio.ciudad}`,
    `WhatsApp: ${comercio.whatsapp}`,
    comercio.telefono ? `Telefono: ${comercio.telefono}` : '',
    `Ficha digital: ${url}`
  ]
    .filter(Boolean)
    .join('\n');
}

function buildWhatsappShareUrl(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function DigitalBusinessCard({ comercio, compact = false }: DigitalBusinessCardProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => buildPublicCommerceUrl(comercio.id), [comercio.id]);
  const shareText = useMemo(() => buildShareText(comercio, publicUrl), [comercio, publicUrl]);
  const whatsappShareUrl = buildWhatsappShareUrl(shareText);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = async () => {
    try {
      if (!navigator.share) {
        await handleCopy();
        return;
      }

      await navigator.share({
        title: comercio.nombre,
        text: `${comercio.nombre} - ${comercio.rubro}`,
        url: publicUrl
      });
    } catch {
      await handleCopy();
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-soft ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {comercio.logoUrl ? <img src={comercio.logoUrl} alt={comercio.nombre} className="h-full w-full object-cover" /> : <Share2 className="h-5 w-5 text-slate-500" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-950">Tarjeta digital</p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
            Comparte la ficha publica de {comercio.nombre} como presentacion.
          </p>
        </div>
      </div>

      {!compact ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-950">{comercio.nombre}</p>
          <p>{comercio.rubro}</p>
          <p>{comercio.ciudad}</p>
          <p className="mt-2 break-all text-xs text-slate-500">{publicUrl}</p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir
        </a>
      </div>
    </div>
  );
}
