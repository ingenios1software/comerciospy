import type { Comercio, CommercePreview, Publicacion } from '@/types';

export const featuredComercios: CommercePreview[] = [
  {
    id: 'c1',
    nombre: 'Cafe Lapacho',
    rubro: 'Cafe y meriendas',
    categoria: 'Comida',
    ciudad: 'Asuncion',
    direccion: 'Espana 841',
    telefono: '021 441 220',
    whatsapp: '+595981220441',
    horario: 'Lun a sab, 07:30 - 20:30',
    imagen: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=300&q=70',
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=300&q=70'
    ]
  },
  {
    id: 'c2',
    nombre: 'Tecno Centro PY',
    rubro: 'Reparacion de celulares',
    categoria: 'Tecnologia',
    ciudad: 'Fernando de la Mora',
    direccion: 'Ruta Mariscal Estigarribia km 8',
    telefono: '021 552 118',
    whatsapp: '+595981552118',
    horario: 'Lun a vie, 08:00 - 18:00',
    imagen: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=300&q=70',
      'https://images.unsplash.com/photo-1581092919535-7146ff1a590b?auto=format&fit=crop&w=300&q=70'
    ]
  },
  {
    id: 'c3',
    nombre: 'Estudio Brisa',
    rubro: 'Belleza y unas',
    categoria: 'Bienestar',
    ciudad: 'Luque',
    direccion: 'Centro, local 12',
    telefono: '0981 889 440',
    whatsapp: '+595981889440',
    horario: 'Mar a sab, 09:00 - 19:00',
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=300&q=70',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=300&q=70'
    ]
  },
  {
    id: 'c4',
    nombre: 'Casa Total Servicios',
    rubro: 'Electricidad, plomeria y reparaciones',
    categoria: 'Vivienda',
    ciudad: 'San Lorenzo',
    direccion: 'Atencion a domicilio',
    telefono: '0982 410 771',
    whatsapp: '+595982410771',
    horario: 'Lun a sab, 07:00 - 19:00',
    imagen: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=300&q=70',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=300&q=70'
    ]
  }
];

