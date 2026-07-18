/**
 * Convierte a cualquier usuario en cuenta PROFESIONAL aprobada: actualiza el doc
 * `users` (accountType/professionalStatus/professionalType), aprueba su solicitud
 * pendiente en `professionalRequests` (si existe) y setea los custom claims de
 * Firebase Auth que lee la UI (`role`, `professionalType`, `isProfessional`).
 *
 * Uso:
 *   npx tsx scripts/make-professional.ts <correo|uid> [organizer|business|government]
 *   npx tsx scripts/make-professional.ts cristianpee2609@gmail.com organizer
 *
 * OJO: los custom claims solo aparecen tras refrescar el token → el usuario debe
 * cerrar/iniciar sesión (o esperar el refresh) para verlos. El perfil (Firestore)
 * está cacheado ~horas en /api/auth/me; re-login trae los datos frescos.
 */
export {}; // marca el archivo como módulo (scope aislado)

for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

const VALID_TYPES = ["organizer", "business", "government"] as const;
type ProType = (typeof VALID_TYPES)[number];

async function main() {
  const { getFirebaseFirestore, getFirebaseAdminAuth } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { Timestamp } = await import("firebase-admin/firestore");

  const idArg = (process.argv[2] ?? "").trim();
  const typeArg = (process.argv[3] ?? "").trim();
  if (!idArg) {
    console.error("Uso: npx tsx scripts/make-professional.ts <correo|uid> [organizer|business|government]");
    process.exit(1);
  }
  if (typeArg && !VALID_TYPES.includes(typeArg as ProType)) {
    console.error(`professionalType inválido. Usa uno de: ${VALID_TYPES.join(", ")}`);
    process.exit(1);
  }

  const db = getFirebaseFirestore();
  const auth = getFirebaseAdminAuth();

  // 1) Resolver usuario por correo (contiene "@") o por uid.
  const userRef = idArg.includes("@")
    ? (
        await db.collection("users").where("email", "==", idArg.toLowerCase()).limit(1).get()
      ).docs[0]?.ref
    : db.collection("users").doc(idArg);

  if (!userRef) {
    console.error(`No encontré un usuario con el correo ${idArg}.`);
    process.exit(1);
  }
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    console.error(`No existe el usuario ${idArg}.`);
    process.exit(1);
  }
  const uid = userSnap.id;
  const u = userSnap.data() as {
    email?: string;
    displayName?: string;
    brandName?: string;
    professionalType?: ProType | null;
  };

  // professionalType: arg > el que ya tiene > el de su solicitud > "organizer".
  let professionalType: ProType = (typeArg as ProType) || u.professionalType || "organizer";

  // 2) Aprobar la solicitud pendiente (si hay) y tomar su professionalType.
  const reqs = await db.collection("professionalRequests").where("uid", "==", uid).get();
  const pending = reqs.docs.find((d) => d.data().status === "pending");
  if (!typeArg && pending?.data().professionalType) {
    professionalType = pending.data().professionalType as ProType;
  }
  if (pending) {
    await pending.ref.update({ status: "approved", reviewedAt: Timestamp.now(), rejectionReason: null });
  }

  const brandName = u.brandName || u.displayName || "Mi marca";

  // 3) Doc `users` → profesional aprobado.
  await userRef.update({
    accountType: "professional",
    professionalStatus: "approved",
    professionalType,
    brandName,
    updatedAt: Timestamp.now(),
  });

  // 4) Custom claims de Firebase Auth (preserva los existentes).
  const existingClaims = (await auth.getUser(uid)).customClaims ?? {};
  await auth.setCustomUserClaims(uid, {
    ...existingClaims,
    role: "professional",
    professionalType,
    isProfessional: true,
  });

  console.log(`\n✅ ${u.email ?? uid} ahora es PROFESIONAL (${professionalType}).`);
  console.log(`   uid: ${uid}`);
  console.log(`   users: accountType=professional, professionalStatus=approved`);
  console.log(`   claims: role=professional, professionalType=${professionalType}, isProfessional=true`);
  if (pending) console.log(`   solicitud ${pending.id}: aprobada`);
  console.log(`\n⚠️  Debe cerrar e iniciar sesión para que el token tome los nuevos claims.\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
