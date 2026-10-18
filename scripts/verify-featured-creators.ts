/**
 * Marca hasta diez perfiles públicos existentes como creadores verificados.
 *
 * Uso:
 *   npx tsx scripts/verify-featured-creators.ts
 *   npx tsx scripts/verify-featured-creators.ts --apply
 */
export {};

for (const file of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (path: string) => void }).loadEnvFile?.(file);
  } catch {
    // Los archivos de entorno son opcionales.
  }
}

interface Candidate {
  uid: string;
  displayName: string;
  participation?: string;
  photoURL?: string;
  isPublic?: boolean;
}

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );

  const apply = process.argv.includes("--apply");
  const db = getFirebaseFirestore();
  const snapshot = await db.collection("users").get();

  const candidates = snapshot.docs
    .map((document) => ({ uid: document.id, ...document.data() }) as Candidate)
    .filter((user) => user.isPublic !== false)
    .sort((left, right) => {
      const leftCreator = left.participation === "creator";
      const rightCreator = right.participation === "creator";
      if (leftCreator !== rightCreator) return leftCreator ? -1 : 1;
      if (Boolean(left.photoURL) !== Boolean(right.photoURL)) return left.photoURL ? -1 : 1;
      return left.displayName.localeCompare(right.displayName, "es");
    })
    .slice(0, 10);

  if (candidates.length === 0) {
    console.log("No hay perfiles públicos disponibles.");
    return;
  }

  console.log(`${apply ? "Verificando" : "Dry run:"} ${candidates.length} creadores:`);
  candidates.forEach((creator) => console.log(`- ${creator.displayName} (${creator.uid})`));

  if (!apply) {
    console.log("\nEjecuta con --apply para guardar los cambios.");
    return;
  }

  const batch = db.batch();
  for (const creator of candidates) {
    batch.update(db.collection("users").doc(creator.uid), {
      participation: "creator",
      creatorVerified: true,
      updatedAt: new Date(),
    });
  }
  await batch.commit();
  console.log("\nCreadores verificados correctamente.");
}

main().catch((error) => {
  console.error("No se pudieron verificar los creadores:", error);
  process.exitCode = 1;
});