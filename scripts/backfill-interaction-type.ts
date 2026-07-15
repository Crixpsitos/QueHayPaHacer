/**
 * Backfill: pone `type` en las interacciones existentes que no lo tengan.
 *
 * Ahora las interacciones distinguen evento vs sesión (`type: "event" | "session"`
 * + `sessionId`). Las interacciones creadas antes de este cambio no tienen `type`
 * → se les asigna "event" (o "session" si ya traen sessionId, por si acaso).
 *
 * Uso:
 *   npx tsx scripts/backfill-interaction-type.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/backfill-interaction-type.ts --apply    # aplica los cambios
 *
 * Idempotente: salta las interacciones que ya tienen `type`.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  // collectionGroup captura todas las subcolecciones "interactions" (evento y sesión).
  const snap = await db.collectionGroup("interactions").get();
  console.log(
    `interacciones: ${snap.size} — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    // Solo interacciones de eventos (events/…/interactions).
    //
    // `collectionGroup("interactions")` TAMBIÉN captura `sites/{id}/interactions`,
    // que usa el mismo nombre de subcolección pero un `type` con otro significado
    // ("click" | "like" | "share"): es el log del que `getSiteAnalytics` saca su
    // gráfica semanal. Escribirles `type: "event"` la destruiría en silencio.
    if (!doc.ref.path.startsWith("events/")) {
      skipped++;
      continue;
    }

    const data = doc.data();
    if (data.type !== undefined) {
      skipped++;
      continue;
    }

    const type = data.sessionId ? "session" : "event";
    console.log(`- ${doc.ref.path} → type = ${type}`);

    if (APPLY) {
      batch.update(doc.ref, { type });
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
    `\nHecho. A actualizar: ${updated}, ya con type: ${skipped}. ${
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
