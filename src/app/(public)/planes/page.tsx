"use client";

import Link from 'next/link';
import { CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { adminWhatsapp } from '@/lib/admin-contact';
import { getActivePlans } from '@/lib/firebase/firestore';
import { formatPlanPrice, paymentMethods } from '@/lib/plans';
import { buildWhatsappUrl } from '@/lib/utils/format';
import type { PlanComercial } from '@/types';

function buildPlanMessage({
  plan,
  paymentMethod,
  nombre,
  ruc,
  correo,
  telefono,
  direccion
}: {
  plan: PlanComercial;
  paymentMethod: string;
  nombre: string;
  ruc: string;
  correo: string;
  telefono: string;
  direccion: string;
}) {
  const lines = [
    'Hola, quiero aparecer en ComerciosPY.',
    `Plan: ${plan.nombre}`,
    `Duracion: ${plan.duracionDias} dias`,
    `Precio: ${formatPlanPrice(plan)}`,
    `Metodo de pago: ${paymentMethod}`,
    nombre ? `Razon social/nombre: ${nombre}` : '',
    ruc ? `RUC/CI: ${ruc}` : '',
    correo ? `Correo: ${correo}` : '',
    telefono ? `Telefono: ${telefono}` : '',
    direccion ? `Direccion: ${direccion}` : ''
  ].filter(Boolean);

  return lines.join('\n');
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<PlanComercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(paymentMethods[0].id);
  const [ruc, setRuc] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await getActivePlans();
        setPlans(data);
        setSelectedPlanId(data[0]?.id ?? '');
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0], [plans, selectedPlanId]);
  const selectedPayment = paymentMethods.find((method) => method.id === selectedPaymentMethod) ?? paymentMethods[0];
  const whatsappUrl = selectedPlan
    ? buildWhatsappUrl(
        adminWhatsapp,
        buildPlanMessage({
          plan: selectedPlan,
          paymentMethod: selectedPayment.nombre,
          nombre,
          ruc,
          correo,
          telefono,
          direccion
        })
      )
    : '#';

  return (
    <main className="min-h-screen bg-surface px-3 pb-24 pt-20 text-slate-950 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-3">
        <section className="rounded-lg border border-emerald-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-emerald-600 sm:text-2xl">Publica tu comercio</h1>
                <p className="text-xs font-semibold text-slate-500">Selecciona un plan y envia tus datos por WhatsApp.</p>
              </div>
            </div>
            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">Alta administrada</p>
          </div>
        </section>

        <section className="text-center">
          <p className="text-sm font-black text-slate-700 sm:text-base">Destaca tu comercio y vende mas rapido</p>
        </section>

        <section className="grid gap-3 lg:grid-cols-[1fr_1fr_320px]">
          <div className="rounded-lg border border-yellow-400 bg-white shadow-sm">
            <div className="border-b border-yellow-300 bg-yellow-50 px-3 py-2">
              <p className="text-sm font-black text-yellow-700">1 - Selecciona un plan</p>
            </div>
            <div className="divide-y divide-yellow-200">
              {loading ? (
                <p className="p-3 text-sm font-semibold text-slate-500">Cargando planes...</p>
              ) : plans.length > 0 ? (
                plans.map((plan) => (
                  <label key={plan.id} className="grid cursor-pointer grid-cols-[22px_minmax(0,1fr)] gap-2 bg-yellow-400/85 px-3 py-3 text-white transition hover:bg-yellow-400">
                    <input
                      type="radio"
                      name="plan"
                      checked={selectedPlan?.id === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="mt-1 h-4 w-4 border-white text-emerald-600 focus:ring-emerald-100"
                    />
                    <span className="min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black">{formatPlanPrice(plan)}</span>
                        <span className="text-right text-xs font-black">{plan.nombre}</span>
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-white/90">
                        {plan.etiqueta || `${plan.duracionDias} dias`} {plan.descripcion ? `- ${plan.descripcion}` : ''}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="p-3 text-sm font-semibold text-slate-500">No hay planes activos.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500 bg-white shadow-sm">
            <div className="border-b border-emerald-100 px-3 py-2">
              <p className="text-sm font-black text-slate-700">2 - Selecciona metodo de pago</p>
            </div>
            <div className="divide-y divide-emerald-100">
              {paymentMethods.map((method) => (
                <label key={method.id} className="grid cursor-pointer grid-cols-[22px_minmax(0,1fr)] gap-2 px-3 py-3 transition hover:bg-emerald-50">
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPaymentMethod === method.id}
                    onChange={() => setSelectedPaymentMethod(method.id)}
                    className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-100"
                  />
                  <span>
                    <span className="block text-sm font-black text-slate-700">{method.nombre}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{method.descripcion}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <aside className="space-y-3">
            <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-3 py-2">
                <p className="text-sm font-black text-slate-700">Costo total</p>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                  <span>{selectedPlan?.nombre ?? 'Plan'}</span>
                  <span>{selectedPlan ? formatPlanPrice(selectedPlan) : 'Consultar'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-500">
                  <span>Adicional</span>
                  <span>Consultar</span>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500">Total</p>
                  <p className="mt-1 text-2xl font-black text-emerald-600">{selectedPlan ? formatPlanPrice(selectedPlan) : 'Consultar'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-black text-slate-700">Datos para alta</p>
              </div>
              <div className="space-y-2">
                <Field label="RUC/CI" value={ruc} onChange={setRuc} placeholder="9999999-9" />
                <Field label="Razon social/nombre" value={nombre} onChange={setNombre} />
                <Field label="Correo" value={correo} onChange={setCorreo} type="email" />
                <Field label="Telefono" value={telefono} onChange={setTelefono} />
                <Field label="Direccion" value={direccion} onChange={setDireccion} />
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-black text-white transition ${
                  selectedPlan ? 'bg-emerald-600 hover:bg-emerald-700' : 'pointer-events-none bg-slate-300'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                Enviar solicitud
              </a>
            </section>
          </aside>
        </section>

        <p className="text-center text-xs font-semibold text-slate-500">
          Despues de confirmar el pago, administracion crea o activa la cuenta del comercio. <Link href="/login" className="text-accent">Ya tengo cuenta</Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
