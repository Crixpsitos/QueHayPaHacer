/**
 * Backfill: escribe `startDate`/`endDate` en los eventos multi-date existentes.
 *
 * Los eventos multi-date no guardan fechas propias (viven en las sesiones), así
 * que quedaban fuera de los listados que filtran por rango de fecha
 * (findAllEvents, findWeekendEvents, findFeaturedEvents...). Este script deriva:
 *   - startDate = inicio más temprano de sus sesiones (no canceladas)
 *   - endDate   = fin más tardío de sus sesiones (no canceladas)
 * y los escribe en el doc del evento. Es el equivalente por lotes de lo que ya
 * hace el runtime (syncEventDateRange) en cada publicación/mutación de sesión.
 *
 * Uso:
 *   npx tsx scripts/backfill-multidate-dates.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/backfill-multidate-dates.ts --apply    # aplica los cambios
 *
 * Idempotente: si el evento ya tiene el mismo rango calculado, lo salta.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

/** Timestamp | Date | string | number → ms (o null si no es fecha válida). */
function toMillis(v: unknown): number | null {
  if (v instanceof Timestamp) return v.toMillis();
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v.getTime();
  if (typeof v === "string" || typeof v === "number") {
    const ms = new Date(v).getTime();
    return isNaN(ms) ? null : ms;
  }
  return null;
}

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db
    .collection("events")
    .where("eventType", "==", "multi-date")
    .get();

  console.log(
    `eventos multi-date: ${snap.size} — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );

  let updated = 0;
  let skipped = 0;
  let noSessions = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const sessionsSnap = await doc.ref.collection("sessions").get();

    // Mismo criterio que el runtime: excluir canceladas.
    const ranges = sessionsSnap.docs
      .map((s) => s.data())
      .filter((d) => d.status !== "cancelled")
      .map((d) => ({ start: toMillis(d.startDate), end: toMillis(d.endDate) }))
      .filter((r): r is { start: number; end: number } => r.start !== null && r.end !== null);

    if (ranges.length === 0) {
      noSessions++;
      console.log(`- ${doc.id}: ⚠️  sin sesiones con fecha válida → se salta`);
      continue;
    }

    const startMs = Math.min(...ranges.map((r) => r.start));
    const endMs = Math.max(...ranges.map((r) => r.end));

    // Ya correcto → idempotente.
    const curStart = toMillis(doc.data().startDate);
    const curEnd = toMillis(doc.data().endDate);
    if (curStart === startMs && curEnd === endMs) {
      skipped++;
      continue;
    }

    console.log(
      `- ${doc.id}: "${doc.data().title ?? "∅"}" · ${ranges.length} sesión(es) · ` +
        `${new Date(startMs).toISOString()} → ${new Date(endMs).toISOString()}` +
        (curStart === null ? "  (sin fechas previas)" : "  (actualiza rango)"),
    );

    if (APPLY) {
      batch.set(
        doc.ref,
        {
          startDate: Timestamp.fromMillis(startMs),
          endDate: Timestamp.fromMillis(endMs),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
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
    `\nHecho. A actualizar: ${updated}, ya correctos: ${skipped}, sin sesiones: ${noSessions}. ${
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
