import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react';
import { adminWhatsapp } from '@/lib/admin-contact';
import { developerBrand } from '@/lib/brand';
import { buildWhatsappUrl } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Politica de privacidad | ComerciosPY',
  description: 'Politica de privacidad y tratamiento de datos de ComerciosPY.'
};

const sections = [
  {
    title: 'Datos que podemos tratar',
    body: [
      'Datos de cuenta y contacto, como nombre, correo electronico, telefono y WhatsApp.',
      'Datos del comercio que el usuario decide publicar, como nombre comercial, rubro, ciudad, direccion, horarios, ubicacion, fotos, productos y servicios.',
      'Contenido enviado para crear o moderar publicaciones con las funciones IS95.',
      'Datos tecnicos necesarios para iniciar sesion, mantener la seguridad y prestar el servicio.'
    ]
  },
  {
    title: 'Para que usamos los datos',
    body: [
      'Crear y administrar cuentas y fichas comerciales.',
      'Mostrar comercios, publicaciones y datos de contacto elegidos por cada comercio.',
      'Permitir busquedas, favoritos, carrito, enlaces compartidos y consultas por WhatsApp.',
      'Generar sugerencias de texto, moderar contenido, prevenir abuso y mejorar el servicio.'
    ]
  },
  {
    title: 'Servicios que utilizamos',
    body: [
      'Firebase de Google para autenticacion, base de datos y almacenamiento de imagenes o videos.',
      'Vercel para alojar y entregar la aplicacion web.',
      'OpenAI para funciones opcionales de asistencia de texto, moderacion y edicion de imagenes.',
      'WhatsApp, telefono y mapas cuando el usuario elige abrir esos servicios externos.'
    ]
  },
  {
    title: 'Conservacion y eliminacion',
    body: [
      'Conservamos los datos mientras la cuenta este activa o sean necesarios para prestar el servicio.',
      'Al solicitar la eliminacion, verificamos la identidad y eliminamos o anonimizamos la cuenta y el contenido asociado, salvo datos que debamos conservar por seguridad, fraude, obligaciones legales o registros comerciales.',
      'Los favoritos, el carrito y algunos indicadores de interaccion pueden guardarse localmente en el dispositivo.'
    ]
  }
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface px-4 pb-28 pt-24 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-slate-200 pb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-accent">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">ComerciosPY</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Politica de privacidad</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Esta politica explica como {developerBrand}, responsable de ComerciosPY, trata los datos necesarios para ofrecer la guia comercial y sus herramientas.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-500">Ultima actualizacion: 6 de junio de 2026</p>
        </header>

        <div className="mt-8 grid gap-8">
          {sections.map((section, index) => (
            <section key={section.title} className="grid gap-3 sm:grid-cols-[48px_1fr]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                {index === 0 ? <Database className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {section.body.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold">Control de tus datos</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Podes pedir acceso, correccion o eliminacion de tus datos. Para iniciar una eliminacion completa, usa la pagina publica de eliminacion de cuenta.
          </p>
          <Link href="/eliminar-cuenta" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            Solicitar eliminacion
          </Link>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold">Contacto de privacidad</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Para consultas sobre privacidad, correccion o acceso a tus datos, contacta a la administracion de ComerciosPY.
          </p>
          <a
            href={buildWhatsappUrl(adminWhatsapp, 'Hola, tengo una consulta sobre privacidad y mis datos en ComerciosPY.')}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-emerald-500 hover:text-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </a>
        </section>
      </div>
    </main>
  );
}
