"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Loader2, Scissors, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { uploadFile } from '@/lib/firebase/storage';
import { createPublication, getComercioById } from '@/lib/firebase/firestore';
import { publicationCategories } from '@/lib/categories';
import { RenewalNotice } from '@/components/subscription/renewal-notice';
import { CategorySelectField } from '@/components/ui/category-select-field';
import { isSubscriptionExpired } from '@/lib/subscription';
import type { AiPublicationSuggestion, Comercio, Publicacion } from '@/types';

type AiResponse = {
  suggestion?: AiPublicationSuggestion;
  error?: string;
};

type BackgroundRemovalResponse = {
  image?: string;
  mimeType?: string;
  error?: string;
};

type MediaKind = 'image' | 'video';

type ModerationResponse = {
  approved?: boolean;
  flaggedCategories?: string[];
  error?: string;
};

type ModerationResult = {
  status: NonNullable<Publicacion['moderacionEstado']>;
};

const supportedPublicationImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const supportedPublicationImageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const supportedPublicationVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
const supportedPublicationVideoExtensions = ['.mp4', '.webm', '.mov'];
const maxAiImageBytes = 8 * 1024 * 1024;
const maxPublicationVideoBytes = 25 * 1024 * 1024;
const maxPublicationVideoSeconds = 20;
const maxPublicationImageDimension = 1600;
const publicationImageQuality = 0.86;
const skippableModerationStatuses = [401, 429, 503];

function getFileExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] ?? '';
}

function isHeicImage(file: File) {
  const extension = getFileExtension(file.name);
  return file.type === 'image/heic' || file.type === 'image/heif' || extension === '.heic' || extension === '.heif';
}

function isSupportedPublicationImage(file: File) {
  const extension = getFileExtension(file.name);
  return supportedPublicationImageTypes.includes(file.type) || supportedPublicationImageExtensions.includes(extension);
}

function isSupportedPublicationVideo(file: File) {
  const extension = getFileExtension(file.name);
  return supportedPublicationVideoTypes.includes(file.type) || supportedPublicationVideoExtensions.includes(extension);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('No pudimos leer esta foto. Usa JPG, PNG o WebP.'));
    };

    image.src = imageUrl;
  });
}

function loadVideoMetadata(file: File) {
  return new Promise<{ duration: number }>((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(videoUrl);
      resolve({ duration: video.duration });
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error('No pudimos leer este video. Usa MP4, WebM o MOV corto.'));
    };

    video.src = videoUrl;
  });
}

function waitForVideoSeek(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('No pudimos revisar este video. Intenta con otro archivo.'));
    }, 8000);

    video.onseeked = () => {
      window.clearTimeout(timeout);
      resolve();
    };

    video.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error('No pudimos revisar este video. Intenta con otro archivo.'));
    };

    video.currentTime = time;
  });
}

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*?);base64/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mimeType, lastModified: Date.now() });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No pudimos leer el archivo para revisarlo.'));
    reader.readAsDataURL(file);
  });
}

async function extractVideoFrames(file: File, frameCount = 5) {
  const metadata = await loadVideoMetadata(file);
  const video = document.createElement('video');
  const videoUrl = URL.createObjectURL(file);
  const duration = Math.max(0, metadata.duration);
  const times = Array.from({ length: frameCount }, (_, index) => {
    if (frameCount === 1) return Math.min(duration, 0.1);
    const rawTime = (duration * index) / (frameCount - 1);
    return Math.min(Math.max(rawTime, 0.1), Math.max(duration - 0.1, 0.1));
  });

  try {
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('No pudimos revisar este video. Usa MP4, WebM o MOV corto.'));
    });

    const canvas = document.createElement('canvas');
    const largestSide = Math.max(video.videoWidth, video.videoHeight);
    const scale = largestSide > 640 ? 640 / largestSide : 1;
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('No pudimos revisar este video. Intenta con otro archivo.');
    }

    const frames: string[] = [];
    for (const time of times) {
      await waitForVideoSeek(video, time);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.76));
    }

    return frames;
  } finally {
    URL.revokeObjectURL(videoUrl);
  }
}

