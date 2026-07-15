/**
 * Backfill: genera `slug` en las sesiones existentes que no lo tengan.
 *
 * El slug es único DENTRO de cada evento, derivado del título (+ sufijo -2, -3…
 * si choca). Se usa en la URL pública /events/{evento}/sessions/{slug}.
 *
 * Uso:
 *   npx tsx scripts/backfill-session-slugs.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/backfill-session-slugs.ts --apply    # aplica los cambios
 *
 * Idempotente: salta las sesiones que ya tienen slug.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { toSlug } from "@/app/lib/utils/slug";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const events = await db.collection("events").where("eventType", "==", "multi-date").get();
  console.log(
    `eventos multi-date: ${events.size} — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );

  let updated = 0;
  let skipped = 0;

  for (const eventDoc of events.docs) {
    const sessionsSnap = await eventDoc.ref.collection("sessions").get();

    // slugs ya presentes en este evento → garantizar unicidad al generar.
    const taken = new Set(
      sessionsSnap.docs
        .map((s) => s.data().slug)
        .filter((s): s is string => typeof s === "string" && s.length > 0),
    );

    const batch = db.batch();
    let ops = 0;

    for (const s of sessionsSnap.docs) {
      const data = s.data();
      if (typeof data.slug === "string" && data.slug.length > 0) {
        skipped++;
        continue;
      }

      const base = toSlug(data.title ?? "") || "sesion";
      let slug = base;
      let i = 2;
      while (taken.has(slug)) slug = `${base}-${i++}`;
      taken.add(slug);

      console.log(`- ${eventDoc.id}/${s.id}: "${data.title ?? "∅"}" → ${slug}`);
      if (APPLY) {
        batch.update(s.ref, { slug });
        ops++;
      }
      updated++;
    }

    if (APPLY && ops > 0) await batch.commit();
  }

  console.log(
    `\nHecho. A actualizar: ${updated}, ya con slug: ${skipped}. ${
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
