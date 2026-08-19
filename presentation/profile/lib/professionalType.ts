import type { BusinessCategory } from "@/domain/entities/professional/ProfessionalRequest";

export type ProfessionalType = "organizer" | "business" | "government";

export const PROFESSIONAL_TYPE_LABEL: Record<ProfessionalType, string> = {
  organizer: "Organizador",
  business: "Negocio",
  government: "Entidad gubernamental",
};

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  bar: "Bar",
  cafe: "Café",
  restaurante: "Restaurante",
  discoteca: "Discoteca",
  hotel: "Hotel",
  teatro_cine: "Teatro / Cine",
  museo_galeria: "Museo / Galería",
  parque_tematico: "Parque temático",
  gimnasio: "Gimnasio",
  spa_bienestar: "Spa / Bienestar",
  salon_eventos: "Salón de eventos",
  tienda: "Tienda",
  otro: "Otro",
};

export const isProfessionalType = (value: unknown): value is ProfessionalType =>
  value === "organizer" || value === "business" || value === "government";
