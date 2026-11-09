import type { EventTrackType } from "./trackTypes"
import type { TrafficSource } from "./trafficSource"

/**
 * Campos a incrementar por un conteo de evento: doc del evento (`analytics.views` o `analytics.clicks`, mismo contrato
 * que sitios) y doc diario `events/{id}/stats/{día}`. `inc` se inyecta (FieldValue.increment) para probarlo sin Firebase.
 * `analytics.shares`/`registrations` siguen siendo de sus acciones de servidor: aquí un share es solo un "clic" del día.
 * ponytail: `link:<código>` cuenta bajo la clave fija `link` hasta que T10 verifique el código contra `links/`.
 */
export function buildTrackWrites<T>(type: EventTrackType, day: string, source: TrafficSource, inc: (n: number) => T) {
  const isView = type === "view"
  const key = source.startsWith("link:") ? "link" : source
  return {
    event: { [isView ? "analytics.views" : "analytics.clicks"]: inc(1) } as Record<string, T>,
    stats: { day, [isView ? "views" : type]: inc(1), ...(isView ? {} : { clicks: inc(1) }), bySource: { [key]: inc(1) } } as Record<string, unknown>,
  }
}
