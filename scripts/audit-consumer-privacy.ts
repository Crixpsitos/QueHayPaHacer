/** Comprueba documentos de consumidores que todavía conservan isPublic=true. */
export {};

for (const file of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (path: string) => void }).loadEnvFile?.(file);
  } catch {
    // Los archivos de entorno son opcionales.
  }
}

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const snapshot = await getFirebaseFirestore().collection("users").get();
  const consumers = snapshot.docs
    .map((document) => ({
      uid: document.id,
      ...document.data(),
    }) as {
      uid: string;
      displayName?: string;
      participation?: string;
      isPublic?: boolean;
    })
    .filter((user) => user.participation === "consumer");
  const storedAsPublic = consumers.filter((user) => user.isPublic === true);
  const sample = consumers[0];
  const apply = process.argv.includes("--apply");

  if (apply && storedAsPublic.length > 0) {
    const batch = getFirebaseFirestore().batch();
    for (const user of storedAsPublic) {
      batch.update(getFirebaseFirestore().collection("users").doc(user.uid), {
        isPublic: false,
        updatedAt: new Date(),
      });
    }
    await batch.commit();
  }

  console.log(JSON.stringify({
    consumers: consumers.length,
    storedAsPublic: storedAsPublic.length,
    updated: apply ? storedAsPublic.length : 0,
    sample: sample
      ? { uid: sample.uid, displayName: sample.displayName }
      : null,
  }));
}

main().catch((error) => {
  console.error("No se pudo auditar la privacidad:", error);
  process.exitCode = 1;
});