/**
 * Extiende las fechas de todos los eventos publicados (y sus sesiones) para que
 * vuelvan a ser futuros. Conserva la distribución relativa de días original —
 * todos los eventos quedan entre hoy+1 y hoy+90 días, en el mismo orden.
 *
 * Uso:
 *   npx tsx scripts/reschedule-events.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/reschedule-events.ts --apply    # aplica los cambios
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { Timestamp } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const WINDOW_DAYS = 90;
const MS_PER_DAY = 86_400_000;

async function main() {
  const db = getFirebaseFirestore();
  const now = new Date();

  const snap = await db
    .collection("events")
    .where("status", "==", "published")
    .get();

  console.log(`\n📅 Reschedule eventos — modo ${APPLY ? "APPLY ✏️" : "DRY-RUN 👀"}`);
  console.log(`Total publicados: ${snap.size}\n`);

  let updated = 0;
  let skipped = 0;
  let batchOps = db.batch();
  let ops = 0;

  const flush = async () => {
    if (ops === 0) return;
    if (APPLY) await batchOps.commit();
    batchOps = db.batch();
    ops = 0;
  };

  for (let i = 0; i < snap.docs.length; i++) {
    const doc = snap.docs[i];
    const data = doc.data();

    // Distribuye los eventos en el rango hoy+1 … hoy+WINDOW_DAYS
    const offsetDays = (i % WINDOW_DAYS) + 1;
    const newStart = new Date(now.getTime() + offsetDays * MS_PER_DAY);
    // Conserva la duración original si existe; si no, 3 horas
    let durationMs = 3 * 3600_000;
    if (data.startDate && data.endDate) {
      const origStart = data.startDate.toMillis?.() ?? data.startDate.seconds * 1000;
      const origEnd = data.endDate.toMillis?.() ?? data.endDate.seconds * 1000;
      durationMs = Math.max(origEnd - origStart, 3600_000);
    }
    const newEnd = new Date(newStart.getTime() + durationMs);

    console.log(
      `  ${i + 1}. ${data.title?.slice(0, 40) ?? doc.id} → ${newStart.toLocaleDateString("es-CO")}`,
    );

    batchOps.update(doc.ref, {
      startDate: Timestamp.fromDate(newStart),
      endDate: Timestamp.fromDate(newEnd),
      updatedAt: Timestamp.fromDate(now),
    });
    ops++;
    updated++;

    // Actualizar sesiones del evento (multi-date)
    if (data.eventType === "multi-date") {
      const sessionsSnap = await doc.ref.collection("sessions").get();
      let sessionOffset = 0;
      for (const sessionDoc of sessionsSnap.docs) {
        const sd = sessionDoc.data();
        if (sd.status === "cancelled") continue;
        const sStart = new Date(newStart.getTime() + sessionOffset * 2 * MS_PER_DAY);
        const sEnd = new Date(sStart.getTime() + 3 * 3600_000);
        batchOps.update(sessionDoc.ref, {
          startDate: Timestamp.fromDate(sStart),
          endDate: Timestamp.fromDate(sEnd),
        });
        ops++;
        sessionOffset++;
      }
    }

    // Firestore: máx 500 ops por batch
    if (ops >= 450) await flush();
  }

  await flush();

  console.log(`\nResumen: ${updated} eventos reprogramados, ${skipped} saltados.`);
  if (!APPLY) console.log("⚠️  Dry-run. Pasa --apply para escribir en Firestore.");
}

main().catch(console.error);
