import * as v from "valibot"
import { SITE_TRACK_TYPES } from "@/domain/entities/sites/siteStats"
import { CHANNELS, SOURCES } from "@/domain/entities/analytics/trafficSource"

export const SiteIdSchema = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))
/** `src` es opcional y de lista cerrada (o `link:<código>`): el cliente nunca elige una clave libre. */
export const SiteTrackBodySchema = v.object({
  type: v.picklist(SITE_TRACK_TYPES),
  src: v.optional(v.union([v.picklist(SOURCES), v.pipe(v.string(), v.regex(/^link:[A-Za-z0-9]{7}$/)), v.picklist(CHANNELS.map((c) => `ch:${c}` as const))])),
})
