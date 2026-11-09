import type { NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { isChannel } from "@/domain/entities/analytics/trafficSource"
import { autoLandingPath } from "@/domain/entities/links/autoLinks"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createOutHandler } from "@/app/r/_lib/outRedirect"

const handle = createOutHandler({
  resolve: async (id, ch) => {
    const doc = await createServerContainer().sitesService.getOutLinks(id) // null si no está publicado y aprobado
    return doc ? autoLandingPath("site", id, ch ?? "") : null
  },
  record: async (id, ch) => {
    if (isChannel(ch)) await createServerContainer().dailyStatsRepository.recordLinkClick("sites", id, ch, bogotaDay())
  },
  ipLimit: createIpLimiter(60),
  readLimit: createIpLimiter(30),
  globalLimit: createGlobalLimiter(300, undefined, () => console.warn("[out-auto-sites] tope global por minuto superado: se descartan conteos")),
})

/** Enlace corto automático de un sitio por canal: `/r/s/<id>/ig|ig_h|wa|fb|x|tt|qr` → 307 a la ficha con `ch` y utm. */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/s/[id]/[ch]">) {
  const { id, ch } = await ctx.params
  return handle(request, id, new URLSearchParams({ to: ch }))
}
