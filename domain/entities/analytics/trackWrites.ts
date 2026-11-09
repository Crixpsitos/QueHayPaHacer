import type { EventTrackType } from "./trackTypes"
import { sourceKey, type TrafficSource } from "./trafficSource"

/**
 * Campos a incrementar por un conteo de evento: doc del evento (`analytics.views` o `analytics.clicks`, mismo contrato
 * que sitios) y doc diario `events/{id}/stats/{día}`. `inc` se inyecta (FieldValue.increment) para probarlo sin Firebase.
 * `analytics.shares`/`registrations` siguen siendo de sus acciones de servidor: aquí un share es solo un "clic" del día.
 * ponytail: `link:<código>` cuenta bajo la clave fija `link` (sourceKey) hasta que T10 verifique el código contra `links/`.
 */
export function buildTrackWrites<T>(type: EventTrackType, day: string, source: TrafficSource, inc: (n: number) => T) {
  const isView = type === "view"
  const key = sourceKey(source)
  return {
    event: { [isView ? "analytics.views" : "analytics.clicks"]: inc(1) } as Record<string, T>,
    // `viewsBy` cuenta SOLO vistas por origen (bySource mezcla vistas y acciones): permite "visitas por canal" sin mezclar.
    stats: { day, [isView ? "views" : type]: inc(1), ...(isView ? { viewsBy: { [key]: inc(1) } } : { clicks: inc(1) }), bySource: { [key]: inc(1) } } as Record<string, unknown>,
  }
}
