/**
 * Modelos de datos de la app. Reflejan las tablas de supabase/migrations: los
 * nombres de columna se mantienen en inglés porque así están en la base.
 */

export type Especie = 'perro' | 'gato' | 'otro';
export type Sexo = 'macho' | 'hembra';
export type Tamanio = 'pequeño' | 'mediano' | 'grande';
export type TipoCuenta = 'usuario' | 'rescatista' | 'organizacion' | 'veterinario';

export interface Coordenadas {
  lat?: number;
  lng?: number;
}

/** Par [latitud, longitud], el formato que usa Leaflet. */
export type PuntoLatLng = [number, number];

export interface Perfil {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  tipo_cuenta: TipoCuenta;
  es_admin: boolean;
  profile_completed?: boolean;
  bio?: string;
  location?: string;
  organization_name?: string;
}

/** Columnas que la base administra sola. */
export interface RegistroBase {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Mascota extends RegistroBase {
  name: string;
  species: Especie;
  breed?: string;
  age_years?: number | null;
  sex?: Sexo;
  photo_url?: string;
  description?: string;
  allergies?: string;
  owner_name?: string;
  owner_phone?: string;
  owner_whatsapp?: string;
  qr_id?: string;
  created_by_id?: string;
}

export interface Avistamiento {
  address?: string;
  note?: string;
  lat?: number | null;
  lng?: number | null;
  date?: string;
}

export type EstadoMascotaPerdida = 'perdida' | 'encontrada';

export interface MascotaPerdida extends RegistroBase {
  pet_name: string;
  species: Especie;
  breed?: string;
  age_years?: number | null;
  photo_url?: string;
  description?: string;
  last_seen_address?: string;
  last_seen_lat?: number | null;
  last_seen_lng?: number | null;
  contact_phone?: string;
  contact_whatsapp?: string;
  status: EstadoMascotaPerdida;
  sightings?: Avistamiento[];
  created_by_id?: string;
}

export type EstadoAdopcion = 'disponible' | 'en_proceso' | 'adoptado';

export interface MascotaAdopcion extends RegistroBase {
  name: string;
  species: Especie;
  breed?: string;
  age_years?: number | null;
  sex?: Sexo;
  size?: Tamanio;
  photo_url?: string;
  description?: string;
  vaccinated?: boolean;
  sterilized?: boolean;
  contact_name?: string;
  contact_phone?: string;
  location?: string;
  status: EstadoAdopcion;
  created_by_id?: string;
}

export interface HorarioVeterinaria {
  day: string;
  open: string;
  close: string;
}

export interface Veterinaria extends RegistroBase {
  name: string;
  address: string;
  phone: string;
  lat?: number | null;
  lng?: number | null;
  is_emergency?: boolean;
  schedule?: HorarioVeterinaria[];
  services?: string;
  bio?: string;
  is_verified?: boolean;
  registered_by_user_id?: string;
}

export type EstadoCasoUrgente = 'activo' | 'en_curso' | 'resuelto';
export type EstadoNecesidad = 'cubierto' | 'parcial' | 'pendiente';

export interface NecesidadCaso {
  label: string;
  status: EstadoNecesidad;
}

export interface CasoUrgente extends RegistroBase {
  title: string;
  description: string;
  photo_url?: string;
  published_by?: string;
  goal_amount?: number;
  raised_amount?: number;
  contributors_count?: number;
  donation_alias?: string;
  needs?: NecesidadCaso[];
  status: EstadoCasoUrgente;
  created_by_id?: string;
}

export type TipoDenuncia = 'urgente' | 'regular' | 'anonima';
export type EstadoDenuncia = 'pendiente' | 'en_revision' | 'derivada' | 'resuelta';

export interface Denuncia extends RegistroBase {
  type: TipoDenuncia;
  description: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  evidence_urls?: string[];
  reporter_name?: string;
  reporter_phone?: string;
  tracking_code?: string;
  status: EstadoDenuncia;
  created_by_id?: string;
}

export type ContextoChat = 'lost_pet' | 'urgent_case' | 'adoption';

export interface MensajeChat extends RegistroBase {
  conversation_id: string;
  context_type: ContextoChat;
  context_id?: string;
  context_title?: string;
  sender_id: string;
  sender_name?: string;
  text: string;
  read_by?: string[];
}

export type TipoNotificacion =
  | 'lost_pet'
  | 'urgent_case'
  | 'sighting'
  | 'abuse_report'
  | 'chat_reply'
  | 'case_update';

export interface Notificacion extends RegistroBase {
  user_id: string;
  type: TipoNotificacion;
  title: string;
  body: string;
  ref_id?: string;
  link?: string;
  read?: boolean;
  distance_km?: number;
}

export interface SuscripcionAlertas extends RegistroBase {
  user_id: string;
  user_email?: string;
  lat?: number | null;
  lng?: number | null;
  radius_km?: number;
  location_label?: string;
  notify_lost_pets?: boolean;
  notify_urgent_cases?: boolean;
}
