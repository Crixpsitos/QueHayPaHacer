/**
 * Recalcula `analytics.eventCount` (eventos publicados vinculados al sitio que son próximos, están en curso o
 * terminaron hace menos de 7 días; ver siteEventCount), su vencimiento `eventCountValidUntil` y el score de TODOS los
 * sitios. La app lo mantiene al día cuando cambia un evento; esto sirve para el estado inicial, para los eventos que
 * se movieron fuera de la app y para el desgaste por tiempo (un evento sale del conteo 7 días después de terminar; el
 * barrido horario /api/sites/recompute-expired lo corrige, y esto cubre lo anterior a él). Escribe
 * `eventCountValidUntil` en TODOS los sitios, también con conteo 0 (null = no vence solo): el barrido solo encuentra
 * sitios que tienen el campo con una fecha. DRY-RUN por defecto; nada se escribe sin --apply.
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
  let withoutField = 0
  for (const doc of snap.docs) {
    const a = (doc.get("analytics") ?? {}) as {
      likes?: number
      shares?: number
      eventCount?: number
      score?: number
      eventCountValidUntil?: { toDate?: () => Date } | null
    }
    const state = await eventsService.siteEventStateBySiteId(doc.id)
    const score = siteScore({ ...a, eventCount: state.count }, doc.get("listingComplete"))
    const storedUntil = a.eventCountValidUntil?.toDate?.()?.getTime() ?? null
    const nextUntil = state.validUntil?.getTime() ?? null
    const fieldMissing = a.eventCountValidUntil === undefined
    if (fieldMissing) withoutField++
    if (a.eventCount === state.count && a.score === score && storedUntil === nextUntil && !fieldMissing) continue
    changed++
    console.log(
      `${doc.id}  "${doc.get("name")}"  eventCount ${a.eventCount ?? "-"} → ${state.count}  score ${a.score ?? "-"} → ${score}  vence ${state.validUntil?.toISOString() ?? "nunca"}${fieldMissing ? "  (sin campo hoy)" : ""}`,
    )
    if (APPLY) await sitesService.setEventCount(doc.id, state)
  }
  console.log(`${withoutField}/${snap.size} sitios sin el campo eventCountValidUntil hoy (el barrido no los ve)`)
  console.log(`${changed}/${snap.size} sitios ${APPLY ? "actualizados" : "cambiarían (dry-run, usa --apply)"}`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
