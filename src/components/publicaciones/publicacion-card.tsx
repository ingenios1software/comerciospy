"use client";

import Link from 'next/link';
import { BadgePercent, CheckCircle2, Flame, Heart, MapPin, MessageCircle, ShieldCheck, Sparkles, Star, Store } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CartButton } from '@/components/cart/cart-button';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { PublicacionPreviewModal, type PublicationPreviewItem } from '@/components/publicaciones/publicacion-preview-modal';
import { ShareMediaButton } from '@/components/ui/share-media-button';
import { useAuth } from '@/lib/firebase/auth-context';
import { markPublicationAsSold } from '@/lib/firebase/firestore';
import { getPublicationEngagement, likePublication } from '@/lib/publication-engagement';
import { isSubscriptionExpired } from '@/lib/subscription';
import type { Comercio, Publicacion } from '@/types';
import { buildWhatsappUrl } from '@/lib/utils/format';
import {
  buildPublicationWhatsappMessage,
  formatPublicationPrice,
  getPublicationAnchorId,
  getPublicationCode,
  getPublicationHref,
  getPublicationLocationLabel,
  getPublicationMediaUrl
} from '@/lib/publications';
import { formatDistanceKm, getDistanceKm, type UserLocation } from '@/lib/location';
import { isBusinessOpenNow } from '@/lib/business-status';

type PublicacionCommerce = Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> &
  Partial<Pick<Comercio, 'ciudad' | 'barrio' | 'direccion' | 'ubicacion' | 'verificado' | 'valoracion' | 'horario' | 'destacado' | 'planNombre'>>;

type PublicacionCardProps = {
  publicacion: Publicacion;
  comercio?: PublicacionCommerce | null;
  onMarkSold?: (publicacion: Publicacion) => void | Promise<void>;
  markingSold?: boolean;
  variant?: 'default' | 'compact';
  previewItems?: PublicationPreviewItem[];
  userLocation?: UserLocation | null;
};

function formatBadgeCount(value: number) {
  if (value > 99) return '99+';
  return String(Math.max(0, value));
}

function isRecentPublication(value?: string) {
  const createdAt = value ? new Date(value).getTime() : 0;
  if (!Number.isFinite(createdAt)) return false;
  return Date.now() - createdAt <= 1000 * 60 * 60 * 24 * 14;
}

function hasPremiumPlan(planName?: string) {
  const normalized = (planName ?? '').toLowerCase();
  return Boolean(normalized && !normalized.includes('basico'));
}

