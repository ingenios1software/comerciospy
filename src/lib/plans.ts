import type { PlanComercial } from '@/types';

export const defaultPlans: PlanComercial[] = [
  {
    id: 'semanal',
    nombre: 'Plan Semanal',
    descripcion: 'Tu comercio visible por 7 dias.',
    precio: 0,
    moneda: 'PYG',
    duracionDias: 7,
    etiqueta: '7 dias',
    destacado: false,
    activo: true,
    orden: 1
  },
  {
    id: 'quincenal',
    nombre: 'Plan Quincenal',
    descripcion: 'Mas tiempo para mostrar tu comercio y publicar.',
    precio: 0,
    moneda: 'PYG',
    duracionDias: 15,
    etiqueta: '15 dias',
    destacado: false,
    activo: true,
    orden: 2
  },
  {
    id: 'mensual',
    nombre: 'Plan Mensual',
    descripcion: 'Presencia completa durante 30 dias.',
    precio: 0,
    moneda: 'PYG',
    duracionDias: 30,
    etiqueta: '30 dias',
    destacado: true,
    activo: true,
    orden: 3
  }
];

export const paymentMethods = [
  {
    id: 'whatsapp',
    nombre: 'Coordinar por WhatsApp',
    descripcion: 'Te escribimos para confirmar datos, plan y forma de pago.'
  },
  {
    id: 'transferencia',
    nombre: 'Transferencia bancaria',
    descripcion: 'Administracion confirma la cuenta y valida el comprobante.'
  },
  {
    id: 'efectivo',
    nombre: 'Pago en efectivo',
    descripcion: 'Pago coordinado con administracion.'
  }
];

export function formatPlanPrice(plan: Pick<PlanComercial, 'precio' | 'moneda'>) {
  if (!plan.precio) return 'Consultar';
  return `${new Intl.NumberFormat('es-PY').format(plan.precio)} ${plan.moneda || 'PYG'}`;
}

export function normalizePlan(plan: PlanComercial): PlanComercial {
  return {
    ...plan,
    precio: Number.isFinite(Number(plan.precio)) ? Number(plan.precio) : 0,
    duracionDias: Number.isFinite(Number(plan.duracionDias)) ? Number(plan.duracionDias) : 30,
    orden: Number.isFinite(Number(plan.orden)) ? Number(plan.orden) : 99,
    moneda: plan.moneda || 'PYG',
    activo: Boolean(plan.activo)
  };
}

export function sortPlans(plans: PlanComercial[]) {
  return [...plans].map(normalizePlan).sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
}
