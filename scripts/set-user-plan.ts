/**
 * Activa, renueva o retira Premium a mano (fase 1: sin pasarela de pago).
 * Escribe users/{uid}.plan/planExpiresAt/planSource y deja auditoría en `planChanges`.
 * El vencimiento lo aplica la Cloud Function `expirePremiumPlans` (diaria).
 *
 * Uso (dry-run por defecto, añade --apply para escribir):
 *   pnpm exec tsx scripts/set-user-plan.ts <correo> --reason founder            # 3 meses gratis (cupo 20)
 *   pnpm exec tsx scripts/set-user-plan.ts <correo> --reason paid --months 1     # pago confirmado
 *   pnpm exec tsx scripts/set-user-plan.ts <correo> --plan basic                 # retirar
 *   ... --note "Nequi ref 123"  --force (salta el cupo de fundadores)
 */
import "./_loadEnv";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminAuth, getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FOUNDER_LIMIT, FOUNDER_MONTHS, addMonths } from "@/presentation/profile/lib/membership";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const email = args[0];
const plan = flag("plan") ?? "premium";
const reason = flag("reason") ?? (plan === "basic" ? "manual" : undefined);
const note = flag("note");
const APPLY = args.includes("--apply");
const FORCE = args.includes("--force");

async function main() {
  if (!email || email.startsWith("--")) throw new Error("Uso: tsx scripts/set-user-plan.ts <correo> --reason founder|paid|manual [--months N] [--plan basic] [--apply]");
  if (plan !== "premium" && plan !== "basic") throw new Error("--plan debe ser premium o basic");
  if (!["founder", "paid", "manual"].includes(reason ?? "")) throw new Error("--reason debe ser founder, paid o manual");

  const db = getFirebaseFirestore();
  const { uid } = await getFirebaseAdminAuth().getUserByEmail(email);
  const ref = db.collection("users").doc(uid);
  const current = (await ref.get()).data();
  if (!current) throw new Error(`users/${uid} no existe`);

  const prevExpires: Date | null = current.planExpiresAt?.toDate?.() ?? null;
  let expiresAt: Date | null = null;

  if (plan === "premium") {
    if (reason === "founder") {
      const founders = await db.collection("planChanges").where("reason", "==", "founder").where("to", "==", "premium").get();
      const uids = new Set(founders.docs.map((d) => d.get("uid")));
      if (uids.has(uid) && !FORCE) throw new Error("Esta cuenta ya usó el cupo de fundador (usa --reason paid o --force)");
      if (uids.size >= FOUNDER_LIMIT && !FORCE) throw new Error(`Cupo de fundadores lleno (${uids.size}/${FOUNDER_LIMIT}). Usa --force para pasarlo`);
      console.log(`fundadores: ${uids.size}/${FOUNDER_LIMIT}`);
    }
    const months = Number(flag("months") ?? (reason === "founder" ? FOUNDER_MONTHS : 1));
    if (!Number.isInteger(months) || months < 1 || months > 24) throw new Error("--months debe ser un entero entre 1 y 24");
    // Renovación antes de vencer: suma desde el vencimiento actual, no desde hoy.
    const now = new Date();
    const base = current.plan === "premium" && prevExpires && prevExpires > now ? prevExpires : now;
    expiresAt = addMonths(base, months);
  }

  const summary = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    uid,
    name: current.displayName,
    from: current.plan ?? "basic",
    to: plan,
    reason,
    previousExpiresAt: prevExpires?.toISOString() ?? null,
    expiresAt: expiresAt?.toISOString() ?? null,
  };
  console.log(summary);
  if (!APPLY) return console.log("dry-run (usa --apply)");

  const batch = db.batch();
  batch.update(ref, {
    plan,
    planSource: plan === "premium" ? reason : FieldValue.delete(),
    planExpiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  batch.set(db.collection("planChanges").doc(), {
    uid,
    email,
    from: summary.from,
    to: plan,
    reason,
    note: note ?? null,
    previousExpiresAt: prevExpires ? Timestamp.fromDate(prevExpires) : null,
    expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    by: process.env.USER ?? "script",
    source: "set-user-plan",
    at: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  console.log("ok (el cambio se refleja en la app en ~1 minuto)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
