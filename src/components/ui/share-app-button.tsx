"use client";

import { Check, Copy, Send, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { appShareText, appShareTitle, getAppShareUrl, getAppWhatsappShareUrl } from '@/lib/app-share';

type ShareAppButtonProps = {
  mode?: 'button' | 'panel';
  compact?: boolean;
  inverted?: boolean;
};

type NavigatorWithShare = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

export function ShareAppButton({ mode = 'button', compact = false, inverted = false }: ShareAppButtonProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = useMemo(() => getAppShareUrl(), []);
  const whatsappUrl = useMemo(() => getAppWhatsappShareUrl(), []);

  const copyLink = async () => {
    await navigator.clipboard?.writeText(appUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const shareApp = async () => {
    const shareData: ShareData = {
      title: appShareTitle,
      text: appShareText,
      url: appUrl
    };
    const navigatorWithShare = navigator as NavigatorWithShare;

    if (navigatorWithShare.share && (!navigatorWithShare.canShare || navigatorWithShare.canShare(shareData))) {
      await navigatorWithShare.share(shareData).catch(() => undefined);
      return;
    }

    await copyLink();
  };

  if (mode === 'panel') {
    return (
      <div className="grid gap-2 min-[1180px]:grid-cols-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-[12px] font-bold text-white transition hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copiado' : 'Copiar link'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={shareApp}
      aria-label={copied ? 'Link de ComerciosPY copiado' : 'Compartir ComerciosPY'}
      title={copied ? 'Link copiado' : 'Compartir ComerciosPY'}
      className={`inline-flex h-8 items-center justify-center gap-2 rounded-md text-[12px] font-bold transition ${
        inverted
          ? 'bg-white/15 text-white ring-1 ring-white/20 hover:bg-white/25'
          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      } ${compact ? 'w-8' : 'px-2.5'}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {compact ? null : copied ? 'Copiado' : 'Compartir'}
    </button>
  );
}
