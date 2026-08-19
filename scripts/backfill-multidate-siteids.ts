/**
 * Backfill: escribe siteIds[] en los eventos multi-date existentes
 * que tienen sesiones con location.siteId.
 *
 * Uso:
 *   npx tsx scripts/backfill-multidate-siteids.ts            # dry-run
 *   npx tsx scripts/backfill-multidate-siteids.ts --apply    # aplica
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("events").where("eventType", "==", "multi-date").get();
  console.log(`\nevents multi-date: ${snap.size} — modo ${APPLY ? "APPLY ✏️" : "DRY-RUN 👀"}\n`);

  let updated = 0, skipped = 0, noSiteIds = 0;

  for (const doc of snap.docs) {
    const sessionsSnap = await doc.ref.collection("sessions").get();
    const siteIds = [
      ...new Set(
        sessionsSnap.docs
          .map((s) => s.data())
          .filter((d) => d.status !== "cancelled" && d.location?.siteId)
          .map((d) => d.location.siteId as string),
      ),
    ];

    if (siteIds.length === 0) { noSiteIds++; continue; }

    const existing: string[] = doc.data().siteIds ?? [];
    const same = existing.length === siteIds.length && siteIds.every((id) => existing.includes(id));
    if (same) { skipped++; continue; }

    console.log(`  ${doc.id}: ${siteIds.join(", ")}`);
    if (APPLY) {
      await doc.ref.update({ siteIds, updatedAt: FieldValue.serverTimestamp() });
    }
    updated++;
  }

  console.log(`\nA actualizar: ${updated}, ya correctos: ${skipped}, sin siteId: ${noSiteIds}.`);
  if (!APPLY) console.log("⚠️  Dry-run. Pasa --apply para escribir.");
}

main().catch((e) => { console.error(e); process.exit(1); });
