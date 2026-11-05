// Colombia no usa horario de verano: America/Bogota es UTC-5 todo el año.
const OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Inicio y fin (inclusive) del día calendario de Bogotá que contiene `now`. */
export function bogotaDayRange(now: Date): { start: Date; end: Date } {
  const startMs = Math.floor((now.getTime() - OFFSET_MS) / DAY_MS) * DAY_MS + OFFSET_MS;
  return { start: new Date(startMs), end: new Date(startMs + DAY_MS - 1) };
}

/** "domingo 8 de noviembre", siempre en hora de Bogotá (el servidor corre en UTC). */
export function bogotaDayLabel(now: Date): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long" })
    .format(now)
    .replace(/^(\p{L}+),? (\d+) de /u, "$1 $2 de ");
}

/** ¿[start, end] cruza la ventana [from, to]? (inclusive). */
export function overlapsWindow(start: Date, end: Date, from: Date, to: Date): boolean {
  return end.getTime() >= from.getTime() && start.getTime() <= to.getTime();
}
