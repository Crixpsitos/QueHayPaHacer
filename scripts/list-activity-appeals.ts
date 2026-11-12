/**
 * Ops: apelaciones de reseñas retiradas. DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/list-activity-appeals.ts                                              # lista las abiertas
 *      pnpm exec tsx scripts/list-activity-appeals.ts --resolve <reviewId> --decision restore|reject [--apply]
 * `restore`: la reseña vuelve publicada y al promedio. `reject`: se cierra sin trámite (sin fundamentos).
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { ActivityReviewFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityReviewFirebaseRepository";
import { ActivityAppealFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityAppealFirebaseRepository";
import { ActivityAppealService } from "@/application/services/activities/ActivityAppealService";

/** Texto de usuarios: sin caracteres de control (secuencias de escape) en la terminal de quien modera. */
// eslint-disable-next-line no-control-regex
const safe = (t: unknown) => String(t ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ");
const args = process.argv.slice(2);
const flag = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const APPLY = args.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const reviews = new ActivityReviewFirebaseRepository(db);
  const appeals = new ActivityAppealFirebaseRepository(db);
  const svc = new ActivityAppealService({ appeals, getReview: (id) => reviews.getById(id), restore: async (id) => (await reviews.restoreRemoved(id)) !== null, clock: () => new Date() });
  const target = flag("--resolve");
  if (!target) {
    const open = await appeals.listOpen(100);
    if (!open.length) return console.log("(sin apelaciones abiertas)");
    for (const a of open) { const r = await reviews.getById(a.reviewId); console.log(`${a.reviewId}  desde ${a.createdAt.toISOString().slice(0, 16)}\n   reseña: ${safe((r?.body ?? "").slice(0, 160))}\n   apelación: ${safe(a.explanation)}`); }
    return;
  }
  const d = flag("--decision");
  if (d !== "restore" && d !== "reject") throw new Error("--decision debe ser restore o reject");
  console.log(`${APPLY ? "RESOLVIENDO" : "(dry-run) resolvería"} ${target}: ${d}`);
  if (!APPLY) return console.log("Agrega --apply para escribir.");
  await svc.resolve(target, d === "restore" ? "restored" : "rejected", "script:list-activity-appeals");
  console.log("listo");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
