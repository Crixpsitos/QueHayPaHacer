/**
 * Recalcula `analytics.eventCount` (eventos publicados y recientes vinculados al sitio, ver siteEventCount) y el score
 * de TODOS los sitios. La app lo mantiene al día cuando cambia un evento; esto sirve para el estado inicial, para los
 * eventos que se movieron fuera de la app y para el desgaste por tiempo (un evento sale del conteo 90 días después de
 * terminar y nada lo recuenta solo). DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/backfill-site-event-count.ts [--apply]
 * Sobrescribe el eventCount sembrado a mano (scripts/link-events-to-site.ts). Las cachés vencen solas en ≤1 día.
 */
import "./_loadEnv"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { siteScore } from "@/domain/entities/sites/siteRanking"

const APPLY = process.argv.includes("--apply")

async function main() {
  const db = getFirebaseFirestore()
  const { eventsService, sitesService } = createServerContainer()
  const snap = await db.collection("sites").select("name", "analytics", "listingComplete").get()
  let changed = 0
  for (const doc of snap.docs) {
    const a = (doc.get("analytics") ?? {}) as { likes?: number; shares?: number; eventCount?: number; score?: number }
    const count = await eventsService.countRecentBySiteId(doc.id)
    const score = siteScore({ ...a, eventCount: count }, doc.get("listingComplete"))
    if (a.eventCount === count && a.score === score) continue
    changed++
    console.log(`${doc.id}  "${doc.get("name")}"  eventCount ${a.eventCount ?? "-"} → ${count}  score ${a.score ?? "-"} → ${score}`)
    if (APPLY) await sitesService.setEventCount(doc.id, count)
  }
  console.log(`${changed}/${snap.size} sitios ${APPLY ? "actualizados" : "cambiarían (dry-run, usa --apply)"}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
