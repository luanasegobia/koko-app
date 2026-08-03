import { z } from "zod";

export const mascotaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  species: z.enum(["perro", "gato", "otro"]),
  breed: z.string().optional().default(""),
  age_years: z.coerce.number().min(0).optional(),
  sex: z.enum(["macho", "hembra"]).optional(),
  photo_url: z.string().optional().default(""),
  description: z.string().optional().default(""),
  allergies: z.string().optional().default(""),
  owner_name: z.string().optional().default(""),
  owner_phone: z.string().optional().default(""),
  owner_whatsapp: z.string().optional().default(""),
});

export const mascotaPerdidaSchema = z.object({
  pet_name: z.string().min(1, "El nombre es obligatorio"),
  species: z.enum(["perro", "gato", "otro"]),
  breed: z.string().optional().default(""),
  age_years: z.coerce.number().min(0).optional(),
  photo_url: z.string().optional().default(""),
  description: z.string().optional().default(""),
  last_seen_address: z.string().optional().default(""),
  contact_phone: z.string().optional().default(""),
  contact_whatsapp: z.string().optional().default(""),
});

export const mascotaAdopcionSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  species: z.enum(["perro", "gato", "otro"]),
  breed: z.string().optional().default(""),
  age_years: z.coerce.number().min(0).optional(),
  sex: z.enum(["macho", "hembra"]).optional(),
  size: z.enum(["pequeño", "mediano", "grande"]).optional(),
  photo_url: z.string().optional().default(""),
  description: z.string().optional().default(""),
  vaccinated: z.boolean().optional().default(false),
  sterilized: z.boolean().optional().default(false),
  contact_name: z.string().optional().default(""),
  contact_phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
});

export const veterinariaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  is_emergency: z.boolean().optional().default(false),
  services: z.string().optional().default(""),
  bio: z.string().optional().default(""),
});

export const casoUrgenteSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  published_by: z.string().optional().default(""),
  goal_amount: z.coerce.number().min(0).optional().default(0),
  donation_alias: z.string().optional().default(""),
  photo_url: z.string().optional().default(""),
});

export const denunciaSchema = z.object({
  type: z.enum(["urgente", "regular", "anonima"]),
  description: z.string().min(1, "La descripción es obligatoria"),
  address: z.string().optional().default(""),
  reporter_name: z.string().optional().default(""),
  reporter_phone: z.string().optional().default(""),
});
