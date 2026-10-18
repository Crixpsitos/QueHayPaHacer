/**
 * Lógica pura de las tarjetas (evento y sitio): etiquetas de tiempo, cupos y conteos.
 * Todo el cálculo de "días" se hace en hora de Colombia para que coincida con lo que ve la gente.
 */
const TZ = "America/Bogota";
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Días desde el epoch del día calendario de Bogotá. */
function dayNumber(date: Date): number {
  const [y, m, d] = dayKeyFmt.format(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export type TimingTone = "live" | "soon" | "upcoming";
export interface TimingBadge {
  label: string;
  tone: TimingTone;
}

/**
 * "En curso" / "Hoy" / "Mañana" / "En N días" (hasta 6). Null si no aplica.
 * En eventos de varias fechas no se marca "En curso" (entre funciones no está pasando nada).
 */
export function timingBadge(
  startISO: string | undefined,
  endISO: string | undefined,
  now: Date,
  multiDate = false,
): TimingBadge | null {
  if (!startISO) return null;
  const start = new Date(startISO);
  const end = endISO ? new Date(endISO) : start;
  if (Number.isNaN(start.getTime())) return null;
  if (now > end) return null;
  if (now >= start) return multiDate ? null : { label: "En curso", tone: "live" };
  const diff = dayNumber(start) - dayNumber(now);
  if (diff <= 0) return { label: "Hoy", tone: "soon" };
  if (diff === 1) return { label: "Mañana", tone: "soon" };
  if (diff <= 6) return { label: `En ${diff} días`, tone: "upcoming" };
  return null;
}

export type SpotsTone = "ok" | "low" | "full";
export interface SpotsInfo {
  label: string;
  tone: SpotsTone;
}

/** Cupos restantes; "low" cuando quedan pocos (≤ 5 o ≤ 15 % del aforo). Null si no hay aforo. */
export function spotsInfo(capacity: number | undefined, registrations = 0): SpotsInfo | null {
  if (!capacity || capacity <= 0) return null;
  const left = capacity - Math.max(0, registrations);
  if (left <= 0) return { label: "Agotado", tone: "full" };
  if (left <= Math.max(5, Math.ceil(capacity * 0.15))) {
    return { label: left === 1 ? "Queda 1 cupo" : `Quedan ${left} cupos`, tone: "low" };
  }
  return { label: `${left} cupos`, tone: "ok" };
}

export function registrationLabel(type: "none" | "internal" | "external" | "form"): string {
  switch (type) {
    case "internal":
    case "form":
      return "Inscripción abierta";
    case "external":
      return "Inscripción externa";
    default:
      return "Sin inscripción";
  }
}

/** 950 → "950"; 1.200 → "1,2 k"; 12.400 → "12 k". */
export function compactCount(n: number): string {
  if (n < 1000) return String(Math.max(0, Math.round(n)));
  const k = n / 1000;
  return `${(n < 10_000 ? k.toFixed(1) : String(Math.round(k))).replace(".", ",").replace(/,0$/, "")} k`;
}

/** Texto plano de una descripción que pudo venir con etiquetas HTML. */
export function plainText(value: string | undefined | null): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
