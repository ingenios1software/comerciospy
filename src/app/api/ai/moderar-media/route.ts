import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ModerationCategoryMap = Record<string, boolean>;

type ModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: ModerationCategoryMap;
  }>;
  error?: {
    message?: string;
  };
};

type ModerationInput =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

const maxFrames = 6;
const maxFrameBytes = 8 * 1024 * 1024;

function getDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.ceil((base64.length * 3) / 4);
}

function isSupportedFrame(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(value) &&
    getDataUrlBytes(value) <= maxFrameBytes
  );
}

function getFlaggedCategories(response: ModerationResponse) {
  return [
    ...new Set(
      (response.results ?? []).flatMap((result) =>
        Object.entries(result.categories ?? {})
          .filter(([, flagged]) => flagged)
          .map(([category]) => category)
      )
    )
  ];
}

function getModerationError(status: number, message?: string) {
  if (status === 401) return 'La revision IA no esta disponible por configuracion del servidor.';
  if (status === 429) return 'OpenAI esta limitando las revisiones. Intenta de nuevo en unos minutos.';
  return message || 'No pudimos revisar el contenido con IA.';
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'La revision IA no esta disponible por configuracion del servidor.' }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown; frames?: unknown } | null;
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 1200) : '';
  const frames = Array.isArray(body?.frames) ? body.frames.filter(isSupportedFrame).slice(0, maxFrames) : [];

  if (!text && frames.length === 0) {
    return NextResponse.json({ error: 'No recibimos contenido para revisar.' }, { status: 400 });
  }

  const input: ModerationInput[] = [
    ...(text ? [{ type: 'text' as const, text }] : []),
    ...frames.map((frame) => ({ type: 'image_url' as const, image_url: { url: frame } }))
  ];

  let moderationResponse: Response;

  try {
    moderationResponse = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input
      })
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo conectar con OpenAI para revisar el contenido.' }, { status: 503 });
  }

  const moderationJson = (await moderationResponse.json().catch(() => null)) as ModerationResponse | null;

  if (!moderationResponse.ok) {
    return NextResponse.json(
      { error: getModerationError(moderationResponse.status, moderationJson?.error?.message) },
      { status: moderationResponse.status }
    );
  }

  const flaggedCategories = moderationJson ? getFlaggedCategories(moderationJson) : [];
  const flagged = Boolean(moderationJson?.results?.some((result) => result.flagged) || flaggedCategories.length > 0);

  return NextResponse.json({
    approved: !flagged,
    flaggedCategories
  });
}
