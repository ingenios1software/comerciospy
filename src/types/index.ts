export type UsuarioApp = {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'comercio' | 'cliente';
  comercioId?: string;
  activo: boolean;
  creadoEn: string;
};

export type CommercePreview = {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string;
  categoria: string;
  imagen: string;
};

export type Comercio = {
  id: string;
  nombre: string;
  rubro: string;
  descripcion: string;
  ciudad: string;
  categoria: string;
  direccion: string;
  whatsapp: string;
  logoUrl: string;
  portadaUrl: string;
  horario: string;
  ubicacion: {
    lat: number;
    lng: number;
  };
  activo: boolean;
  verificado: boolean;
  creadoEn: string;
};

export type Publicacion = {
  id: string;
  comercioId: string;
  tipo: 'producto' | 'servicio' | 'oferta' | 'novedad';
  titulo: string;
  descripcion: string;
  precio?: number | null;
  imagenUrl: string;
  categoria: string;
  ciudad: string;
  activo: boolean;
  creadoEn: string;
};
