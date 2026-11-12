/** Escala del reloj del día (hub): de 6 a. m. a 10 p. m. Lo que empieza fuera se agrupa en la barra de la orilla. */
export const CLOCK_FIRST_HOUR = 6
export const CLOCK_LAST_HOUR = 22
const DEFAULT_DURATION_MIN = 60

export const clampClockHour = (h: number) => Math.min(CLOCK_LAST_HOUR, Math.max(CLOCK_FIRST_HOUR, Math.floor(h)))

export function hhmmToMinutes(hhmm: string | null | undefined): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm ?? "")
  if (!m) return null
  const h = Number(m[1]), min = Number(m[2])
  return h < 24 && min < 60 ? h * 60 + min : null
}

/** Cuántas actividades empiezan en cada hora de la escala (las sin hora fija no cuentan). */
export function hourlyCounts(entries: readonly { hhmm: string | null }[]): number[] {
  const out = Array<number>(CLOCK_LAST_HOUR - CLOCK_FIRST_HOUR + 1).fill(0)
  for (const e of entries) {
    const m = hhmmToMinutes(e.hhmm)
    if (m === null) continue
    const h = Math.floor(m / 60)
    if (h > CLOCK_LAST_HOUR) continue
    out[clampClockHour(h) - CLOCK_FIRST_HOUR]++
  }
  return out
}

/** ¿Está pasando a esa hora (minutos desde medianoche)? Desde que empieza hasta que termina; sin duración, 1 hora. */
export function isActiveAt(startMin: number, durationMin: number | null, atMin: number): boolean {
  return atMin >= startMin && atMin < startMin + (durationMin ?? DEFAULT_DURATION_MIN)
}
