"use client";

import { Check, Copy, Send, Share2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { appShareText, appShareTitle, getAppShareUrl, getAppWhatsappShareUrl } from '@/lib/app-share';

type ShareAppButtonProps = {
  mode?: 'button' | 'panel';
};

type NavigatorWithShare = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

export function ShareAppButton({ mode = 'button' }: ShareAppButtonProps) {
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
      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
    >
      {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
      {copied ? 'Copiado' : 'Compartir'}
    </button>
  );
}
