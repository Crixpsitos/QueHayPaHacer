import type { NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createEventTrackHandler } from "@/app/api/_lib/eventTrack"

// Techo de escrituras de este flujo: 120 aceptadas/min por instancia (spec analytics-v2, "Presupuesto de escrituras").
const handle = createEventTrackHandler({
  record: (...a) => createServerContainer().eventInteractionsService.recordTrack(...a),
  day: bogotaDay,
  ipLimit: createIpLimiter(60),
  globalLimit: createGlobalLimiter(120, undefined, () => console.warn("[beacon-events] tope global por minuto superado: se descartan conteos")),
})

/**
 * Cuenta una vista o acción de la ficha pública de un evento (público: lo llama el navegador con sendBeacon). La ficha
 * va en el CDN y no ve a cada visitante, por eso la cuenta sale del cliente. Eventos inexistentes se ignoran sin lecturas.
 * ponytail: no distingue publicados de borradores (exigiría una lectura); el impacto es solo un contador.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/events/[id]/track">) {
  const { id } = await ctx.params
  return handle(request, id)
}
