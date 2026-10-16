/**
 * Recalcula `listingComplete` y `analytics.score` de los sitios YA existentes (los nuevos o editados lo hacen
 * solos al guardar). DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/backfill-site-score.ts [--apply]
 * Sobrescribe el score actual (p. ej. los aleatorios de los sitios sembrados) con la fórmula de siteRanking.
 * La caché de listados vence sola en ≤1 día (etiqueta `site-list`).
 */
import "./_loadEnv"
import { FieldValue } from "firebase-admin/firestore"
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase"
import { createServerContainer } from "@/infraestructure/di/container"
import { getSiteCompleteness } from "@/domain/entities/sites/siteCompleteness"
import { siteScore } from "@/domain/entities/sites/siteRanking"
import { completenessFromDetail } from "@/presentation/sites/lib/completeness"

const APPLY = process.argv.includes("--apply")

async function main() {
  const db = getFirebaseFirestore()
  const { sitesService } = createServerContainer()
  const snap = await db.collection("sites").select("analytics", "listingComplete").get()
  let changed = 0
  for (const doc of snap.docs) {
    const detail = await sitesService.getSiteDetailById(doc.id)
    if (!detail) continue
    const complete = getSiteCompleteness(completenessFromDetail(detail)).complete
    const a = (doc.get("analytics") ?? {}) as { likes?: number; shares?: number; eventCount?: number; score?: number }
    const score = siteScore(a, complete)
    if (doc.get("listingComplete") === complete && a.score === score) continue
    changed++
    console.log(`${doc.id}  "${detail.name}"  completa=${complete}  score ${a.score ?? "-"} → ${score}`)
    if (APPLY) await doc.ref.update({ listingComplete: complete, "analytics.score": score, updatedAt: FieldValue.serverTimestamp() })
  }
  console.log(`${changed}/${snap.size} sitios ${APPLY ? "actualizados" : "cambiarían (dry-run, usa --apply)"}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
