/** Frenos antispam de sugerencias y reclamos. Todos los números se ajustan AQUÍ (los usan el servicio y los tests). */
export const SPAM_LIMITS = {
  /** Mínimo entre dos envíos del mismo usuario. */
  cooldownMs: 30_000,
  suggestionsPerHour: 5,
  suggestionsPerDay: 20,
  claimsPerDay: 3,
  /** Actividades nuevas por día y cuántas pueden estar en revisión a la vez. */
  activitiesPerDay: 3,
  activitiesPendingMax: 3,
  /** Un texto idéntico (normalizado) de la misma persona en cualquier sitio se rechaza dentro de esta ventana. */
  duplicateWindowMs: 7 * 24 * 3_600_000,
  /** Antigüedad mínima de la cuenta para enviar. */
  minAccountAgeMs: 10 * 60_000,
} as const;

/** Envío previo del usuario: fecha (ms) y texto normalizado (solo sugerencias). */
export interface RecentSubmission {
  at: number;
  text?: string;
}

/** Minúsculas y espacios colapsados: "Abren  a las 8" == "abren a las 8". */
export const normalizeText = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const WORDS = {
  suggestion: { sing: "sugerencia", plur: "sugerencias", other: "otra", verb: "enviar" },
  claim: { sing: "reclamo", plur: "reclamos", other: "otro", verb: "enviar" },
  activity: { sing: "actividad", plur: "actividades", other: "otra", verb: "crear" },
} as const;

/** Decisión pura. Devuelve el mensaje de error o null si el envío puede seguir. `accountCreatedAt` ausente = no se comprueba. */
export function spamGuardError(i: {
  kind: "suggestion" | "claim" | "activity";
  recent: RecentSubmission[];
  now: number;
  /** Texto del envío actual (sin normalizar), para detectar duplicados. */
  text?: string;
  accountCreatedAt?: number;
  /** Solo actividades: cuántas siguen en revisión. */
  pendingCount?: number;
}): string | null {
  const { kind, recent, now } = i;
  const w = WORDS[kind];
  const L = SPAM_LIMITS;

  if (i.accountCreatedAt !== undefined && now - i.accountCreatedAt < L.minAccountAgeMs)
    return `Tu cuenta es muy reciente. Podrás ${w.verb} ${w.plur} en unos minutos.`;
  if (recent.some((r) => now - r.at < L.cooldownMs)) return `Espera unos segundos antes de ${w.verb} ${w.other} ${w.sing}.`;

  const inLast = (ms: number) => recent.filter((r) => now - r.at < ms).length;
  const duplicate = () => {
    const norm = i.text ? normalizeText(i.text) : "";
    return Boolean(norm && recent.some((r) => r.text === norm && now - r.at < L.duplicateWindowMs));
  };
  if (kind === "suggestion") {
    if (inLast(HOUR) >= L.suggestionsPerHour) return "Llegaste al límite de sugerencias por hora; intenta más tarde.";
    if (inLast(DAY) >= L.suggestionsPerDay) return "Llegaste al límite de sugerencias por día; intenta mañana.";
    if (duplicate()) return "Ya enviaste esta misma sugerencia. Si es otro cambio, descríbelo con tus palabras.";
  } else if (kind === "claim") {
    if (inLast(DAY) >= L.claimsPerDay) return "Llegaste al límite de reclamos por día; intenta mañana.";
  } else {
    if ((i.pendingCount ?? 0) >= L.activitiesPendingMax) return "Tienes varias actividades en revisión. Espera a que las revisemos antes de crear otra.";
    if (inLast(DAY) >= L.activitiesPerDay) return "Llegaste al límite de actividades por día; intenta mañana.";
    if (duplicate()) return "Ya creaste una actividad igual hace poco. Si es otra, descríbela con tus palabras.";
  }
  return null;
}
