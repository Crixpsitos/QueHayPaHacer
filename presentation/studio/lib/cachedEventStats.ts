import { cacheLife, cacheTag } from "next/cache";
import { createServerContainer } from "@/infraestructure/di/container";
import type { EventStats } from "@/domain/entities/studio/Studio";

/**
 * Stats de un evento (KPIs + curva de ritmo de inscripción) cacheadas por `id`.
 * La page de detalle y los slots `@stats`/`@registrations` la llaman todos →
 * al ser la misma función con el mismo arg, comparten UNA entrada de cache
 * (dedupe: 3 lecturas de `getEventStats` → 1, incluido el pipeline de la ramp).
 *
 * Tag `event-<id>` → las actions que muten el evento pueden `updateTag` para
 * refrescar al instante. `minutes` acota el stale de los contadores (views/
 * likes/registros) que cambian por interacciones públicas fuera de esas actions.
 */
export async function getCachedEventStats(id: string): Promise<EventStats | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`event-${id}`);
  const { studioService } = createServerContainer();
  return studioService.getEventStats(id);
}