export const sampleComercios: Comercio[] = [
  {
    id: 'c1',
    ownerId: 'demo-cafe',
    nombre: 'Cafe Lapacho',
    rubro: 'Cafe y meriendas',
    categoria: 'Comida',
    descripcion: 'Cafe de especialidad, meriendas caseras y almuerzos livianos en un espacio tranquilo para reunirse o trabajar.',
    resumen: 'Cafe de especialidad, meriendas y almuerzos livianos.',
    ciudad: 'Asuncion',
    direccion: 'Espana 841',
    telefono: '021 441 220',
    whatsapp: '+595981220441',
    logoUrl: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=200&q=70',
    portadaUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=600&q=70'
    ],
    servicios: ['Cafe para llevar', 'Meriendas', 'Reservas', 'Pedidos por WhatsApp'],
    horario: 'Lun a sab, 07:30 - 20:30',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Asuncion+Espana+841',
    ubicacion: {
      lat: -25.2867,
      lng: -57.3333
    },
    activo: true,
    verificado: true,
    creadoEn: '2026-05-01'
  },
  {
    id: 'c2',
    ownerId: 'demo-tecno',
    nombre: 'Tecno Centro PY',
    rubro: 'Reparacion de celulares',
    categoria: 'Tecnologia',
    descripcion: 'Servicio tecnico para celulares, notebooks y accesorios. Diagnostico rapido, presupuestos claros y seguimiento por WhatsApp.',
    resumen: 'Servicio tecnico, accesorios y diagnostico rapido.',
    ciudad: 'Fernando de la Mora',
    direccion: 'Ruta Mariscal Estigarribia km 8',
    telefono: '021 552 118',
    whatsapp: '+595981552118',
    logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=70',
    portadaUrl: 'https://images.unsplash.com/photo-1581092919535-7146ff1a590b?auto=format&fit=crop&w=1200&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=70'
    ],
    servicios: ['Cambio de pantalla', 'Baterias', 'Notebooks', 'Accesorios'],
    horario: 'Lun a vie, 08:00 - 18:00',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Fernando+de+la+Mora+Ruta+Mariscal+Estigarribia',
    ubicacion: {
      lat: -25.3217,
      lng: -57.5408
    },
    activo: true,
    verificado: true,
    creadoEn: '2026-04-22'
  },
  {
    id: 'c3',
    ownerId: 'demo-brisa',
    nombre: 'Estudio Brisa',
    rubro: 'Belleza y unas',
    categoria: 'Bienestar',
    descripcion: 'Manicura, cejas, maquillaje social y servicios express con agenda por WhatsApp.',
    resumen: 'Belleza express con agenda por WhatsApp.',
    ciudad: 'Luque',
    direccion: 'Centro, local 12',
    telefono: '0981 889 440',
    whatsapp: '+595981889440',
    logoUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=200&q=70',
    portadaUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=70'
    ],
    servicios: ['Manicura', 'Cejas', 'Maquillaje social', 'Turnos por WhatsApp'],
    horario: 'Mar a sab, 09:00 - 19:00',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=Luque+Centro',
    ubicacion: {
      lat: -25.2674,
      lng: -57.4872
    },
    activo: true,
    verificado: false,
    creadoEn: '2026-05-10'
  },
  {
    id: 'c4',
    ownerId: 'demo-casa-total',
    nombre: 'Casa Total Servicios',
    rubro: 'Electricidad, plomeria y reparaciones',
    categoria: 'Vivienda',
    descripcion: 'Prestadores para mantenimiento integral de viviendas: electricidad, plomeria, pintura, reparaciones y urgencias coordinadas por WhatsApp.',
    resumen: 'Soluciones rapidas para mantenimiento de viviendas.',
    ciudad: 'San Lorenzo',
    direccion: 'Atencion a domicilio',
    telefono: '0982 410 771',
    whatsapp: '+595982410771',
    logoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=200&q=70',
    portadaUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=70',
    fotos: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&q=70',
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=600&q=70'
    ],
    servicios: ['Electricidad', 'Plomeria', 'Pintura', 'Reparaciones urgentes', 'Mantenimiento mensual'],
    horario: 'Lun a sab, 07:00 - 19:00',
    ubicacionUrl: 'https://www.google.com/maps/search/?api=1&query=San+Lorenzo+Paraguay',
    ubicacion: {
      lat: -25.3397,
      lng: -57.5088
    },
    activo: true,
    verificado: true,
    creadoEn: '2026-05-15'
  }
];

export const samplePublicaciones: Publicacion[] = [
  {
    id: 'p1',
    comercioId: 'c1',
    tipo: 'oferta',
    titulo: 'Combo merienda para dos',
    descripcion: 'Dos cafes medianos y porcion de torta del dia para compartir.',
    precio: 45000,
    imagenUrl: 'https://images.unsplash.com/photo-1511081692775-05d0f180a065?auto=format&fit=crop&w=800&q=70',
    categoria: 'Comida',
    ciudad: 'Asuncion',
    activo: true,
    creadoEn: '2026-05-01'
  },
  {
    id: 'p2',
    comercioId: 'c2',
    tipo: 'servicio',
    titulo: 'Diagnostico express',
    descripcion: 'Revisamos tu celular y te enviamos presupuesto por WhatsApp.',
    precio: null,
    imagenUrl: 'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=800&q=70',
    categoria: 'Tecnologia',
    ciudad: 'Fernando de la Mora',
    activo: true,
    creadoEn: '2026-05-03'
  },
  {
    id: 'p3',
    comercioId: 'c3',
    tipo: 'novedad',
    titulo: 'Turnos de fin de semana',
    descripcion: 'Agenda abierta para manicura, cejas y maquillaje social.',
    precio: null,
    imagenUrl: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=70',
    categoria: 'Bienestar',
    ciudad: 'Luque',
    activo: true,
    creadoEn: '2026-05-05'
  },
  {
    id: 'p4',
    comercioId: 'c4',
    tipo: 'servicio',
    titulo: 'Mantenimiento integral de viviendas',
    descripcion: 'Coordinamos electricidad, plomeria y reparaciones para casas, departamentos y locales.',
    precio: null,
    imagenUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=70',
    categoria: 'Vivienda',
    ciudad: 'San Lorenzo',
    activo: true,
    creadoEn: '2026-05-12'
  }
];
