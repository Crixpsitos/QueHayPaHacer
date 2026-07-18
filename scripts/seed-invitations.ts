/**
 * Crea invitaciones de colaboración PENDIENTES dirigidas a un usuario (por correo),
 * enviadas por cuentas profesionales de prueba. Sirve para ver la bandeja de
 * "Invitaciones recibidas" en /studio/collaborators con esa cuenta.
 *
 * Uso:
 *   npx tsx scripts/seed-invitations.ts <correo-destino> [cantidad]
 *   npx tsx scripts/seed-invitations.ts cristian.montealegre@inventech.com.co 5
 *
 * Carga `.env` / `.env.local` (donde vive FIREBASE_SERVICE_ACCOUNT_JSON) solo.
 */
export {}; // marca el archivo como módulo (scope aislado)

for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { FieldValue } = await import("firebase-admin/firestore");

  const targetEmail = (process.argv[2] ?? "").trim().toLowerCase();
  const count = Number(process.argv[3] ?? 5);
  if (!targetEmail) {
    console.error("Falta el correo destino. Uso: npx tsx scripts/seed-invitations.ts <correo> [n]");
    process.exit(1);
  }

  const db = getFirebaseFirestore();

  // 1) Usuario destino.
  const targetSnap = await db.collection("users").where("email", "==", targetEmail).limit(1).get();
  if (targetSnap.empty) {
    console.error(`No encontré un usuario con el correo ${targetEmail}.`);
    process.exit(1);
  }
  const target = targetSnap.docs[0];
  const targetUid = target.id;
  const t = target.data() as { displayName?: string; photoURL?: string; professionalType?: string };

  // 2) Remitentes: cuentas profesionales (excluye destino y quien ya tenga una
  // invitación PENDIENTE hacia el destino, para no duplicar al re-correr).
  const existingSnap = await db
    .collection("collaborationInvites")
    .where("toUid", "==", targetUid)
    .get();
  const alreadyPending = new Set(
    existingSnap.docs
      .filter((d) => d.data().status === "pending")
      .map((d) => d.data().fromUid as string),
  );

  const prosSnap = await db
    .collection("users")
    .where("accountType", "==", "professional")
    .limit(count + 20)
    .get();
  const senders = prosSnap.docs
    .filter((d) => d.id !== targetUid && !alreadyPending.has(d.id))
    .slice(0, count);
  if (senders.length === 0) {
    console.log(
      "No hay profesionales nuevos por invitar (¿ya todos tienen una invitación pendiente?). " +
        "Corre seed-fake-users para crear más, o acepta/deniega las existentes.",
    );
    process.exit(0);
  }

  // 3) Crea invitaciones pendientes from → target.
  const batch = db.batch();
  for (const s of senders) {
    const from = s.data() as { displayName?: string; photoURL?: string; professionalType?: string };
    const ref = db.collection("collaborationInvites").doc();
    batch.set(ref, {
      fromUid: s.id,
      fromDisplayName: from.displayName ?? "Organizador",
      fromPhotoURL: from.photoURL ?? null,
      fromProfessionalType: from.professionalType ?? null,
      toUid: targetUid,
      toEmail: targetEmail,
      toDisplayName: t.displayName ?? targetEmail,
      toPhotoURL: t.photoURL ?? null,
      toProfessionalType: t.professionalType ?? null,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      respondedAt: null,
    });
  }
  await batch.commit();

  console.log(`\n✅ ${senders.length} invitaciones pendientes creadas para ${targetEmail}:\n`);
  senders.forEach((s) => {
    const from = s.data() as { displayName?: string };
    console.log(`  de ${from.displayName ?? s.id}`);
  });
  console.log(`\nEntra como ${targetEmail} a /studio/collaborators → "Invitaciones recibidas".\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sembrando invitaciones:", err);
    process.exit(1);
  });
