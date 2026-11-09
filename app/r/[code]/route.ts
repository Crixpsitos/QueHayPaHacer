import { after, type NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { landingPath } from "@/domain/entities/links/link"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createOutHandler } from "@/app/r/_lib/outRedirect"

const handle = createOutHandler({
  // Destino = ficha guardada en el enlace, nunca algo de la petición. `to` no se usa aquí.
  resolve: async (code) => {
    const link = await createServerContainer().linksService.resolve(code)
    return link ? landingPath(link.target, link.code) : null
  },
  record: (code) => createServerContainer().linksService.recordClick(code, bogotaDay()),
  ipLimit: createIpLimiter(60),
  globalLimit: createGlobalLimiter(300, undefined, () => console.warn("[out-links] tope global por minuto superado: se descartan conteos")),
  schedule: (fn) => after(fn),
})

/** Enlace de campaña `yquehaypahacer.com/r/<código>` → 307 a la ficha con `utm_*` y `qr=<código>`; código desconocido → 404. */
export async function GET(request: NextRequest, ctx: RouteContext<"/r/[code]">) {
  const { code } = await ctx.params
  // Se ignora todo el query: no puede cambiar el destino. "click" solo etiqueta el conteo (ver outRedirect).
  return handle(request, code, new URLSearchParams({ to: "click" }))
}
