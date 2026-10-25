import * as v from "valibot"
import { SITE_TRACK_TYPES } from "@/domain/entities/sites/siteStats"

export const SiteIdSchema = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,128}$/))
export const SiteTrackBodySchema = v.object({ type: v.picklist(SITE_TRACK_TYPES) })
