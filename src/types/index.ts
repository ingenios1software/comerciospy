export type UserRole = 'superadmin' | 'admin' | 'comercio' | 'usuario' | 'cliente';

export type UsuarioApp = {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  comercioId?: string;
  activo: boolean;
  creadoEn: string;
};

export type Categoria = {
  id: string;
  nombre: string;
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
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horario?: string;
  fotos?: string[];
};

export type Comercio = {
  id: string;
  ownerId?: string;
  nombre: string;
  rubro: string;
  descripcion: string;
  resumen?: string;
  ciudad: string;
  categoria: string;
  direccion: string;
  telefono?: string;
  whatsapp: string;
  logoUrl: string;
  portadaUrl: string;
  fotos?: string[];
  servicios?: string[];
  horario: string;
  ubicacionUrl?: string;
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

export type AiPublicationSuggestion = {
  titulo: string;
  descripcion: string;
  categoria: string;
  tipo: Publicacion['tipo'];
  ideas: string[];
  mejorasFoto: string[];
  textoWhatsapp: string;
};
