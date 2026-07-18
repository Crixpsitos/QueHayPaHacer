/**
 * Borra los eventos (y sus sesiones) de prueba creados por
 * seed-events-with-collaborators.ts para un owner, más sus perfiles externos seed.
 * Seguro: solo toca docs de ESE owner que estén marcados `seed:true` o cuyo título
 * coincida con los del seed.
 *
 * Uso:
 *   npx tsx scripts/cleanup-test-events.ts <owner-email>
 *   npx tsx scripts/cleanup-test-events.ts cristianpee2609@gmail.com
 */
export {}; // módulo

for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

const SEED_EVENT_TITLES = ["Concierto de prueba (standard)", "Festival de prueba (multi-date)"];
const SEED_EXTERNAL_NAMES = ["Sonido Vivo", "DJ Aurora"];

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const db = getFirebaseFirestore();

  const ownerEmail = (process.argv[2] ?? "").trim().toLowerCase();
  if (!ownerEmail) {
    console.error("Falta el correo. Uso: npx tsx scripts/cleanup-test-events.ts <owner-email>");
    process.exit(1);
  }

  const ownerSnap = await db.collection("users").where("email", "==", ownerEmail).limit(1).get();
  if (ownerSnap.empty) {
    console.error(`No encontré un usuario con el correo ${ownerEmail}.`);
    process.exit(1);
  }
  const ownerUid = ownerSnap.docs[0].id;

  // Eventos del owner que sean seed (marca o título).
  const eventsSnap = await db.collection("events").where("author.id", "==", ownerUid).get();
  const testEvents = eventsSnap.docs.filter((d) => {
    const e = d.data() as { title?: string; metadata?: { seed?: boolean } };
    return e.metadata?.seed === true || SEED_EVENT_TITLES.includes(e.title ?? "");
  });

  let sessionsDeleted = 0;
  for (const ev of testEvents) {
    const sessions = await ev.ref.collection("sessions").get();
    for (const s of sessions.docs) {
      await s.ref.delete();
      sessionsDeleted++;
    }
    await ev.ref.delete();
  }

  // Perfiles externos seed del owner.
  const extSnap = await db.collection("externalProfiles").where("managedBy", "==", ownerUid).get();
  const testExternals = extSnap.docs.filter((d) => {
    const e = d.data() as { displayName?: string; seed?: boolean };
    return e.seed === true || SEED_EXTERNAL_NAMES.includes(e.displayName ?? "");
  });
  for (const ext of testExternals) await ext.ref.delete();

  console.log(`\n🧹 Limpieza para ${ownerEmail}:`);
  console.log(`   eventos borrados: ${testEvents.length}`);
  console.log(`   sesiones borradas: ${sessionsDeleted}`);
  console.log(`   perfiles externos borrados: ${testExternals.length}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error en limpieza:", err);
    process.exit(1);
  });
