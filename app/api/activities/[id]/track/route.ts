import type { NextRequest } from "next/server"
import { createServerContainer } from "@/infraestructure/di/container"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { createIpLimiter } from "@/app/api/_lib/ipRateLimit"
import { createGlobalLimiter } from "@/app/api/_lib/beaconGuard"
import { createActivityTrackHandler } from "@/app/api/_lib/eventTrack"

// Mismo techo de escrituras que eventos: 120 aceptadas/min por instancia.
const handle = createActivityTrackHandler({
  record: (...a) => createServerContainer().activityEngagementService.recordTrack(...a),
  day: bogotaDay,
  ipLimit: createIpLimiter(60),
  globalLimit: createGlobalLimiter(120, undefined, () => console.warn("[beacon-activities] tope global por minuto superado: se descartan conteos")),
})

/**
 * Cuenta una vista o acción de la ficha pública de una actividad (público: lo llama el navegador con sendBeacon; la
 * ficha va en caché y no ve a cada visitante). Sin datos personales; actividades inexistentes se ignoran sin lecturas.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/activities/[id]/track">) {
  const { id } = await ctx.params
  return handle(request, id)
}
