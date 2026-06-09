export type UserRole = 'superadmin' | 'admin' | 'comercio' | 'usuario' | 'cliente';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'expired' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type CommerceVisibilityStatus = 'publicado' | 'oculto' | 'pendiente' | 'suspendido';
export type PublicationPriceMode = 'consultar' | 'whatsapp' | 'desde' | 'fijo';
export type PublicationBadge = 'abierto' | 'destacado' | 'oferta' | 'nuevo';

export type ReviewSummary = {
  promedio: number;
  total?: number;
};

export type CommerceMetrics = {
  visitasFicha?: number;
  clicsWhatsapp?: number;
  clicsLlamar?: number;
  clicsMapa?: number;
  favoritos?: number;
  compartidos?: number;
};

export type UsuarioApp = {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  comercioId?: string;
  planNombre?: string;
  suscripcionEstado?: SubscriptionStatus;
  suscripcionInicio?: string;
  suscripcionVenceEn?: string;
  suscripcionVenceAt?: unknown;
  montoMensual?: number;
  moneda?: string;
  estadoPago?: PaymentStatus;
  metodoPago?: string;
  observacionCobranza?: string;
  comprobanteUrl?: string;
  pagoActualizadoEn?: string;
  activo: boolean;
  creadoEn: string;
};

export type Categoria = {
  id: string;
  nombre: string;
  activo: boolean;
  creadoEn: string;
};

export type PlanComercial = {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  moneda: string;
  duracionDias: number;
  etiqueta?: string;
  destacado?: boolean;
  activo: boolean;
  orden: number;
  creadoEn?: string;
  actualizadoEn?: string;
};

export type CommercePreview = {
  id: string;
  nombre: string;
  rubro: string;
  ciudad: string;
  barrio?: string;
  categoria: string;
  imagen: string;
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  horario?: string;
  fotos?: string[];
  planNombre?: string;
  destacado?: boolean;
  verificado?: boolean;
  valoracion?: ReviewSummary;
  ubicacion?: {
    lat: number;
    lng: number;
  };
};

export type Comercio = {
  id: string;
  ownerId?: string;
  nombre: string;
  contactoNombre?: string;
  rubro: string;
  descripcion: string;
  resumen?: string;
  ciudad: string;
  barrio?: string;
  categoria: string;
  direccion: string;
  telefono?: string;
  whatsapp: string;
  logoUrl: string;
  portadaUrl: string;
  fotos?: string[];
  servicios?: string[];
  horario: string;
  planNombre?: string;
  suscripcionEstado?: SubscriptionStatus;
  suscripcionInicio?: string;
  suscripcionVenceEn?: string;
  suscripcionVenceAt?: unknown;
  montoMensual?: number;
  moneda?: string;
  estadoPago?: PaymentStatus;
  metodoPago?: string;
  observacionCobranza?: string;
  comprobanteUrl?: string;
  pagoActualizadoEn?: string;
  visibilidadEstado?: CommerceVisibilityStatus;
  metricas?: CommerceMetrics;
  destacado?: boolean;
  valoracion?: ReviewSummary;
  resenasHabilitadas?: boolean;
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
  precioModo?: PublicationPriceMode;
  precioDesde?: boolean;
  imagenUrl: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  duracionSegundos?: number;
  moderacionEstado?: 'approved' | 'pending' | 'rejected';
  rechazoMotivo?: string;
  estado?: 'disponible' | 'vendido';
  vendidoEn?: string;
  categoria: string;
  ciudad: string;
  barrio?: string;
  destacado?: boolean;
  etiquetas?: PublicationBadge[];
  activo: boolean;
  creadoEn: string;
};

export type SolicitudCliente = {
  id: string;
  texto: string;
  categoria: string;
  ciudad: string;
  barrio?: string;
  nombre?: string;
  whatsapp: string;
  estado: 'activa' | 'cerrada' | 'oculta';
  creadoEn: string;
};

export type PublicationComment = {
  id: string;
  nombre: string;
  texto: string;
  creadoEn: string;
};

export type PublicationEngagement = {
  publicationId: string;
  likesCount: number;
  commentsCount: number;
  comentarios: PublicationComment[];
  actualizadoEn?: string;
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
