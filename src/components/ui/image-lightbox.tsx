"use client";

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect } from 'react';

export type LightboxImage = {
  src: string;
  alt: string;
};

type ImageLightboxProps = {
  images: LightboxImage[];
  activeIndex: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
};

function getWrappedIndex(index: number, length: number) {
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
}

export function ImageLightbox({ images, activeIndex, onChange, onClose }: ImageLightboxProps) {
  const activeImage = activeIndex === null ? null : images[activeIndex] ?? null;
  const hasManyImages = images.length > 1;

  useEffect(() => {
    if (!activeImage || activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key === 'ArrowLeft' && hasManyImages) {
        onChange(getWrappedIndex(activeIndex - 1, images.length));
      }

      if (event.key === 'ArrowRight' && hasManyImages) {
        onChange(getWrappedIndex(activeIndex + 1, images.length));
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImage, activeIndex, hasManyImages, images.length, onChange, onClose]);

  if (!activeImage || activeIndex === null) return null;

  const showPrevious = () => onChange(getWrappedIndex(activeIndex - 1, images.length));
  const showNext = () => onChange(getWrappedIndex(activeIndex + 1, images.length));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:right-5 sm:top-5"
        aria-label="Cerrar imagen ampliada"
      >
        <X className="h-5 w-5" />
      </button>

      {hasManyImages ? (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showPrevious();
            }}
            className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:left-5"
            aria-label="Ver imagen anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              showNext();
            }}
            className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-soft transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:right-5"
            aria-label="Ver imagen siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <div className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        <img src={activeImage.src} alt={activeImage.alt} className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-glow" />
        {hasManyImages ? (
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-soft">
            {activeIndex + 1} / {images.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
