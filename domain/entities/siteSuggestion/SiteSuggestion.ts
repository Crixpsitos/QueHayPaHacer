export const SUGGESTION_FIELDS = ["hours", "address", "contact", "prices", "access", "closed", "other"] as const;
export type SuggestionField = (typeof SUGGESTION_FIELDS)[number];

export const SUGGESTION_FIELD_LABELS: Record<SuggestionField, string> = {
  hours: "Horario",
  address: "Dirección o ubicación",
  contact: "Teléfono o contacto",
  prices: "Precios",
  access: "Acceso y condiciones",
  closed: "Ya cerró o no existe",
  other: "Otro",
};

export type SuggestionStatus = "pending" | "applied" | "rejected";

export const SUGGESTION_DESCRIPTION_MIN = 10;
export const SUGGESTION_DESCRIPTION_MAX = 600;
export const SUGGESTION_SOURCE_MAX = 300;
export const MAX_PENDING_SUGGESTIONS_PER_USER = 10;

/** Sugerencia de cambio de un sitio. Colección `siteSuggestions` (solo Admin SDK). Nunca se aplica sola. */
export interface SiteSuggestion {
  siteId: string;
  /** Snapshot del nombre al sugerir. */
  siteName: string;
  authorUid: string;
  authorName: string;
  field: SuggestionField;
  description: string;
  source?: string;
  declaration: true;
  termsVersion: string;
  status: SuggestionStatus;
}

/** Sugerencia tal como la ve el autor del sitio (sin uid de quien la envió). Fechas en ms. */
export interface SiteSuggestionItem {
  id: string;
  siteId: string;
  siteName: string;
  /** Solo displayName de quien sugiere. */
  authorName: string;
  field: SuggestionField;
  description: string;
  source?: string;
  status: SuggestionStatus;
  createdAt: number;
  resolvedAt?: number;
  resolutionNote?: string;
}

export const SUGGESTION_NOTE_MAX = 200;

export interface SuggestionSiteSnapshot {
  name: string;
  published: boolean;
  authorId: string | null;
}

/** Reglas puras. Devuelve el mensaje de error o null si la sugerencia procede. */
export function suggestionRuleError(i: {
  site: SuggestionSiteSnapshot | null;
  uid: string | null;
  /** Pendientes del usuario (todas), para contar y detectar duplicado sitio+campo. */
  pending: { siteId: string; field: string }[];
  siteId: string;
  field: SuggestionField;
}): string | null {
  if (!i.uid) return "Inicia sesión para sugerir un cambio.";
  if (!i.site || !i.site.published) return "No encontramos este lugar.";
  if (i.site.authorId === i.uid) return "Eres el autor de este lugar: edítalo directamente.";
  if (i.pending.some((p) => p.siteId === i.siteId && p.field === i.field))
    return "Ya enviaste una sugerencia sobre esto. La estamos revisando.";
  if (i.pending.length >= MAX_PENDING_SUGGESTIONS_PER_USER)
    return "Tienes varias sugerencias en revisión. Espera a que las revisemos antes de enviar otra.";
  return null;
}
