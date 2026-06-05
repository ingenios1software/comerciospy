import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ImageEditResponse = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
};

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxImageBytes = 8 * 1024 * 1024;
const outputMimeType = 'image/webp';

function getOpenAiImageErrorMessage(status: number, error?: ImageEditResponse['error']) {
  const message = error?.message ?? '';
  const code = error?.code ?? '';
  const type = error?.type ?? '';
  const searchable = `${message} ${code} ${type}`.toLowerCase();

  if (status === 429 && (searchable.includes('quota') || searchable.includes('billing'))) {
    return 'La cuenta de OpenAI no tiene creditos disponibles o alcanzo su limite mensual.';
  }

  if (status === 429) {
    return 'OpenAI esta limitando las solicitudes para quitar fondos. Intenta de nuevo en unos minutos.';
  }

  if (status === 401) {
    return 'La IA no esta disponible por configuracion del servidor.';
  }

  if (searchable.includes('transparent') || searchable.includes('background')) {
    return 'El modelo configurado para imagenes no soporta fondo transparente. Usa OPENAI_IMAGE_MODEL=gpt-image-1.5.';
  }

  return message || 'No pudimos quitar el fondo de la foto.';
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'La IA no esta disponible por configuracion del servidor.' }, { status: 503 });
  }

  const formData = await request.formData();
  const image = formData.get('image');

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Sube una imagen para quitar el fondo.' }, { status: 400 });
  }

  if (!allowedImageTypes.includes(image.type)) {
    return NextResponse.json({ error: 'Solo se puede quitar el fondo en imagenes JPG, PNG o WebP.' }, { status: 400 });
  }

  if (image.size > maxImageBytes) {
    return NextResponse.json({ error: 'La imagen no puede superar 8 MB.' }, { status: 400 });
  }

  const imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1.5';
  const imageQuality = process.env.OPENAI_IMAGE_QUALITY ?? 'medium';
  const normalizedImageModel = imageModel.toLowerCase();
  const supportsInputFidelity = normalizedImageModel.startsWith('gpt-image-') && !normalizedImageModel.includes('mini');
  const editFormData = new FormData();
  editFormData.append('model', imageModel);
  editFormData.append(
    'prompt',
    [
      'Remove only the background from the provided photo.',
      'Preserve the original composition, canvas, aspect ratio, framing, camera angle, and scale.',
      'If people are visible, keep every visible person fully intact, including faces, bodies, hair, skin, hands, legs, footwear, clothing, accessories, and pose.',
      'If products or clothing are visible without people, keep those products exactly as photographed.',
      'Do not isolate a single garment from a person. Do not crop, zoom, reframe, repaint, redesign, replace faces, change clothing, change colors, add mannequins, add text, or invent missing parts.',
      'Only make the scenery/background transparent while preserving the foreground subjects as faithfully as possible.'
    ].join(' ')
  );
  editFormData.append('image', image, image.name || 'publicacion.jpg');
  editFormData.append('background', 'transparent');
  editFormData.append('output_format', 'webp');
  editFormData.append('output_compression', '85');
  editFormData.append('quality', imageQuality);
  editFormData.append('size', 'auto');
  if (supportsInputFidelity) {
    editFormData.append('input_fidelity', 'high');
  }

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: editFormData
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con OpenAI para quitar el fondo.' }, { status: 503 });
  }

  const responseJson = (await openAiResponse.json().catch(() => null)) as ImageEditResponse | null;

  if (!openAiResponse.ok) {
    return NextResponse.json(
      { error: getOpenAiImageErrorMessage(openAiResponse.status, responseJson?.error) },
      { status: openAiResponse.status }
    );
  }

  const imageBase64 = responseJson?.data?.[0]?.b64_json;

  if (!imageBase64) {
    return NextResponse.json({ error: 'OpenAI respondio sin imagen procesada.' }, { status: 502 });
  }

  return NextResponse.json({
    image: imageBase64,
    mimeType: outputMimeType
  });
}
