import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { hasValidBearer } from "@/app/api/_lib/bearerAuth";
import { tagsForChangedSites } from "@/app/api/sites/_lib/siteTags";
import { recomputeExpiredSites } from "@/app/api/sites/_lib/recomputeExpired";
import { createServerContainer } from "@/infraestructure/di/container";

/**
 * Barrido de conteos de eventos vencidos. Lo llama cada hora la Cloud Function programada `recomputeSiteEvents`
 * (repo functions): recalcula `eventCount`, el puntaje y el nuevo `eventCountValidUntil` de los sitios cuyo
 * vencimiento ya pasó y, si algo visible cambió, invalida la caché (mismos tags que /api/sites/revalidate).
 * Auth: Bearer `SITE_REVALIDATE_WEBHOOK_SECRET`. Solo POST. Idempotente: dos ejecuciones seguidas no hacen daño.
 * Respuesta: { processed, changed, failed, remaining, oldestOverdueMs }.
 * ponytail: a esta escala basta la consulta de rango; si crece mucho, un índice de campo único en
 * sites.analytics.eventCountValidUntil.
 */
export async function POST(request: Request) {
  const secret = process.env.SITE_REVALIDATE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Revalidation webhook is not configured." }, { status: 503 });
  if (!hasValidBearer(request, secret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sitesService, eventsService } = createServerContainer();
  const { invalidate, ...result } = await recomputeExpiredSites(
    {
      listExpired: (now, limit) => sitesService.findExpiredEventCounts(now, limit),
      countExpired: (now) => sitesService.countExpiredEventCounts(now),
      recompute: async (id) => sitesService.setEventCount(id, await eventsService.siteEventStateBySiteId(id)),
      now: () => Date.now(),
    },
    { onError: (siteId, error) => console.error("[recompute-expired]", siteId, error) },
  );

  for (const tag of tagsForChangedSites(invalidate)) revalidateTag(tag, { expire: 0 });
  return NextResponse.json(result);
}
