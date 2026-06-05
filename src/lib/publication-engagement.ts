"use client";

import { arrayUnion, doc, getDoc, increment, setDoc } from 'firebase/firestore';
import { getFirestoreInstance } from '@/lib/firebase/firestore';
import type { PublicationComment, PublicationEngagement } from '@/types';

const publicationLikesStorageKey = 'comerciospy:publication-likes:v1';

function getEngagementRef(publicationId: string) {
  return doc(getFirestoreInstance(), 'publicacionInteracciones', publicationId);
}

function readLikedPublicationIds() {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(publicationLikesStorageKey) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

function writeLikedPublicationIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(publicationLikesStorageKey, JSON.stringify(Array.from(ids)));
}

export function hasLikedPublication(publicationId: string) {
  return readLikedPublicationIds().has(publicationId);
}

function markPublicationLiked(publicationId: string) {
  const ids = readLikedPublicationIds();
  ids.add(publicationId);
  writeLikedPublicationIds(ids);
}

function normalizeEngagement(publicationId: string, value: Partial<PublicationEngagement> | undefined): PublicationEngagement {
  const comentarios = Array.isArray(value?.comentarios)
    ? value.comentarios
        .filter((comment): comment is PublicationComment => Boolean(comment?.id && comment?.texto))
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
        .slice(0, 20)
    : [];

  return {
    publicationId,
    likesCount: Number(value?.likesCount ?? 0),
    commentsCount: Number(value?.commentsCount ?? comentarios.length),
    comentarios,
    actualizadoEn: value?.actualizadoEn
  };
}

export async function getPublicationEngagement(publicationId: string) {
  const snapshot = await getDoc(getEngagementRef(publicationId));
  return normalizeEngagement(publicationId, snapshot.exists() ? (snapshot.data() as Partial<PublicationEngagement>) : undefined);
}

export async function likePublication(publicationId: string) {
  if (hasLikedPublication(publicationId)) {
    return { added: false };
  }

  await setDoc(
    getEngagementRef(publicationId),
    {
      publicationId,
      likesCount: increment(1),
      actualizadoEn: new Date().toISOString()
    },
    { merge: true }
  );
  markPublicationLiked(publicationId);
  return { added: true };
}

export async function addPublicationComment(publicationId: string, input: { nombre?: string; texto: string }) {
  const texto = input.texto.trim().slice(0, 360);
  const nombre = (input.nombre?.trim() || 'Visitante').slice(0, 60);

  if (!texto) {
    throw new Error('Escribí un comentario.');
  }

  const comment: PublicationComment = {
    id: crypto.randomUUID(),
    nombre,
    texto,
    creadoEn: new Date().toISOString()
  };

  await setDoc(
    getEngagementRef(publicationId),
    {
      publicationId,
      commentsCount: increment(1),
      comentarios: arrayUnion(comment),
      actualizadoEn: new Date().toISOString()
    },
    { merge: true }
  );

  return comment;
}