export function PublicacionCard({ publicacion, comercio, onMarkSold, markingSold = false, variant = 'default', previewItems, userLocation }: PublicacionCardProps) {
  const { user, profile } = useAuth();
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [localMarkingSold, setLocalMarkingSold] = useState(false);
  const [soldLocally, setSoldLocally] = useState(false);
  const [markSoldError, setMarkSoldError] = useState('');
  const [engagementSummary, setEngagementSummary] = useState({ likesCount: 0, commentsCount: 0 });
  const mediaUrl = getPublicationMediaUrl(publicacion);
  const isVideo = publicacion.mediaType === 'video' && Boolean(mediaUrl);
  const compact = variant === 'compact';
  const publicationCode = getPublicationCode(publicacion);
  const publicationHref = getPublicationHref(publicacion);
  const commerceCatalogHref = `/comercios/${comercio?.id ?? publicacion.comercioId}#publicaciones`;
  const commerceName = comercio?.nombre ?? 'Ver comercio';
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://comerciospy.vercel.app';
  const whatsappUrl = buildWhatsappUrl(
    comercio?.whatsapp || comercio?.telefono,
    buildPublicationWhatsappMessage(publicacion, comercio, appOrigin)
  );
  const priceLabel = formatPublicationPrice(publicacion);
  const locationLabel = getPublicationLocationLabel(publicacion, comercio);
  const distanceLabel = formatDistanceKm(getDistanceKm(userLocation, comercio?.ubicacion));
  const isOpenNow = publicacion.etiquetas?.includes('abierto') || isBusinessOpenNow(comercio?.horario);
  const isFeatured = Boolean(publicacion.destacado || publicacion.etiquetas?.includes('destacado') || comercio?.destacado || hasPremiumPlan(comercio?.planNombre));
  const isOffer = publicacion.tipo === 'oferta' || publicacion.etiquetas?.includes('oferta');
  const isNew = publicacion.tipo === 'novedad' || publicacion.etiquetas?.includes('nuevo') || isRecentPublication(publicacion.creadoEn);
  const hasVisualBadges = isOpenNow || isFeatured || isOffer || isNew;
  const ratingValue = comercio?.valoracion?.promedio;
  const hasRating = Number.isFinite(ratingValue);
  const isVerified = Boolean(comercio?.verificado);
  const roundedRating = Math.round(ratingValue ?? 0);
  const cartItem = {
    id: publicacion.id,
    code: publicationCode,
    title: publicacion.titulo,
    subtitle: `${publicacion.tipo} - ${publicacion.ciudad}`,
    href: publicationHref,
    imageUrl: mediaUrl,
    price: publicacion.precio,
    priceLabel,
    comercioId: publicacion.comercioId,
    comercioNombre: comercio?.nombre,
    whatsapp: comercio?.whatsapp,
    telefono: comercio?.telefono
  };
  const modalPreviewItems = useMemo<PublicationPreviewItem[]>(
    () => (previewItems?.length ? previewItems : [{ publicacion, comercio }]),
    [comercio, previewItems, publicacion]
  );
  const openPreview = () => {
    const itemIndex = modalPreviewItems.findIndex((item) => item.publicacion.id === publicacion.id);
    setActivePreviewIndex(itemIndex >= 0 ? itemIndex : 0);
  };
  const canMarkSoldAsOwner = (item: Publicacion) => {
    const commerceOwnerId = profile?.comercioId ?? user?.uid;
    return profile?.rol === 'comercio' && commerceOwnerId === item.comercioId && !isSubscriptionExpired(profile);
  };
  const canMarkSoldForPublication = (item: Publicacion) => Boolean(onMarkSold) || canMarkSoldAsOwner(item);
  const canMarkSold = canMarkSoldForPublication(publicacion);
  const canMarkSoldInPreview = modalPreviewItems.some((item) => canMarkSoldForPublication(item.publicacion));
  const isMarkingSold = markingSold || localMarkingSold;

  useEffect(() => {
    let active = true;

    getPublicationEngagement(publicacion.id)
      .then((data) => {
        if (!active) return;
        setEngagementSummary({
          likesCount: data.likesCount,
          commentsCount: data.commentsCount
        });
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [publicacion.id]);

  const handleFavoriteAdded = async () => {
    try {
      const result = await likePublication(publicacion.id);
      if (result.added) {
        setEngagementSummary((current) => ({
          ...current,
          likesCount: current.likesCount + 1
        }));
      }
    } catch {
      // The favorite still works locally if the public counter cannot be saved.
    }
  };

  const handleMarkSold = async (targetPublicacion = publicacion) => {
    setMarkSoldError('');

    if (onMarkSold) {
      await onMarkSold(targetPublicacion);
      return;
    }

    setLocalMarkingSold(true);
    try {
      await markPublicationAsSold(targetPublicacion.id);
      if (targetPublicacion.id === publicacion.id) {
        setSoldLocally(true);
      } else {
        setActivePreviewIndex(null);
      }
    } catch {
      setMarkSoldError('No se pudo marcar como vendido.');
    } finally {
      setLocalMarkingSold(false);
    }
  };

  if (soldLocally) return null;

  return (
    <>
      <article id={getPublicationAnchorId(publicacion)} className={`scroll-mt-24 overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft ${compact ? 'rounded-md' : 'rounded-2xl'}`}>
        <div className={`relative overflow-hidden bg-slate-100 ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {isVideo ? (
            <button
              type="button"
              onClick={openPreview}
              className="group h-full w-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
              aria-label={`Ver video de ${publicacion.titulo}`}
            >
              <video src={mediaUrl} className="h-full w-full bg-black object-cover transition duration-500 group-hover:scale-105" muted playsInline preload="metadata" />
            </button>
          ) : mediaUrl ? (
            <button
              type="button"
              onClick={openPreview}
              className="group h-full w-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-inset"
              aria-label={`Ver publicacion de ${publicacion.titulo}`}
            >
              <img src={mediaUrl} alt={publicacion.titulo} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            </button>
          ) : (
            <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft">
                <BadgePercent className="h-6 w-6" />
              </div>
            </div>
          )}
          <div className={`absolute flex items-center justify-between gap-1.5 ${compact ? 'left-1 right-1 top-1' : 'left-2 right-2 top-2'}`}>
            <div className="flex min-w-0 items-center gap-1">
              <span className="relative inline-flex" aria-label={`${engagementSummary.likesCount} me gusta`}>
                <FavoriteButton
                  compact={compact}
                  minimal
                  item={{
                    kind: 'publicacion',
                    id: publicacion.id,
                    title: publicacion.titulo,
                    subtitle: `${publicacion.tipo} - ${publicacion.ciudad}`,
                    href: publicationHref,
                    imageUrl: mediaUrl
                  }}
                  onFavoriteAdded={() => void handleFavoriteAdded()}
                />
                <span className="pointer-events-none absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[8px] font-black leading-none text-accent shadow-sm ring-1 ring-red-100">
                  {formatBadgeCount(engagementSummary.likesCount)}
                </span>
              </span>
              <CartButton item={cartItem} compact minimal />
            </div>
            {whatsappUrl !== '#' ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 font-semibold text-white shadow-sm ring-1 ring-emerald-500/20 transition hover:bg-emerald-700 active:scale-[0.98] ${compact ? 'h-7 px-1.5 text-[10px]' : 'h-8 px-2 text-[11px]'}`}
                aria-label={`Consultar por ${publicacion.titulo} en WhatsApp`}
              >
                <MessageCircle className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                Lo quiero
              </a>
            ) : null}
          </div>
          {hasVisualBadges ? (
            <div className={`absolute z-10 flex max-w-[calc(100%_-_0.5rem)] flex-wrap gap-1 ${compact ? 'left-1 top-9' : 'left-2 top-12'}`}>
              {isOpenNow ? (
                <span className={`inline-flex items-center gap-1 rounded bg-emerald-600 font-black text-white shadow-sm ${compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Abierto ahora
                </span>
              ) : null}
              {isFeatured ? (
                <span className={`inline-flex items-center gap-1 rounded bg-amber-300 font-black text-slate-950 shadow-sm ${compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                  <Star className={compact ? 'h-2.5 w-2.5 fill-current' : 'h-3 w-3 fill-current'} />
                  Destacado
                </span>
              ) : null}
              {isOffer ? (
                <span className={`inline-flex items-center gap-1 rounded bg-red-600 font-black text-white shadow-sm ${compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                  <Flame className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                  Oferta
                </span>
              ) : null}
              {isNew ? (
                <span className={`inline-flex items-center gap-1 rounded bg-sky-600 font-black text-white shadow-sm ${compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'}`}>
                  <Sparkles className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                  Nuevo
                </span>
              ) : null}
            </div>
          ) : null}
          {mediaUrl ? (
            <>
              <Link
                href={commerceCatalogHref}
                className={`absolute bottom-1 left-1 inline-flex max-w-[calc(100%_-_2.75rem)] items-center gap-1 rounded bg-slate-950/70 font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-slate-950/90 focus:outline-none focus:ring-2 focus:ring-white ${compact ? 'h-6 px-1.5 text-[9px]' : 'bottom-2 left-2 h-7 px-2 text-[11px]'}`}
                aria-label={`Ver catalogo completo de ${commerceName}`}
              >
                <Store className={compact ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
                <span className="truncate">{commerceName}</span>
              </Link>
              <ShareMediaButton
                url={publicationHref}
                title="ComerciosPY"
                text="Mira este articulo en ComerciosPY."
                label={`Compartir articulo: ${publicacion.titulo}`}
                minimal
                className={compact ? 'absolute bottom-1 right-1' : 'absolute bottom-2 right-2'}
              />
            </>
          ) : null}
        </div>
        <div className={compact ? 'space-y-1.5 p-2' : 'space-y-3 p-4'}>
          <div className={`flex items-center justify-between gap-2 font-semibold ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span className={`truncate rounded bg-red-50 uppercase text-accent ring-1 ring-red-100 ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1 tracking-[0.14em]'}`}>{publicacion.tipo}</span>
            <span className="shrink-0 text-slate-500">#{publicationCode}</span>
          </div>
          <div>
            <h3 className={`line-clamp-2 font-semibold text-slate-950 ${compact ? 'text-[12px] leading-4' : 'text-base'}`}>{publicacion.titulo}</h3>
            {compact ? null : <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{publicacion.descripcion}</p>}
          </div>
          {locationLabel || distanceLabel ? (
            <div className={`flex min-w-0 items-center gap-1 font-semibold text-slate-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              <MapPin className={compact ? 'h-3 w-3 shrink-0 text-accent' : 'h-3.5 w-3.5 shrink-0 text-accent'} />
              <span className="truncate">{distanceLabel ? `${distanceLabel} - ${locationLabel}` : locationLabel}</span>
            </div>
          ) : null}
          {hasRating || isVerified ? (
            <div className={`flex min-w-0 flex-wrap items-center gap-1.5 font-semibold ${compact ? 'text-[9px]' : 'text-xs'}`}>
              {hasRating ? (
                <span className="inline-flex min-w-0 items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-amber-700 ring-1 ring-amber-100">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={`${compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} ${index < roundedRating ? 'fill-current text-amber-500' : 'text-amber-200'}`}
                    />
                  ))}
                  <span className="ml-0.5">{ratingValue?.toFixed(1)}</span>
                </span>
              ) : null}
              {isVerified ? (
                <span className="inline-flex min-w-0 items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className={compact ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
                  <span className="truncate">Comercio verificado</span>
                </span>
              ) : null}
            </div>
          ) : null}
          <div className={`flex items-center gap-1.5 text-slate-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center text-slate-700" aria-label={`${engagementSummary.commentsCount} comentarios`} role="img">
              <MessageCircle className="h-6 w-6 fill-white stroke-current" />
              <span className="absolute inset-0 flex items-center justify-center pb-0.5 text-[8px] font-black leading-none">{formatBadgeCount(engagementSummary.commentsCount)}</span>
            </span>
          </div>
          <div className={`flex items-center justify-between gap-2 text-slate-500 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            <span className="truncate font-semibold text-slate-900">{priceLabel}</span>
            <span className={`truncate bg-slate-100 font-semibold text-slate-600 ${compact ? 'rounded px-1.5 py-0.5 text-[10px]' : 'rounded-full px-3 py-1 text-xs'}`}>{publicacion.categoria}</span>
          </div>
          {canMarkSold ? (
            <button
              type="button"
              onClick={() => void handleMarkSold(publicacion)}
              disabled={isMarkingSold}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isMarkingSold ? 'Marcando...' : 'Vendido'}
            </button>
          ) : null}
          {markSoldError ? <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-accent">{markSoldError}</p> : null}
        </div>
      </article>
      {activePreviewIndex !== null ? (
        <PublicacionPreviewModal
          publicacion={publicacion}
          comercio={comercio}
          items={modalPreviewItems}
          activeIndex={activePreviewIndex}
          onChange={setActivePreviewIndex}
          canMarkSold={canMarkSoldForPublication}
          onMarkSold={canMarkSoldInPreview ? handleMarkSold : undefined}
          markingSold={isMarkingSold}
          userLocation={userLocation}
          onClose={() => setActivePreviewIndex(null)}
        />
      ) : null}
    </>
  );
}
