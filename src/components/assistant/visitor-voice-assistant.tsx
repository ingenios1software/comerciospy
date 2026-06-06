"use client";

import Link from 'next/link';
import { Bot, Loader2, Mic, MicOff, Search, Volume2, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { getAllComercios, getAllPublications } from '@/lib/firebase/firestore';
import { getCommerceSearchMatchLabel, getSearchTerms, scoreCommerceSearch } from '@/lib/search';
import type { Comercio, Publicacion } from '@/types';

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type VoiceSearchResult = {
  comercio: Comercio;
  matchLabel: string;
};

function getSpokenSummary(results: VoiceSearchResult[], query: string) {
  if (results.length === 0) {
    return `No encontre comercios publicados para ${query}. Podes probar con otra palabra o ciudad.`;
  }

  const [first, second] = results;
  if (second) {
    return `Encontre ${results.length} opciones. Las mejores son ${first.comercio.nombre} en ${first.comercio.ciudad} y ${second.comercio.nombre} en ${second.comercio.ciudad}.`;
  }

  return `Encontre ${first.comercio.nombre} en ${first.comercio.ciudad}. Podes abrir su ficha para ver WhatsApp, ubicacion y horario.`;
}

function useSpeechSupport() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const speechWindow = window as WindowWithSpeech;
    setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

  return supported;
}

export function VisitorVoiceAssistant() {
  const { loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const voiceSupported = useSpeechSupport();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('Decime que queres encontrar.');
  const [results, setResults] = useState<VoiceSearchResult[]>([]);

  const shouldShow = !authLoading && (pathname === '/' || pathname.startsWith('/comercios'));

  useEffect(() => {
    if (!shouldShow || comercios.length > 0 || loadingData) return;

    const loadSearchData = async () => {
      setLoadingData(true);
      const [commerceResult, publicationResult] = await Promise.allSettled([getAllComercios(), getAllPublications()]);
      setComercios(commerceResult.status === 'fulfilled' ? commerceResult.value : []);
      setPublicaciones(publicationResult.status === 'fulfilled' ? publicationResult.value : []);
      setLoadingData(false);
    };

    loadSearchData();
  }, [comercios.length, loadingData, shouldShow]);

  const publicacionesByCommerceId = useMemo(() => {
    return publicaciones.reduce((map, publicacion) => {
      const current = map.get(publicacion.comercioId) ?? [];
      current.push(publicacion);
      map.set(publicacion.comercioId, current);
      return map;
    }, new Map<string, Publicacion[]>());
  }, [publicaciones]);

  const exampleText = useMemo(() => {
    const city = comercios[0]?.ciudad || 'tu ciudad';
    return `Ej: "busco ropa en ${city}"`;
  }, [comercios]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PY';
    utterance.rate = 0.98;
    window.speechSynthesis.speak(utterance);
  };

  const runSearch = (rawQuery: string) => {
    const cleanQuery = rawQuery.trim();
    if (!cleanQuery) return;

    setQuery(cleanQuery);

    const ranked = comercios
      .map((comercio) => {
        const commercePublications = publicacionesByCommerceId.get(comercio.id) ?? [];
        return {
          comercio,
          score: scoreCommerceSearch(comercio, cleanQuery, commercePublications),
          matchLabel: getCommerceSearchMatchLabel(comercio, cleanQuery, commercePublications)
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const nextAnswer = getSpokenSummary(ranked, cleanQuery);

    setResults(ranked);
    setAnswer(nextAnswer);
    speak(nextAnswer);

    const params = new URLSearchParams();
    params.set('search', getSearchTerms(cleanQuery).join(' ') || cleanQuery);
    router.push(`/comercios?${params.toString()}`);
  };

  const startListening = () => {
    if (!voiceSupported || isListening) return;

    const speechWindow = window as WindowWithSpeech;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = 'es-PY';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      setAnswer('No pude escuchar bien. Proba escribir la busqueda o toca el microfono otra vez.');
    };
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) transcript += event.results[index][0].transcript;
      }

      if (transcript.trim()) runSearch(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(query);
  };

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-24 left-4 z-40 sm:bottom-6">
      {isOpen ? (
        <section className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-glow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-accent">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">Asistente de busqueda</p>
                <p className="text-xs text-slate-500">{voiceSupported ? 'Habla o escribe tu pedido' : 'Escribe tu pedido'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={comercios.length > 0 ? exampleText : 'Comercio, ciudad, categoria, rubro, contacto o articulo'}
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100"
            />
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white transition hover:bg-slate-800"
              aria-label="Buscar"
            >
              {loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-3 flex gap-2">
            {voiceSupported ? (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isListening ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-accent text-white hover:bg-red-700'
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isListening ? 'Detener' : 'Hablar'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => speak(answer)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Repetir respuesta"
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{answer}</p>

          {results.length > 0 ? (
            <div className="mt-3 space-y-2">
              {results.map(({ comercio, matchLabel }) => (
                <Link
                  key={comercio.id}
                  href={`/comercios/${comercio.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-3 text-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="block font-semibold text-slate-950">{comercio.nombre}</span>
                  <span className="mt-1 block truncate text-xs text-slate-500">
                    {comercio.rubro} - {comercio.ciudad}
                  </span>
                  <span className="mt-1 block truncate text-[11px] font-semibold text-accent">{matchLabel}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-glow transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          aria-label="Abrir asistente de busqueda por voz"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
