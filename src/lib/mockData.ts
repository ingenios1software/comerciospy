import type { Comercio, CommercePreview, Publicacion } from '@/types';

export const featuredComercios: CommercePreview[] = [
  {
    id: 'c1',
    nombre: 'Miga Bakery',
    rubro: 'Panadería artesanal',
    ciudad: 'Rosario',
    imagen: 'https://images.unsplash.com/photo-1511032481081-6cb8a6a398ca?auto=format&fit=crop&w=800&q=60'
  },
  {
    id: 'c2',
    nombre: 'Fit Market',
    rubro: 'Productos saludables',
    ciudad: 'Salta',
    imagen: 'https://images.unsplash.com/photo-1516251193007-45ef944ab0c6?auto=format&fit=crop&w=800&q=60'
  },
  {
    id: 'c3',
    nombre: 'Tienda Verde',
    rubro: 'Alimentos saludables',
    ciudad: 'Córdoba',
    imagen: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=60'
  }
];

export const sampleComercios: Comercio[] = [
  {
    id: 'c1',
    nombre: 'Miga Bakery',
    rubro: 'Panadería artesanal',
    descripcion: 'Pan fresco, bebidas y desayunos especiales hechos con ingredientes locales.',
    ciudad: 'Rosario',
    direccion: 'Mitre 123',
    whatsapp: '+5493412345678',
    logoUrl: 'https://images.unsplash.com/photo-1523475496153-3d6ccf030a5f?auto=format&fit=crop&w=200&q=60',
    portadaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=60',
    horario: '08:00 - 21:00',
    ubicacion: {
      lat: -32.9468,
      lng: -60.6393
    },
    activo: true,
    verificado: true,
    creadoEn: '2026-05-01'
  },
  {
    id: 'c2',
    nombre: 'Fit Market',
    rubro: 'Productos saludables',
    descripcion: 'Tienda con opciones naturales, snacks y suplementos para una vida activa.',
    ciudad: 'Salta',
    direccion: 'San Martín 567',
    whatsapp: '+5493871234567',
    logoUrl: 'https://images.unsplash.com/photo-1523475496153-3d6ccf030a5f?auto=format&fit=crop&w=200&q=60',
    portadaUrl: 'https://images.unsplash.com/photo-1506808547685-e2ba962ded38?auto=format&fit=crop&w=1200&q=60',
    horario: '10:00 - 20:00',
    ubicacion: {
      lat: -24.7827,
      lng: -65.4232
    },
    activo: true,
    verificado: false,
    creadoEn: '2026-04-22'
  }
];

export const samplePublicaciones: Publicacion[] = [
  {
    id: 'p1',
    comercioId: 'c1',
    tipo: 'oferta',
    titulo: '2x1 en smoothies',
    descripcion: 'Combo fresco con frutas de estación a precio especial.',
    precio: 950,
    imagenUrl: 'https://images.unsplash.com/photo-1516684669134-de6c9d2d2e97?auto=format&fit=crop&w=800&q=60',
    categoria: 'Bebidas',
    ciudad: 'Rosario',
    activo: true,
    creadoEn: '2026-05-01'
  },
  {
    id: 'p2',
    comercioId: 'c2',
    tipo: 'novedad',
    titulo: 'Lanzamiento colección verano',
    descripcion: 'Nuevos looks deportivos y lifestyle disponibles hoy.',
    precio: null,
    imagenUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=60',
    categoria: 'Moda',
    ciudad: 'Salta',
    activo: true,
    creadoEn: '2026-05-03'
  },
  {
    id: 'p3',
    comercioId: 'c1',
    tipo: 'producto',
    titulo: 'Pan de masa madre',
    descripcion: 'Recién horneado con ingredientes naturales y fermentación lenta.',
    precio: 550,
    imagenUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=60',
    categoria: 'Panadería',
    ciudad: 'Rosario',
    activo: true,
    creadoEn: '2026-05-05'
  }
];
