"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Heart, Loader2, MessageCircle, Send, X } from 'lucide-react';
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

type PublicationPreviewModalProps = {
  publicacion: Publicacion;
  comercio?: Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> | null;
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

export function PublicacionPreviewModal({ publicacion, comercio, onClose }: PublicationPreviewModalProps) {
  const mediaUrl = getPublicationMediaUrl(publicacion);
  const isVideo = publicacion.mediaType === 'video' && Boolean(mediaUrl);
  const publicationCode = getPublicationCode(publicacion);
  const publicationHref = getPublicationHref(publicacion);
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://comerciospy.vercel.app';
  const whatsappUrl = buildWhatsappUrl(
    comercio?.whatsapp || comercio?.telefono,
    buildPublicationWhatsappMessage(publicacion, comercio, appOrigin)
  );
  const [engagement, setEngagement] = useState<PublicationEngagement>(() => getInitialEngagement(publicacion.id));
  const [liked, setLiked] = useState(() => hasLikedPublication(publicacion.id));
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  const [liking, setLiking] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [interactionError, setInteractionError] = useState('');

  const cartItem: Omit<CartItem, 'savedAt'> = useMemo(
    () => ({
      id: publicacion.id,
      code: publicationCode,
      title: publicacion.titulo,
      subtitle: `${publicacion.tipo} - ${publicacion.ciudad}`,
      href: publicationHref,
      imageUrl: mediaUrl,
      price: publicacion.precio,
      comercioId: publicacion.comercioId,
      comercioNombre: comercio?.nombre,
      whatsapp: comercio?.whatsapp,
      telefono: comercio?.telefono
    }),
    [comercio?.nombre, comercio?.telefono, comercio?.whatsapp, mediaUrl, publicacion, publicationCode, publicationHref]
  );

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setLoadingEngagement(true);
    setInteractionError('');

    getPublicationEngagement(publicacion.id)
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
  }, [publicacion.id]);

  const handleLike = async () => {
    setInteractionError('');
    setLiking(true);

    try {
      const result = await likePublication(publicacion.id);
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
      const comment = await addPublicationComment(publicacion.id, {
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Publicación #{publicationCode}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-700">{comercio?.nombre ?? publicacion.ciudad}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200" aria-label="Cerrar vista de publicación">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-100">
          {isVideo ? (
            <video src={mediaUrl} className="max-h-[56vh] w-full bg-black object-contain" controls playsInline preload="metadata" />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt={publicacion.titulo} className="max-h-[56vh] w-full object-contain" />
          ) : (
            <div className="flex min-h-72 items-center justify-center text-sm font-semibold text-slate-400">Sin imagen</div>
          )}
        </div>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded bg-red-50 px-2.5 py-1 uppercase text-accent ring-1 ring-red-100">{publicacion.tipo}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-600">{publicacion.categoria}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-600">{formatPrice(publicacion.precio) || 'Consultar precio'}</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-950">{publicacion.titulo}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{publicacion.descripcion}</p>

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
                  id: publicacion.id,
                  title: publicacion.titulo,
                  subtitle: `${publicacion.tipo} - ${publicacion.ciudad}`,
                  href: publicationHref,
                  imageUrl: mediaUrl
                }}
                label="Guardar"
                onFavoriteAdded={() => void handleLike()}
              />
              <CartButton item={cartItem} />
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
                placeholder="Escribí tu comentario"
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
                <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">Todavía no hay comentarios.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
