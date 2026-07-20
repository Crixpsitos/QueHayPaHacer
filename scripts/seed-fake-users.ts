/**
 * Crea usuarios falsos en la colección `users` (base `quehaypahacer-db`) para
 * probar el buscador/invitación de colaboradores.
 *
 * Uso (Node 20.12+ / 22):
 *   npx tsx scripts/seed-fake-users.ts [cantidad]
 *
 * El script carga `.env` / `.env.local` por su cuenta (donde vive
 * `FIREBASE_SERVICE_ACCOUNT_JSON`) e importa Firebase de forma diferida. Doc id = uid.
 */
import { randomUUID } from "node:crypto";

// Carga las envs ANTES de importar la config de Firebase (que evalúa el service
// account al importarse). Los imports estáticos se hoistean, por eso Firebase se
// importa dinámicamente dentro de main().
for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // archivo opcional / ya cargado
  }
}

const FIRST = ["Ana", "Luis", "María", "Carlos", "Sofía", "Andrés", "Valentina", "Diego", "Camila", "Julián", "Laura", "Mateo"];
const LAST = ["García", "Rodríguez", "Martínez", "López", "Gómez", "Díaz", "Vargas", "Rojas", "Moreno", "Castro"];
const PRO_TYPES = ["organizer", "business", "government"] as const;

const pick = <T>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { Timestamp } = await import("firebase-admin/firestore");

  const count = Number(process.argv[2] ?? 10);
  const db = getFirebaseFirestore();
  const now = Timestamp.now();

  const created: { uid: string; email: string; accountType: string }[] = [];

  for (let i = 0; i < count; i++) {
    const uid = randomUUID();
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const displayName = `${firstName} ${lastName}`;
    const email = `${slug(firstName)}.${slug(lastName)}${i}@example.com`;
    const isPro = i % 3 === 0; // ~1 de cada 3 profesional aprobado
    const professionalType = isPro ? pick(PRO_TYPES) : null;

    const doc = {
      uid,
      email,
      emailVerified: true,
      displayName,
      firstName,
      lastName,
      bio: "Usuario de prueba (seed).",
      phoneNumber: `+57300${String(1000000 + i).slice(-7)}`,
      photoURL: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      acceptedTerms: true,
      accountType: isPro ? "professional" : "personal",
      professionalType,
      professionalStatus: isPro ? "approved" : "none",
      ...(isPro ? { brandName: `${lastName} Eventos` } : {}),
      isPublic: true,
      acceptedTermsAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("users").doc(uid).set(doc);
    created.push({ uid, email, accountType: doc.accountType });
  }

  console.log(`\n✅ ${created.length} usuarios creados en 'users':\n`);
  created.forEach((u) => console.log(`  ${u.accountType.padEnd(12)} ${u.email}  (${u.uid})`));
  console.log("\nBúscalos por correo en /studio/collaborators.\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sembrando usuarios:", err);
    process.exit(1);
  });
