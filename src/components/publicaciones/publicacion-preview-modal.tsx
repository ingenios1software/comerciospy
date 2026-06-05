"use client";

import { type FormEvent, type TouchEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Heart, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { CartButton } from '@/components/cart/cart-button';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import {
  addPublicationComment,
  getPublicationEngagement,
  hasLikedPublication,
  likePublication
} from '@/lib/publication-engagement';
import { buildPublicationWhatsappMessage, getPublicationCode, getPublicationHref, getPublicationMediaUrl } from '@/lib/publications';
import { buildWhatsappUrl, formatPrice } from '@/lib/utils/format';
import type { CartItem } from '@/lib/cart';
import type { Comercio, PublicationComment, PublicationEngagement, Publicacion } from '@/types';

type PublicationPreviewCommerce = Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'>;

export type PublicationPreviewItem = {
  publicacion: Publicacion;
  comercio?: PublicationPreviewCommerce | null;
};

type PublicationPreviewModalProps = {
  publicacion: Publicacion;
  comercio?: PublicationPreviewCommerce | null;
  items?: PublicationPreviewItem[];
  activeIndex?: number;
  onChange?: (index: number) => void;
  canMarkSold?: (publicacion: Publicacion) => boolean;
  onMarkSold?: (publicacion: Publicacion) => void | Promise<void>;
  markingSold?: boolean;
  onClose: () => void;
};

function formatCommentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit' });
}

function getInitialEngagement(publicationId: string): PublicationEngagement {
  return {
    publicationId,
    likesCount: 0,
    commentsCount: 0,
    comentarios: []
  };
}

