"use client";

import { BadgePercent, CheckCircle2, MessageCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CartButton } from '@/components/cart/cart-button';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { PublicacionPreviewModal, type PublicationPreviewItem } from '@/components/publicaciones/publicacion-preview-modal';
import { ShareMediaButton } from '@/components/ui/share-media-button';
import { useAuth } from '@/lib/firebase/auth-context';
import { markPublicationAsSold } from '@/lib/firebase/firestore';
import { likePublication } from '@/lib/publication-engagement';
import { isSubscriptionExpired } from '@/lib/subscription';
import type { Comercio, Publicacion } from '@/types';
import { buildWhatsappUrl, formatPrice } from '@/lib/utils/format';
import { buildPublicationWhatsappMessage, getPublicationAnchorId, getPublicationCode, getPublicationHref, getPublicationMediaUrl } from '@/lib/publications';

type PublicacionCardProps = {
  publicacion: Publicacion;
  comercio?: Pick<Comercio, 'id' | 'nombre' | 'whatsapp' | 'telefono'> | null;
  onMarkSold?: (publicacion: Publicacion) => void | Promise<void>;
  markingSold?: boolean;
  variant?: 'default' | 'compact';
  previewItems?: PublicationPreviewItem[];
};

export function PublicacionCard({ publicacion, comercio, onMarkSold, markingSold = false, variant = 'default', previewItems }: PublicacionCardProps) {
  const { user, profile } = useAuth();
  const [activePreviewIndex, setActivePreviewIndex] = useState<number | null>(null);
  const [localMarkingSold, setLocalMarkingSold] = useState(false);
  const [soldLocally, setSoldLocally] = useState(false);
  const [markSoldError, setMarkSoldError] = useState('');
  const mediaUrl = getPublicationMediaUrl(publicacion);
  const isVideo = publicacion.mediaType === 'video' && Boolean(mediaUrl);
  const compact = variant === 'compact';
  const publicationCode = getPublicationCode(publicacion);
  const publicationHref = getPublicationHref(publicacion);
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://comerciospy.vercel.app';
  const whatsappUrl = buildWhatsappUrl(
    comercio?.whatsapp || comercio?.telefono,
    buildPublicationWhatsappMessage(publicacion, comercio, appOrigin)
  );
  const cartItem = {
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
                onFavoriteAdded={() => void likePublication(publicacion.id)}
              />
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
          {mediaUrl ? (
            <ShareMediaButton
              url={publicationHref}
              title="ComerciosPY"
              text="Mira este articulo en ComerciosPY."
              label={`Compartir articulo: ${publicacion.titulo}`}
              minimal
              className={compact ? 'absolute bottom-1 right-1' : 'absolute bottom-2 right-2'}
            />
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
          <div className={`flex items-center justify-between gap-2 text-slate-500 ${compact ? 'text-[11px]' : 'text-sm'}`}>
            <span className="truncate font-semibold text-slate-900">{formatPrice(publicacion.precio) || 'Consultar'}</span>
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
          onClose={() => setActivePreviewIndex(null)}
        />
      ) : null}
    </>
  );
}
