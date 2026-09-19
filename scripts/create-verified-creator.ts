/**
 * Crea una cuenta de prueba en Firebase Auth y su perfil de creador verificado.
 *
 * Uso:
 *   npx tsx scripts/create-verified-creator.ts <correo> <contrasena> [nombre] [apellido]
 *
 * El script carga `.env` y `.env.local`. Si el correo ya existe, no modifica
 * la cuenta ni su contrasena.
 */
import "./_loadEnv";

const AUTH_EMAIL_EXISTS = "auth/email-already-exists";

function readArguments() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const password = process.argv[3] ?? "";
  const firstName = (process.argv[4] ?? "Creador").trim();
  const lastName = (process.argv[5] ?? "Verificado").trim();

  if (!email || !password) {
    throw new Error(
      "Uso: npx tsx scripts/create-verified-creator.ts <correo> <contrasena> [nombre] [apellido]",
    );
  }

  if (!firstName) {
    throw new Error("El nombre no puede estar vacio.");
  }

  return { email, password, firstName, lastName };
}

async function main() {
  const { email, password, firstName, lastName } = readArguments();
  const { getFirebaseAdminAuth, getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { Timestamp } = await import("firebase-admin/firestore");

  const auth = getFirebaseAdminAuth();
  const db = getFirebaseFirestore();
  const displayName = `${firstName} ${lastName}`.trim();

  let authUser;
  try {
    authUser = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (code === AUTH_EMAIL_EXISTS) {
      throw new Error(`Ya existe una cuenta de Firebase Auth con el correo ${email}.`);
    }
    throw error;
  }

  try {
    const now = Timestamp.now();

    await db.collection("users").doc(authUser.uid).create({
      uid: authUser.uid,
      email,
      emailVerified: true,
      displayName,
      firstName,
      lastName,
      bio: "Cuenta de prueba de creador verificado.",
      phoneNumber: "",
      acceptedTerms: true,
      participation: "creator",
      creatorVerified: true,
      plan: "basic",
      isPublic: true,
      isUsernameCustomized: true,
      acceptedTermsAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await auth.setCustomUserClaims(authUser.uid, {
      participation: "creator",
      creatorVerified: true,
      plan: "basic",
    });
  } catch (error) {
    await auth.deleteUser(authUser.uid);
    throw error;
  }

  console.log(`Cuenta de creador verificado creada: ${email}`);
  console.log(`uid: ${authUser.uid}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});