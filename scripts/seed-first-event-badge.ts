/**
 * Asigna la insignia "first-event" a un usuario por username y pone
 * metadata.isFirstEvent = true en su último evento publicado/activo.
 *
 * Uso:
 *   npx tsx scripts/seed-first-event-badge.ts --username crixpsitos           # dry-run
 *   npx tsx scripts/seed-first-event-badge.ts --username crixpsitos --apply   # aplica
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const usernameArg = process.argv.find((a) => a.startsWith("--username="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--username") + 1];

if (!usernameArg) {
  console.error("❌  Debes pasar --username <valor>");
  process.exit(1);
}

async function main() {
  const db = getFirebaseFirestore();

  // 1. Buscar usuario por displayName (username)
  const usersSnap = await db
    .collection("users")
    .where("displayName", "==", usernameArg)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    console.error(`❌  No se encontró usuario con displayName = "${usernameArg}"`);
    process.exit(1);
  }

  const userDoc = usersSnap.docs[0];
  const userId = userDoc.id;
  const userData = userDoc.data();
  console.log(`\n✅  Usuario encontrado: ${userData.displayName} (uid: ${userId})`);
  console.log(`   accountType: ${userData.accountType ?? "?"}`);
  console.log(`   professionalStatus: ${userData.professionalStatus ?? "?"}`);

  // 2. Verificar si ya tiene la insignia
  const existingBadge = await db
    .collection("users")
    .doc(userId)
    .collection("badges")
    .doc("first-event")
    .get();

  if (existingBadge.exists) {
    console.log(`\n⚠️   El usuario ya tiene la insignia "first-event". Se omite.`);
  } else {
    // Leer el doc del catálogo de insignias para denormalizar
    const badgeCatalogDoc = await db.collection("badges").doc("first-event").get();
    if (!badgeCatalogDoc.exists) {
      console.error(`\n❌  No existe "badges/first-event" en Firestore. Créalo antes en el catálogo.`);
      process.exit(1);
    }
    const badge = badgeCatalogDoc.data()!;

    console.log(`\n🏅  Insignia a asignar:`);
    console.log(`   name:     ${badge.name}`);
    console.log(`   icon:     ${badge.icon}`);
    console.log(`   criteria: ${badge.criteria?.requirement ?? "—"}`);

    if (APPLY) {
      await db
        .collection("users")
        .doc(userId)
        .collection("badges")
        .doc("first-event")
        .set({
          badgeId: "first-event",
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          category: badge.category,
          earnedAt: FieldValue.serverTimestamp(),
          reason: "Asignado manualmente (seed)",
        });
      console.log(`   ✅ Insignia asignada.`);
    } else {
      console.log(`   🟡 DRY-RUN: insignia NO asignada todavía.`);
    }
  }

  // 3. Buscar el último evento publicado del usuario
  const eventsSnap = await db
    .collection("events")
    .where("author.id", "==", userId)
    .where("status", "==", "published")
    .orderBy("publishedAt", "desc")
    .limit(1)
    .get();

  if (eventsSnap.empty) {
    console.log(`\n⚠️   No se encontró ningún evento publicado para este usuario.`);
    return;
  }

  const eventDoc = eventsSnap.docs[0];
  const eventData = eventDoc.data() as Record<string, unknown>;
  const currentMetadata = (eventData.metadata as Record<string, unknown>) ?? {};
  const alreadyFlagged = currentMetadata.isFirstEvent === true;

  console.log(`\n📅  Último evento publicado:`);
  console.log(`   ID:    ${eventDoc.id}`);
  console.log(`   title: ${eventData.title ?? "?"}`);
  console.log(`   metadata.isFirstEvent actual: ${currentMetadata.isFirstEvent ?? "no definido"}`);

  if (alreadyFlagged) {
    console.log(`\n⚠️   El evento ya tiene metadata.isFirstEvent = true. Se omite.`);
  } else if (APPLY) {
    await db
      .collection("events")
      .doc(eventDoc.id)
      .update({ "metadata.isFirstEvent": true });
    console.log(`\n✅  metadata.isFirstEvent = true guardado en el evento.`);
  } else {
    console.log(`\n🟡 DRY-RUN: metadata.isFirstEvent NO actualizado todavía.`);
  }

  if (!APPLY) {
    console.log(`\n──────────────────────────────────────────────`);
    console.log(`Corre con --apply para aplicar los cambios.`);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
