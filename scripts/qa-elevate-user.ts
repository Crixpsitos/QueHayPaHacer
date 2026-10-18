/**
 * QA (solo develop): marca una cuenta de prueba como Premium con email verificado.
 * Uso: pnpm exec tsx scripts/qa-elevate-user.ts <correo> [--apply]
 */
import "./_loadEnv";
import { getFirebaseAdminAuth, getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const email = process.argv[2];
const APPLY = process.argv.includes("--apply");

async function main() {
  if (!email) throw new Error("Uso: tsx scripts/qa-elevate-user.ts <correo> [--apply]");
  const auth = getFirebaseAdminAuth();
  const user = await auth.getUserByEmail(email);
  const ref = getFirebaseFirestore().collection("users").doc(user.uid);
  const doc = (await ref.get()).data();
  console.log({ uid: user.uid, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, plan: doc?.plan, participation: doc?.participation, displayName: doc?.displayName });
  if (!APPLY) return console.log("dry-run (usa --apply)");
  await auth.updateUser(user.uid, { emailVerified: true });
  await ref.update({ plan: "premium", emailVerified: true });
  console.log("ok: premium + emailVerified");
}
main().catch((e) => { console.error(e); process.exit(1); });
