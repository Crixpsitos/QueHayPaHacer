import { NextResponse, type NextRequest } from "next/server"
import * as v from "valibot"
import { createServerContainer } from "@/infraestructure/di/container"
import { SiteIdSchema, SiteTrackBodySchema } from "@/application/dto/sites/SiteTrackDto"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { clientIp, createIpLimiter } from "@/app/api/_lib/ipRateLimit"

const allowed = createIpLimiter(60)

/**
 * Cuenta una vista o un clic de la ficha pública de un sitio. Público: lo llama el navegador con sendBeacon.
 * La ficha va en el CDN y no ve a cada visitante, por eso la cuenta sale del cliente. Sitios inexistentes se
 * ignoran (sin lecturas: `update()` falla con NOT_FOUND); cada IP tiene un tope por minuto.
 * ponytail: no distingue sitios públicos de borradores (exigiría una lectura por evento); el impacto es solo un contador.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/sites/[id]/track">) {
  const { id } = await ctx.params
  const body = v.safeParse(SiteTrackBodySchema, await request.json().catch(() => null))
  if (!v.safeParse(SiteIdSchema, id).success || !body.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }
  if (!allowed(clientIp(request))) return new NextResponse(null, { status: 429 })

  try {
    await createServerContainer().sitesService.recordTrack(id, body.output.type, bogotaDay())
  } catch (error) {
    console.error("[site-track]", error)
  }
  return new NextResponse(null, { status: 204 })
}
