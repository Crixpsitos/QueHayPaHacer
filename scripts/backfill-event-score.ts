/**
 * Backfill: escribe `analytics.score = 0` en los eventos que no tengan score.
 *
 * Los listados (findAllEvents/findWeekendEvents/...) hacen
 * `orderBy("analytics.score")`, y Firestore EXCLUYE cualquier doc que no tenga
 * el campo del orderBy. Un evento sin `analytics.score` nunca aparece en los
 * listados (típico de eventos multi-date, cuyo encabezado no traía analytics).
 *
 * Uso:
 *   npx tsx scripts/backfill-event-score.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/backfill-event-score.ts --apply    # aplica los cambios
 *
 * Idempotente: salta los que ya tienen analytics.score definido.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("events").get();
  console.log(
    `events: ${snap.size} docs — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.analytics?.score !== undefined) {
      skipped++;
      continue;
    }

    console.log(
      `- ${doc.id}: "${data.title ?? "∅"}" (${data.eventType ?? "standard"}/${data.status ?? "?"}) → analytics.score = 0`,
    );

    if (APPLY) {
      // Dot-notation: crea/mergea analytics.score sin tocar el resto de analytics.
      batch.update(doc.ref, { "analytics.score": 0 });
      ops++;
      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    updated++;
  }

  if (APPLY && ops > 0) await batch.commit();

  console.log(
    `\nHecho. A actualizar: ${updated}, ya con score: ${skipped}. ${
      APPLY ? "✅ ESCRITO en Firestore." : "🟡 DRY-RUN: nada escrito (corre con --apply)."
    }`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("backfill falló:", e);
    process.exit(1);
  });
