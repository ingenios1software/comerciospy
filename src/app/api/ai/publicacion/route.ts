import { NextResponse } from 'next/server';
import type { AiPublicationSuggestion, Publicacion } from '@/types';

export const runtime = 'nodejs';

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

const allowedTipos = ['producto', 'servicio', 'oferta', 'novedad'] as const;
const allowedCategories = [
  'Comida',
  'Bebidas',
  'Moda',
  'Bienestar',
  'Servicios',
  'Vivienda',
  'Electricidad',
  'Plomeria',
  'Tecnologia',
  'Hogar',
  'Autos'
];

function getResponseText(response: OpenAiResponse) {
  if (response.output_text) return response.output_text;

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((content) => content.type === 'output_text' && content.text)
      .map((content) => content.text)
      .join('\n') ?? ''
  );
}

function parseJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const jsonText = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(jsonText) as Partial<AiPublicationSuggestion>;
}

function normalizeList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 5);
}

function normalizeSuggestion(value: Partial<AiPublicationSuggestion>): AiPublicationSuggestion {
  const tipo = allowedTipos.includes(value.tipo as Publicacion['tipo']) ? (value.tipo as Publicacion['tipo']) : 'producto';
  const categoria = allowedCategories.includes(value.categoria ?? '') ? value.categoria ?? 'Servicios' : 'Servicios';

  return {
    titulo: value.titulo?.trim().slice(0, 90) || 'Nueva publicacion',
    descripcion: value.descripcion?.trim().slice(0, 700) || 'Describe los beneficios principales y agrega una llamada a consultar por WhatsApp.',
    categoria,
    tipo,
    ideas: normalizeList(value.ideas),
    mejorasFoto: normalizeList(value.mejorasFoto),
    textoWhatsapp:
      value.textoWhatsapp?.trim().slice(0, 280) ||
      'Hola, vi esta publicacion en ComerciosPY y quiero consultar disponibilidad.'
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'Falta configurar OPENAI_API_KEY en el servidor.' }, { status: 503 });
  }

  const formData = await request.formData();
  const image = formData.get('image');
  const businessName = String(formData.get('businessName') ?? '').slice(0, 120);
  const businessCategory = String(formData.get('businessCategory') ?? '').slice(0, 80);
  const currentTitle = String(formData.get('currentTitle') ?? '').slice(0, 120);
  const currentDescription = String(formData.get('currentDescription') ?? '').slice(0, 500);

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Sube una imagen para analizar.' }, { status: 400 });
  }

  if (!image.type.startsWith('image/')) {
    return NextResponse.json({ error: 'El archivo debe ser una imagen.' }, { status: 400 });
  }

  if (image.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 8 MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${image.type};base64,${buffer.toString('base64')}`;
  const model = process.env.OPENAI_MODEL ?? 'gpt-5-mini';

  const prompt = [
    'Analiza la foto y ayuda a un comercio local de Paraguay a crear una publicacion clara, vendible y honesta.',
    `Negocio: ${businessName || 'No informado'}.`,
    `Categoria del negocio: ${businessCategory || 'No informada'}.`,
    currentTitle ? `Titulo actual: ${currentTitle}.` : '',
    currentDescription ? `Descripcion actual: ${currentDescription}.` : '',
    'Devuelve solo JSON valido con estas claves: titulo, descripcion, categoria, tipo, ideas, mejorasFoto, textoWhatsapp.',
    `categoria debe ser una de: ${allowedCategories.join(', ')}.`,
    `tipo debe ser una de: ${allowedTipos.join(', ')}.`,
    'ideas y mejorasFoto deben ser listas breves. No inventes precios, direcciones ni datos medicos.'
  ]
    .filter(Boolean)
    .join('\n');

  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'developer',
          content: [
            {
              type: 'input_text',
              text: 'Eres un asistente de marketing para comercios locales. Respondes en espanol paraguayo neutro, con tono profesional y directo.'
            }
          ]
        },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: dataUrl, detail: 'low' }
          ]
        }
      ],
      max_output_tokens: 900
    })
  });

  const responseJson = (await openAiResponse.json()) as OpenAiResponse;

  if (!openAiResponse.ok) {
    return NextResponse.json(
      { error: responseJson.error?.message ?? 'No se pudo generar la sugerencia con IA.' },
      { status: openAiResponse.status }
    );
  }

  try {
    const suggestion = normalizeSuggestion(parseJson(getResponseText(responseJson)));
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ error: 'La IA respondio en un formato inesperado. Intenta con otra foto.' }, { status: 502 });
  }
}
