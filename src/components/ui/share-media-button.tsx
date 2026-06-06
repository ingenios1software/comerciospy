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
  minimal?: boolean;
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
  minimal = false,
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
      className={`inline-flex items-center justify-center rounded-md transition focus:outline-none focus-visible:ring-2 active:scale-[0.96] ${
        minimal
          ? 'h-8 w-8 bg-transparent text-white hover:text-sky-200 focus-visible:ring-white'
          : `bg-white/95 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-accent ${compact ? 'h-8 w-8' : 'h-10 w-10'}`
      } ${className}`}
    >
      {copied ? (
        <Check className={`${minimal ? 'h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(15,23,42,0.95)]' : 'h-3.5 w-3.5'} text-emerald-400`} />
      ) : (
        <Share2 className={minimal ? 'h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(15,23,42,0.95)]' : compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      )}
    </button>
  );
}
