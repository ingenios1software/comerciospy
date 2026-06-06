"use client";

import { Check, Share2 } from 'lucide-react';
import { type MouseEvent, useState } from 'react';

type NavigatorWithShare = Navigator & {
  canShare?: (data: ShareData) => boolean;
};

type ShareMediaButtonProps = {
  url: string;
  title?: string;
  text?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  onShared?: () => void | Promise<void>;
};

function getShareableUrl(url: string) {
  if (typeof window === 'undefined') return url;

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export function ShareMediaButton({
  url,
  title = 'Compartir foto',
  text,
  label = 'Compartir foto',
  compact = true,
  className = '',
  onShared
}: ShareMediaButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async (shareUrl: string) => {
    await navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const shareUrl = getShareableUrl(url);
    const shareData: ShareData = {
      title,
      text,
      url: shareUrl
    };
    const navigatorWithShare = navigator as NavigatorWithShare;

    try {
      if (navigatorWithShare.share && (!navigatorWithShare.canShare || navigatorWithShare.canShare(shareData))) {
        await navigatorWithShare.share(shareData);
      } else {
        await copyLink(shareUrl);
      }
    } catch {
      await copyLink(shareUrl);
    }

    await onShared?.();
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={copied ? 'Link copiado' : label}
      title={copied ? 'Link copiado' : label}
      className={`inline-flex items-center justify-center rounded-md bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-accent active:scale-[0.98] ${compact ? 'h-8 w-8' : 'h-10 w-10'} ${className}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />}
    </button>
  );
}
