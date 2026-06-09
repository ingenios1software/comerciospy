"use client";

import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NeedSomethingSection } from '@/components/solicitudes/need-something-section';
import { getAllComercios } from '@/lib/firebase/firestore';
import { sampleComercios } from '@/lib/mockData';
import type { Comercio } from '@/types';

export default function SolicitudesPage() {
  const [comercios, setComercios] = useState<Comercio[]>(sampleComercios);

  useEffect(() => {
    getAllComercios()
      .then(setComercios)
      .catch(() => setComercios(sampleComercios));
  }, []);

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Solicitudes
          </p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Necesito algo</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 sm:text-sm">
            Publica lo que necesitas o responde solicitudes activas por WhatsApp.
          </p>
        </section>

        <NeedSomethingSection comercios={comercios} />
      </div>
    </main>
  );
}
