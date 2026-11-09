import { after, type NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay, isSiteTrackType } from "@/domain/entities/sites/siteStats"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createOutHandler } from "@/app/r/_lib/outRedirect"
import { resolveSiteTarget } from "@/app/r/_lib/resolveTarget"

const handle = createOutHandler({
  resolve: async (id, to, network) => {
    const doc = await createServerContainer().sitesService.getOutLinks(id)
    return doc ? resolveSiteTarget(to, network, doc) : null
  },
  record: async (id, to) => {
    if (!isSiteTrackType(to)) return // `to` ya está validado por resolveSiteTarget; esto es cinturón y tirantes
    await createServerContainer().sitesService.recordTrack(id, to, bogotaDay(), "direct")
  },
  ipLimit: createIpLimiter(60),
  readLimit: createIpLimiter(30), // lecturas a la base por IP y minuto (solo destinos fuera de caché)
  globalLimit: createGlobalLimiter(600, undefined, () => console.warn("[out-sites] tope global por minuto superado: se descartan conteos")),
  schedule: (fn) => after(fn),
})

/** Salida rastreada de un sitio: `?to=website|booking|social[&n=instagram…]` → 307 al enlace guardado. */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/s/[id]">) {
  const { id } = await ctx.params
  return handle(request, id, request.nextUrl.searchParams)
}