function getResizedDimensions(width: number, height: number) {
  const largestSide = Math.max(width, height);
  const scale = largestSide > maxPublicationImageDimension ? maxPublicationImageDimension / largestSide : 1;

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

function canvasToJpegBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No pudimos preparar esta foto. Usa JPG, PNG o WebP.'));
        }
      },
      'image/jpeg',
      publicationImageQuality
    );
  });
}

async function preparePublicationImage(file: File) {
  if (isHeicImage(file)) {
    throw new Error('Ese formato de foto no es compatible. En iPhone, cambia la camara a JPG o elegi una foto JPG, PNG o WebP.');
  }

  if (!isSupportedPublicationImage(file)) {
    throw new Error('Formato no compatible. Usa una foto JPG, PNG o WebP.');
  }

  const image = await loadImage(file);
  const size = getResizedDimensions(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No pudimos preparar esta foto. Intenta con otra imagen.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image, 0, 0, size.width, size.height);

  const blob = await canvasToJpegBlob(canvas);
  if (blob.size > maxAiImageBytes) {
    throw new Error('La foto sigue siendo muy pesada. Intenta con otra imagen mas liviana.');
  }

  const fileName = `${file.name.replace(/\.[^.]+$/, '') || 'publicacion'}.jpg`;

  return new File([blob], fileName, {
    type: 'image/jpeg',
    lastModified: Date.now()
  });
}

async function removeImageBackground(file: File) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/ai/quitar-fondo', {
    method: 'POST',
    body: formData
  });
  const data = (await response.json().catch(() => null)) as BackgroundRemovalResponse | null;

  if (!response.ok || !data?.image) {
    throw new Error(data?.error ?? 'No pudimos quitar el fondo de la foto.');
  }

  const mimeType = data.mimeType === 'image/png' ? 'image/png' : 'image/webp';
  const extension = mimeType === 'image/png' ? 'png' : 'webp';
  const fileName = `${file.name.replace(/\.[^.]+$/, '') || 'publicacion'}-sin-fondo.${extension}`;

  return dataUrlToFile(`data:${mimeType};base64,${data.image}`, fileName);
}

async function preparePublicationVideo(file: File) {
  if (!isSupportedPublicationVideo(file)) {
    throw new Error('Formato no compatible. Usa un video MP4, WebM o MOV.');
  }

  if (file.size > maxPublicationVideoBytes) {
    throw new Error('El video no puede superar 25 MB.');
  }

  const metadata = await loadVideoMetadata(file);
  if (!Number.isFinite(metadata.duration) || metadata.duration <= 0) {
    throw new Error('No pudimos leer la duracion del video.');
  }

  if (metadata.duration > maxPublicationVideoSeconds) {
    throw new Error(`El video debe durar hasta ${maxPublicationVideoSeconds} segundos.`);
  }

  return {
    file,
    duration: metadata.duration
  };
}

async function moderatePublicationMedia({
  file,
  mediaKind,
  titulo,
  descripcion,
  categoria,
  tipo
}: {
  file: File;
  mediaKind: MediaKind;
  titulo: string;
  descripcion: string;
  categoria: string;
  tipo: Publicacion['tipo'];
}): Promise<ModerationResult> {
  const frames = mediaKind === 'video' ? await extractVideoFrames(file, 1) : [await fileToDataUrl(file)];
  const text = [`Titulo: ${titulo}`, `Descripcion: ${descripcion}`, `Categoria: ${categoria}`, `Tipo: ${tipo}`].join('\n');

  const response = await fetch('/api/ai/moderar-media', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, frames })
  });
  const data = (await response.json().catch(() => null)) as ModerationResponse | null;

  if (!response.ok) {
    if (skippableModerationStatuses.includes(response.status)) {
      console.warn('Moderacion IS95 no disponible, se publica pendiente de revision.', data?.error ?? response.statusText);
      return { status: 'pending' };
    }

    throw new Error(data?.error ?? 'No pudimos revisar el contenido con IS95.');
  }

  if (!data?.approved) {
    const categories = data?.flaggedCategories?.length ? ` (${data.flaggedCategories.join(', ')})` : '';
    throw new Error(`No podemos publicar este contenido porque la revision IS95 detecto material no permitido${categories}.`);
  }

  return { status: 'approved' };
}

function getFirebasePublishMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : '';

  if (code === 'storage/unauthorized') {
    return 'No tenes permisos para subir la foto. Revisa que las reglas de Storage esten publicadas y que tu usuario este autenticado.';
  }

  if (code.includes('permission-denied')) {
    return 'No tenes permisos para crear esta publicacion. Revisa que tu usuario tenga rol comercio y el comercioId correcto.';
  }

  if (code === 'storage/quota-exceeded') {
    return 'No se pudo subir la foto porque Firebase Storage supero la cuota disponible.';
  }

  if (code === 'storage/retry-limit-exceeded') {
    return 'No se pudo subir la foto por conexion inestable. Intenta nuevamente.';
  }

  if (message) {
    return message;
  }

  return 'No se pudo publicar. Revisa tu conexion o la configuracion de Firebase.';
}

function getAiAnalysisMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const searchable = message.toLowerCase();

  if (searchable.includes('api key') || searchable.includes('openai_api_key') || searchable.includes('vercel')) {
    return 'IS95 no esta disponible por configuracion del servidor. Podes completar el texto manualmente y publicar igual.';
  }

  if (searchable.includes('creditos') || searchable.includes('billing') || searchable.includes('limite mensual')) {
    return 'IS95 no esta disponible por limite de uso. Podes completar el texto manualmente y publicar igual.';
  }

  return message || 'No se pudo analizar la foto.';
}

function getBackgroundRemovalMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const searchable = message.toLowerCase();

  if (searchable.includes('api key') || searchable.includes('openai_api_key') || searchable.includes('vercel')) {
    return 'IS95 no esta disponible por configuracion del servidor. La foto queda sin cambios.';
  }

  if (searchable.includes('creditos') || searchable.includes('billing') || searchable.includes('limite mensual')) {
    return 'IS95 no puede quitar el fondo por limite de uso. La foto queda sin cambios.';
  }

  return message || 'No pudimos quitar el fondo de la foto.';
}