export function PublicacionPreviewModal({
  publicacion,
  comercio,
  items,
  activeIndex = 0,
  onChange,
  canMarkSold,
  onMarkSold,
  markingSold = false,
  onClose
}: PublicationPreviewModalProps) {
  const previewItems = useMemo<PublicationPreviewItem[]>(
    () => (items?.length ? items : [{ publicacion, comercio }]),
    [comercio, items, publicacion]
  );
  const currentIndex = Math.min(Math.max(activeIndex, 0), Math.max(previewItems.length - 1, 0));
  const activeItem = previewItems[currentIndex] ?? { publicacion, comercio };
  const activePublicacion = activeItem.publicacion;
  const activeComercio = activeItem.comercio ?? null;
  const canNavigate = previewItems.length > 1;
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const mediaUrl = getPublicationMediaUrl(activePublicacion);
  const isVideo = activePublicacion.mediaType === 'video' && Boolean(mediaUrl);
  const publicationCode = getPublicationCode(activePublicacion);
  const publicationHref = getPublicationHref(activePublicacion);
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://comerciospy.vercel.app';
  const whatsappUrl = buildWhatsappUrl(
    activeComercio?.whatsapp || activeComercio?.telefono,
    buildPublicationWhatsappMessage(activePublicacion, activeComercio, appOrigin)
  );
  const showMarkSold = Boolean(onMarkSold && (!canMarkSold || canMarkSold(activePublicacion)));
  const [engagement, setEngagement] = useState<PublicationEngagement>(() => getInitialEngagement(activePublicacion.id));
  const [liked, setLiked] = useState(() => hasLikedPublication(activePublicacion.id));
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [liking, setLiking] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [interactionError, setInteractionError] = useState('');

  const cartItem: Omit<CartItem, 'savedAt'> = useMemo(
    () => ({
      id: activePublicacion.id,
      code: publicationCode,
      title: activePublicacion.titulo,
      subtitle: `${activePublicacion.tipo} - ${activePublicacion.ciudad}`,
      href: publicationHref,
      imageUrl: mediaUrl,
      price: activePublicacion.precio,
      comercioId: activePublicacion.comercioId,
      comercioNombre: activeComercio?.nombre,
      whatsapp: activeComercio?.whatsapp,
      telefono: activeComercio?.telefono
    }),
    [
      activeComercio?.nombre,
      activeComercio?.telefono,
      activeComercio?.whatsapp,
      activePublicacion,
      mediaUrl,
      publicationCode,
      publicationHref
    ]
  );

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (!canNavigate) return;
      const normalizedIndex = (nextIndex + previewItems.length) % previewItems.length;
      onChange?.(normalizedIndex);
    },
    [canNavigate, onChange, previewItems.length]
  );

  const goPrevious = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const goNext = useCallback(() => {
    goToIndex(currentIndex + 1);
  }, [currentIndex, goToIndex]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!canNavigate) return;
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!canNavigate || touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;

    if (deltaX < 0) {
      goNext();
    } else {
      goPrevious();
    }
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goNext, goPrevious, onClose]);

  useEffect(() => {
    let active = true;
    setLoadingEngagement(true);
    setInteractionError('');
    setEngagement(getInitialEngagement(activePublicacion.id));
    setLiked(hasLikedPublication(activePublicacion.id));
    setCommentText('');

    getPublicationEngagement(activePublicacion.id)
      .then((data) => {
        if (active) setEngagement(data);
      })
      .catch(() => {
        if (active) setInteractionError('No pudimos cargar me gusta y comentarios.');
      })
      .finally(() => {
        if (active) setLoadingEngagement(false);
      });

    return () => {
      active = false;
    };
  }, [activePublicacion.id]);

  const handleLike = async () => {
    setInteractionError('');
    setLiking(true);

    try {
      const result = await likePublication(activePublicacion.id);
      setLiked(true);
      if (result.added) {
        setEngagement((current) => ({
          ...current,
          likesCount: current.likesCount + 1
        }));
      }
    } catch {
      setInteractionError('No pudimos guardar tu me gusta.');
    } finally {
      setLiking(false);
    }
  };

  const handleSubmitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInteractionError('');
    setCommenting(true);

    try {
      const comment = await addPublicationComment(activePublicacion.id, {
        nombre: commentName,
        texto: commentText
      });
      setEngagement((current) => ({
        ...current,
        commentsCount: current.commentsCount + 1,
        comentarios: [comment, ...current.comentarios].slice(0, 20)
      }));
      setCommentText('');
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : 'No pudimos guardar el comentario.');
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 px-3 py-4 sm:px-5 sm:py-6" onClick={onClose}>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-glow" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Publicacion #{publicationCode}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{activeComercio?.nombre ?? activePublicacion.ciudad}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canNavigate ? (
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                {currentIndex + 1}/{previewItems.length}
              </span>
            ) : null}
            <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Cerrar vista de publicacion">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative touch-pan-y bg-slate-100" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {isVideo ? (
            <video key={activePublicacion.id} src={mediaUrl} className="max-h-[56vh] w-full bg-black object-contain" controls playsInline preload="metadata" />
          ) : mediaUrl ? (
            <img key={activePublicacion.id} src={mediaUrl} alt={activePublicacion.titulo} className="max-h-[56vh] w-full select-none object-contain" draggable={false} />
          ) : (
            <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-400">Sin imagen</div>
          )}
          {canNavigate ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-soft ring-1 ring-slate-200 transition hover:bg-white sm:left-4 sm:h-11 sm:w-11"
                aria-label="Ver publicacion anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-soft ring-1 ring-slate-200 transition hover:bg-white sm:right-4 sm:h-11 sm:w-11"
                aria-label="Ver siguiente publicacion"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded bg-red-50 px-2.5 py-1 uppercase text-accent ring-1 ring-red-100">{activePublicacion.tipo}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-600">{activePublicacion.categoria}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-600">{formatPrice(activePublicacion.precio) || 'Consultar precio'}</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">{activePublicacion.titulo}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{activePublicacion.descripcion}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLike}
                disabled={liking || liked}
                className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed ${
                  liked ? 'bg-red-50 text-accent ring-1 ring-red-100' : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {liking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />}
                {liked ? 'Te gusta' : 'Me gusta'}
              </button>
              <FavoriteButton
                item={{
                  kind: 'publicacion',
                  id: activePublicacion.id,
                  title: activePublicacion.titulo,
                  subtitle: `${activePublicacion.tipo} - ${activePublicacion.ciudad}`,
                  href: publicationHref,
                  imageUrl: mediaUrl
                }}
                label="Guardar"
                onFavoriteAdded={() => void handleLike()}
              />
              <CartButton item={cartItem} />
              {showMarkSold ? (
                <button
                  type="button"
                  onClick={() => void onMarkSold?.(activePublicacion)}
                  disabled={markingSold}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {markingSold ? 'Marcando...' : 'Vendido'}
                </button>
              ) : null}
              {whatsappUrl !== '#' ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" />
                  Lo quiero
                </a>
              ) : null}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-2xl font-semibold text-slate-950">{loadingEngagement ? '...' : engagement.likesCount}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Me gusta</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-2xl font-semibold text-slate-950">{loadingEngagement ? '...' : engagement.commentsCount}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">Comentarios</p>
              </div>
            </div>

            <form className="rounded-2xl border border-slate-200 bg-slate-50 p-3" onSubmit={handleSubmitComment}>
              <p className="text-sm font-semibold text-slate-950">Comentar</p>
              <input
                value={commentName}
                onChange={(event) => setCommentName(event.target.value)}
                placeholder="Tu nombre (opcional)"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-red-100"
              />
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Escribi tu comentario"
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-red-100"
                required
              />
              <button type="submit" disabled={commenting} className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70">
                {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publicar comentario
              </button>
            </form>

            {interactionError ? <p className="rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{interactionError}</p> : null}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-950">Comentarios recientes</p>
              {engagement.comentarios.length > 0 ? (
                engagement.comentarios.slice(0, 5).map((comment: PublicationComment) => (
                  <article key={comment.id} className="rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-950">{comment.nombre}</p>
                      <span className="shrink-0 text-[11px] font-semibold text-slate-400">{formatCommentDate(comment.creadoEn)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{comment.texto}</p>
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Todavia no hay comentarios.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
