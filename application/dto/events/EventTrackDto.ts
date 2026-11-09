import * as v from "valibot"
import { EVENT_TRACK_TYPES } from "@/domain/entities/analytics/trackTypes"
import { SOURCES } from "@/domain/entities/analytics/trafficSource"

export const EventIdSchema = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))
/** `src` es opcional y de lista cerrada (o `link:<código>`): el cliente nunca elige una clave libre. */
export const EventTrackBodySchema = v.object({
  type: v.picklist(EVENT_TRACK_TYPES),
  src: v.optional(v.union([v.picklist(SOURCES), v.pipe(v.string(), v.regex(/^link:[A-Za-z0-9]{7}$/))])),
})