export default function PublicarPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const backgroundRemovalRequestId = useRef(0);
  const subscriptionExpired = profile?.rol === 'comercio' && isSubscriptionExpired(profile);
  const categoryOptions = publicationCategories;
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<Publicacion['tipo']>('producto');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('Servicios');
  const [descripcion, setDescripcion] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaKind, setMediaKind] = useState<MediaKind | null>(null);
  const [originalMediaFile, setOriginalMediaFile] = useState<File | null>(null);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [removingBackground, setRemovingBackground] = useState(false);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiPublicationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparingMedia, setPreparingMedia] = useState(false);
  const [reviewingMedia, setReviewingMedia] = useState(false);

  useEffect(() => {
    const loadCommerce = async () => {
      if (!profile?.comercioId) return;
      try {
        const data = await getComercioById(profile.comercioId);
        setComercio(data);
      } catch {
        setComercio(null);
      }
    };

    loadCommerce();
  }, [profile?.comercioId]);

  const previewUrl = useMemo(() => (mediaFile ? URL.createObjectURL(mediaFile) : ''), [mediaFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const applyBackgroundRemoval = async (file: File) => {
    const requestId = backgroundRemovalRequestId.current + 1;
    backgroundRemovalRequestId.current = requestId;
    setRemovingBackground(true);
    setBackgroundRemoved(false);

    try {
      const cleanFile = await removeImageBackground(file);
      if (backgroundRemovalRequestId.current !== requestId) return;
      setMediaFile(cleanFile);
      setBackgroundRemoved(true);
    } catch (removeError) {
      if (backgroundRemovalRequestId.current !== requestId) return;
      setMediaFile(file);
      setRemoveBackground(false);
      setBackgroundRemoved(false);
      setError(getBackgroundRemovalMessage(removeError));
    } finally {
      if (backgroundRemovalRequestId.current === requestId) {
        setRemovingBackground(false);
      }
    }
  };

  const handleRemoveBackgroundChange = async (checked: boolean) => {
    setError(null);
    setAiSuggestion(null);
    setRemoveBackground(checked);
    setBackgroundRemoved(false);

    if (!checked) {
      backgroundRemovalRequestId.current += 1;
      setRemovingBackground(false);
      if (originalMediaFile) setMediaFile(originalMediaFile);
      return;
    }

    if (mediaKind !== 'image' || !originalMediaFile) return;
    await applyBackgroundRemoval(originalMediaFile);
  };

  const handleAnalyze = async () => {
    setError(null);
    setAiSuggestion(null);

    if (subscriptionExpired) {
      setError('Tu periodo esta vencido. Renova la suscripcion para usar IS95.');
      return;
    }

    if (!mediaFile || !mediaKind) {
      setError('Sube una foto o video para que IS95 pueda analizarlo.');
      return;
    }

    if (removingBackground) {
      setError('Espera a que IS95 termine de quitar el fondo.');
      return;
    }

    setAnalyzing(true);

    try {
      const analysisFile =
        mediaKind === 'video'
          ? dataUrlToFile((await extractVideoFrames(mediaFile, 1))[0], 'fotograma-video.jpg')
          : mediaFile;
      const formData = new FormData();
      formData.append('image', analysisFile);
      formData.append('businessName', comercio?.nombre ?? profile?.nombre ?? '');
      formData.append('businessCategory', comercio?.categoria ?? categoria);
      formData.append('currentTitle', titulo);
      formData.append('currentDescription', descripcion);

      const response = await fetch('/api/ai/publicacion', {
        method: 'POST',
        body: formData
      });
      const data = (await response.json()) as AiResponse;

      if (!response.ok || !data.suggestion) {
        throw new Error(data.error ?? 'No se pudo analizar la foto.');
      }

      setAiSuggestion(data.suggestion);
      setTitulo(data.suggestion.titulo);
      setDescripcion(data.suggestion.descripcion);
      setCategoria(data.suggestion.categoria);
      setTipo(data.suggestion.tipo);
    } catch (err) {
      setError(getAiAnalysisMessage(err));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;

    setError(null);
    setAiSuggestion(null);
    setVideoDuration(null);
    setBackgroundRemoved(false);
    backgroundRemovalRequestId.current += 1;

    if (!selectedFile) {
      setMediaFile(null);
      setMediaKind(null);
      setOriginalMediaFile(null);
      setRemoveBackground(false);
      return;
    }

    setPreparingMedia(true);

    try {
      if (isSupportedPublicationVideo(selectedFile)) {
        const preparedVideo = await preparePublicationVideo(selectedFile);
        setMediaFile(preparedVideo.file);
        setMediaKind('video');
        setOriginalMediaFile(null);
        setRemoveBackground(false);
        setVideoDuration(preparedVideo.duration);
      } else {
        const preparedFile = await preparePublicationImage(selectedFile);
        setMediaFile(preparedFile);
        setMediaKind('image');
        setOriginalMediaFile(preparedFile);
        if (removeBackground) {
          await applyBackgroundRemoval(preparedFile);
        }
      }
    } catch (mediaError) {
      setMediaFile(null);
      setMediaKind(null);
      setOriginalMediaFile(null);
      setRemoveBackground(false);
      setBackgroundRemoved(false);
      setVideoDuration(null);
      event.target.value = '';
      setError(mediaError instanceof Error ? mediaError.message : 'No pudimos preparar este archivo.');
    } finally {
      setPreparingMedia(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (subscriptionExpired) {
      setError('Tu periodo esta vencido. Renova la suscripcion para publicar.');
      setSubmitting(false);
      return;
    }

    if (!user) {
      setError('Debes iniciar sesion antes de publicar.');
      setSubmitting(false);
      return;
    }

    if (removingBackground) {
      setError('Espera a que IS95 termine de quitar el fondo.');
      setSubmitting(false);
      return;
    }

    try {
      const id = crypto.randomUUID();
      setReviewingMedia(true);
      const moderation = mediaFile && mediaKind
        ? await moderatePublicationMedia({
          file: mediaFile,
          mediaKind,
          titulo,
          descripcion,
          categoria,
          tipo
        })
        : { status: 'approved' as const };
      setReviewingMedia(false);

      const mediaUrl = mediaFile ? await uploadFile(`publicaciones/${user.uid}/${id}`, mediaFile) : '';
      const comercioId = profile?.comercioId ?? user.uid;

      await createPublication({
        id,
        comercioId,
        tipo,
        titulo,
        descripcion,
        precio: precio ? Number(precio) : null,
        imagenUrl: mediaKind === 'image' ? mediaUrl : '',
        mediaUrl,
        mediaType: mediaKind ?? 'image',
        ...(mediaKind === 'video' && videoDuration ? { duracionSegundos: Math.round(videoDuration) } : {}),
        moderacionEstado: moderation.status,
        estado: 'disponible',
        categoria,
        ciudad: comercio?.ciudad ?? 'Ciudad',
        activo: true,
        creadoEn: new Date().toISOString()
      });

      router.push('/dashboard');
    } catch (publishError) {
      setError(getFirebasePublishMessage(publishError));
    } finally {
      setReviewingMedia(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-3xl py-24 text-center text-slate-500">Cargando sesion...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-glow">
          <h1 className="text-2xl font-semibold">Necesitas iniciar sesion</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Solo los comercios dados de alta pueden crear publicaciones.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700">
            Ir al acceso
          </Link>
        </div>
      </main>
    );
  }

  if (subscriptionExpired) {
    return (
      <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <RenewalNotice owner={profile} showBackLink />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-glow sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-accent">Publicar</p>
              <h1 className="mt-2 text-3xl font-semibold">Nueva publicacion</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">Carga una foto o video corto y usa IS95 para escribir una descripcion mas clara.</p>
            </div>
            {comercio ? (
              <Link href={`/comercios/${comercio.id}`} className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
                Ver ficha
              </Link>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="imagen" className="mb-2 block text-sm font-semibold text-slate-700">
                Foto o video
              </label>
              <label htmlFor="imagen" className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-accent hover:bg-red-50/40">
                {preparingMedia ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    <span className="mt-3 text-sm font-semibold text-slate-700">Preparando archivo...</span>
                  </>
                ) : previewUrl && mediaKind === 'video' ? (
                  <video src={previewUrl} className="max-h-72 w-full rounded-2xl bg-black object-contain" controls muted playsInline preload="metadata" />
                ) : previewUrl ? (
                  <div className="relative w-full">
                    <img src={previewUrl} alt="Vista previa" className={`max-h-72 w-full rounded-2xl object-contain transition ${removingBackground ? 'opacity-55' : ''}`} />
                    {removingBackground ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/75 text-slate-700 backdrop-blur-sm">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <span className="mt-2 text-sm font-semibold">Quitando fondo...</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <ImagePlus className="h-8 w-8 text-slate-400" />
                    <span className="mt-3 text-sm font-semibold text-slate-700">Subir foto o video del producto o servicio</span>
                    <span className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, MP4, WebM o MOV. Videos hasta 20 segundos.</span>
                  </>
                )}
                <input
                  id="imagen"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                  onChange={handleMediaChange}
                  className="sr-only"
                />
              </label>
              {videoDuration ? <p className="mt-2 text-xs font-semibold text-slate-500">Video de {Math.round(videoDuration)} segundos</p> : null}
              <label className={`mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${removeBackground ? 'border-red-200 bg-red-50/70' : 'border-slate-200 bg-white hover:bg-slate-50'} ${mediaKind === 'video' ? 'cursor-not-allowed opacity-65' : ''}`}>
                <input
                  type="checkbox"
                  checked={removeBackground}
                  disabled={preparingMedia || removingBackground || mediaKind === 'video'}
                  onChange={(event) => void handleRemoveBackgroundChange(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 accent-accent disabled:cursor-not-allowed"
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  {removingBackground ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">Quitar fondo con IS95</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {mediaKind === 'video'
                      ? 'Disponible solo para fotos.'
                      : removingBackground
                        ? 'Preparando una imagen con fondo transparente.'
                        : backgroundRemoved
                          ? 'Fondo quitado. Esta version se usara para la revision y la publicacion.'
                          : removeBackground && !originalMediaFile
                            ? 'Cuando subas una foto, IS95 quitara el fondo antes de analizarla.'
                            : 'Ideal para publicar ropas y productos sobre fondo limpio.'}
                  </span>
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || preparingMedia || removingBackground || !mediaFile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analyzing || removingBackground ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {removingBackground ? 'Quitando fondo...' : analyzing ? 'Analizando...' : 'Generar texto con IS95'}
            </button>

            <div>
              <label htmlFor="titulo" className="mb-2 block text-sm font-semibold text-slate-700">
                Titulo
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ej: Combo especial para el almuerzo"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tipo" className="mb-2 block text-sm font-semibold text-slate-700">
                  Tipo
                </label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value as Publicacion['tipo'])}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                  <option value="oferta">Oferta</option>
                  <option value="novedad">Novedad</option>
                </select>
              </div>
              <div>
                <label htmlFor="precio" className="mb-2 block text-sm font-semibold text-slate-700">
                  Precio
                </label>
                <input
                  id="precio"
                  type="number"
                  value={precio}
                  onChange={(event) => setPrecio(event.target.value)}
                  placeholder="Opcional"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            <div>
              <CategorySelectField
                id="categoria"
                label="Categoria del articulo"
                value={categoria}
                onChange={setCategoria}
                options={categoryOptions}
                required
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="mb-2 block text-sm font-semibold text-slate-700">
                Descripcion
              </label>
              <textarea
                id="descripcion"
                rows={5}
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Describe brevemente tu oferta, producto o servicio"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
                required
              />
            </div>

            {error ? <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={submitting || preparingMedia || reviewingMedia || removingBackground}
            >
              {reviewingMedia || submitting || removingBackground ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {removingBackground ? 'Quitando fondo...' : reviewingMedia ? 'Revisando con IS95...' : submitting ? 'Publicando...' : 'Publicar ahora'}
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-slate-950">Asistente IS95</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">La sugerencia se genera desde la foto o un fotograma del video. Luego podes editar todo antes de publicar.</p>
          </div>

          {aiSuggestion ? (
            <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div>
                <p className="text-sm font-semibold text-slate-950">Ideas para mejorar la publicacion</p>
                <div className="mt-3 space-y-2">
                  {aiSuggestion.ideas.map((idea) => (
                    <p key={idea} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      {idea}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Mejoras para la foto</p>
                <div className="mt-3 space-y-2">
                  {aiSuggestion.mejorasFoto.map((idea) => (
                    <p key={idea} className="rounded-2xl bg-red-50 p-3 text-sm leading-6 text-slate-700">
                      {idea}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                <p className="font-semibold">Texto para WhatsApp</p>
                <p className="mt-2">{aiSuggestion.textoWhatsapp}</p>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
