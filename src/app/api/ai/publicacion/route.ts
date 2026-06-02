import { NextResponse } from 'next/server';
import type { AiPublicationSuggestion, Publicacion } from '@/types';

export const runtime = 'nodejs';

type OpenAiResponse = {
  status?: string;
  incomplete_details?: {
    reason?: string;
  } | null;
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  error?: {
    message?: string;
    code?: string;
    type?: string;
  };
};

const allowedTipos = ['producto', 'servicio', 'oferta', 'novedad'] as const;
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
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

const publicationSuggestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['titulo', 'descripcion', 'categoria', 'tipo', 'ideas', 'mejorasFoto', 'textoWhatsapp'],
  properties: {
    titulo: {
      type: 'string'
    },
    descripcion: {
      type: 'string'
    },
    categoria: {
      type: 'string',
      enum: allowedCategories
    },
    tipo: {
      type: 'string',
      enum: allowedTipos
    },
    ideas: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    mejorasFoto: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    textoWhatsapp: {
      type: 'string'
    }
  }
} as const;

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

function getResponseRefusal(response: OpenAiResponse) {
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((content) => typeof content.refusal === 'string' && content.refusal.trim())
      .map((content) => content.refusal)
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

function getOpenAiErrorMessage(status: number, error?: OpenAiResponse['error']) {
  const message = error?.message ?? '';
  const code = error?.code ?? '';
  const type = error?.type ?? '';
  const searchable = `${message} ${code} ${type}`.toLowerCase();

  if (status === 429 && (searchable.includes('quota') || searchable.includes('billing'))) {
    return 'La cuenta de OpenAI no tiene creditos disponibles o alcanzo su limite mensual. Revisa Billing/Usage en OpenAI, agrega credito o aumenta el limite y vuelve a probar.';
  }

  if (status === 429) {
    return 'OpenAI esta limitando las solicitudes por uso alto. Espera unos minutos y vuelve a probar.';
  }

  if (status === 401) {
    return 'La API key de OpenAI no es valida o fue revocada. Revisa OPENAI_API_KEY en Vercel.';
  }

  return message || 'No se pudo generar la sugerencia con IA.';
}

function getIncompleteMessage(reason?: string) {
  if (reason === 'max_output_tokens') {
    return 'La IA necesito mas espacio para terminar la sugerencia. Intenta de nuevo con una foto mas clara o menos texto.';
  }

  return 'La IA no termino de generar la sugerencia. Intenta nuevamente.';
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

  if (!allowedImageTypes.includes(image.type)) {
    return NextResponse.json({ error: 'La IA solo puede analizar imagenes JPG, PNG o WebP.' }, { status: 400 });
  }

  if (image.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 8 MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const dataUrl = `data:${image.type};base64,${buffer.toString('base64')}`;
  const model = process.env.OPENAI_MODEL ?? 'gpt-5-mini';
  const isGpt5Model = model.toLowerCase().startsWith('gpt-5');

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

  const requestBody = {
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
    text: {
      ...(isGpt5Model ? { verbosity: 'low' } : {}),
      format: {
        type: 'json_schema',
        name: 'publication_suggestion',
        strict: true,
        schema: publicationSuggestionSchema
      }
    },
    ...(isGpt5Model ? { reasoning: { effort: 'minimal' } } : {}),
    max_output_tokens: 2400
  };

  let openAiResponse: Response;
  try {
    openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con OpenAI. Revisa la conexion del servidor o la configuracion de certificados.' },
      { status: 503 }
    );
  }

  let responseJson: OpenAiResponse;
  try {
    responseJson = (await openAiResponse.json()) as OpenAiResponse;
  } catch {
    return NextResponse.json({ error: 'OpenAI respondio sin datos legibles. Intenta nuevamente.' }, { status: 502 });
  }

  if (!openAiResponse.ok) {
    return NextResponse.json(
      { error: getOpenAiErrorMessage(openAiResponse.status, responseJson.error) },
      { status: openAiResponse.status }
    );
  }

  const refusal = getResponseRefusal(responseJson);
  if (refusal) {
    return NextResponse.json({ error: 'La IA no pudo analizar esa imagen. Prueba con otra foto.' }, { status: 422 });
  }

  const responseText = getResponseText(responseJson);

  try {
    const suggestion = normalizeSuggestion(parseJson(responseText));
    return NextResponse.json({ suggestion });
  } catch {
    if (responseJson.status === 'incomplete') {
      return NextResponse.json(
        { error: getIncompleteMessage(responseJson.incomplete_details?.reason) },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: 'La IA respondio en un formato inesperado. Intenta con otra foto.' }, { status: 502 });
  }
}
