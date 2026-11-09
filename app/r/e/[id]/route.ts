import { after, type NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createOutHandler } from "@/app/r/_lib/outRedirect"
import { resolveEventTarget } from "@/app/r/_lib/resolveTarget"

const handle = createOutHandler({
  resolve: async (id, to) => {
    const event = await createServerContainer().eventsService.getEventById(id)
    return event?.status === "published" ? resolveEventTarget(to, event) : null
  },
  record: async (id) => {
    const c = createServerContainer()
    await c.eventInteractionsService.recordTrack(id, "register_external", bogotaDay(), "direct")
    await c.studioService.incrementExternalRegistrationClick(id) // contador histórico del botón (lo lee el estudio)
  },
  ipLimit: createIpLimiter(60),
  globalLimit: createGlobalLimiter(120, undefined, () => console.warn("[out-events] tope global por minuto superado: se descartan conteos")),
  schedule: (fn) => after(fn),
})

/** Salida rastreada de un evento: `?to=register` → 307 al `externalUrl` guardado. El destino NUNCA sale de la URL. */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/e/[id]">) {
  const { id } = await ctx.params
  return handle(request, id, request.nextUrl.searchParams)
}
