/**
 * Limpieza: elimina los likes POR SESIÓN, que dejaron de existir.
 *
 * El like es el estado de una persona (el doc de interacción ES su uid), así que
 * un like al evento y otro a una de sus fechas contaban a la misma persona dos
 * veces e inflaban el score. Ahora el like vive solo en el evento; de la sesión
 * solo quedan ACCIONES (vistas, registros, shares).
 *
 * Borra `events/{id}/sessions/{sid}/interactions/*` y el contador
 * `analytics.likes` de cada sesión. NO toca las interacciones del evento
 * (`events/{id}/interactions`) ni la proyección de perfil `users/{uid}/interactions`.
 *
 * Uso:
 *   npx tsx scripts/cleanup-session-likes.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/cleanup-session-likes.ts --apply    # aplica los cambios
 *
 * Idempotente: si ya no hay interacciones de sesión ni `analytics.likes`, no hace nada.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const sessions = await db.collectionGroup("sessions").get();
  console.log(
    `sesiones: ${sessions.size} — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );

  let deletedInteractions = 0;
  let clearedCounters = 0;
  let batch = db.batch();
  let ops = 0;

  const flush = async () => {
    if (APPLY && ops > 0) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  };

  for (const session of sessions.docs) {
    // Solo sesiones de eventos (events/{id}/sessions/{sid}), por si el nombre
    // "sessions" se reusa en otra colección más adelante.
    if (!session.ref.path.startsWith("events/")) continue;

    const interactions = await session.ref.collection("interactions").get();
    for (const interaction of interactions.docs) {
      console.log(`- borrar ${interaction.ref.path}`);
      if (APPLY) {
        batch.delete(interaction.ref);
        ops++;
        if (ops >= 400) await flush();
      }
      deletedInteractions++;
    }

    const likes = session.get("analytics.likes");
    if (likes !== undefined) {
      console.log(
        `- limpiar analytics.likes (=${likes}) en ${session.ref.path}`,
      );
      if (APPLY) {
        batch.update(session.ref, { "analytics.likes": FieldValue.delete() });
        ops++;
        if (ops >= 400) await flush();
      }
      clearedCounters++;
    }
  }

  await flush();

  console.log(
    `\nHecho. Interacciones de sesión a borrar: ${deletedInteractions}, contadores analytics.likes a limpiar: ${clearedCounters}. ${
      APPLY
        ? "✅ ESCRITO en Firestore."
        : "🟡 DRY-RUN: nada escrito (corre con --apply)."
    }`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("cleanup falló:", e);
    process.exit(1);
  });
