import * as v from "valibot"
import { ACTIVITY_TRACK_TYPES } from "@/domain/entities/analytics/trackTypes"
import { CHANNELS, SOURCES } from "@/domain/entities/analytics/trafficSource"

export const ActivityIdSchema = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))
/** `src` es opcional y de lista cerrada (o `link:<código>` / `ch:<canal>`): el cliente nunca elige una clave libre. */
export const ActivityTrackBodySchema = v.object({
  type: v.picklist(ACTIVITY_TRACK_TYPES),
  src: v.optional(v.union([v.picklist(SOURCES), v.pipe(v.string(), v.regex(/^link:[A-Za-z0-9]{7}$/)), v.picklist(CHANNELS.map((c) => `ch:${c}` as const))])),
})
