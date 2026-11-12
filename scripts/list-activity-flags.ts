/**
 * Ops: reseñas cuestionadas («En verificación») que esperan decisión de QHPA. DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/list-activity-flags.ts                                                  # lista, la más antigua primero
 *      pnpm exec tsx scripts/list-activity-flags.ts --resolve <reviewId> --outcome upheld|removed [--abusive] [--apply]
 * `upheld` = la reseña es real (queda «Verificada por QHPA»; con --abusive se sanciona al anfitrión por cuestionarla).
 * `removed` = es falsa (se retira, sale del promedio y se sanciona a quien reseñó). Ambos casos avisan a las dos partes.
 * El motivo y la nota del cuestionamiento solo se ven aquí, nunca en la web.
 * LIMITACIÓN: el script no invalida la caché de Next; el cambio se ve en la ficha en unos minutos.
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { ActivityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityFirebaseRepository";
import { ActivityReviewFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityReviewFirebaseRepository";
import { ActivitySanctionFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivitySanctionFirebaseRepository";
import { NotificationFirebaseRepository } from "@/infraestructure/firebase/repositories/notification/NotificationFirebaseRepository";
import { NotificationService } from "@/application/services/notification/NotificationService";
import { ReviewModerationService } from "@/application/services/activities/ReviewModerationService";

/** Texto de usuarios: sin caracteres de control (secuencias de escape) en la terminal de quien modera. */
// eslint-disable-next-line no-control-regex
const safe = (t: unknown) => String(t ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ");
const args = process.argv.slice(2);
const flag = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const APPLY = args.includes("--apply");

async function main() {
  const db = getFirebaseFirestore();
  const activities = new ActivityFirebaseRepository(db);
  const reviews = new ActivityReviewFirebaseRepository(db);
  const notifications = new NotificationService(new NotificationFirebaseRepository(db));
  const svc = new ReviewModerationService({
    reviews, sanctions: new ActivitySanctionFirebaseRepository(db),
    getActivity: async (id) => { const a = await activities.findById(id); return a ? { id: a.id, slug: a.slug, title: a.title, ownerUid: a.ownerUid, siteOwnerUid: null } : null; },
    notify: (uid, n, id) => notifications.notify(uid, n, id), clock: () => new Date(), log: (m) => console.log(m),
  });

  const target = flag("--resolve");
  if (!target) {
    const open = await svc.listOpen(100);
    if (!open.length) return console.log("(sin reseñas en verificación)");
    for (const r of open) console.log(`${r.id}  ${"★".repeat(r.rating)}  desde ${r.flag?.at.toISOString().slice(0, 16)}  motivo=${r.flag?.reason}  por=${r.flag?.by}\n   nota: ${safe(r.flag?.note)}\n   reseña (${safe(r.author.displayName)}): ${safe(r.body.slice(0, 160))}`);
    return;
  }
  const outcome = flag("--outcome");
  if (outcome !== "upheld" && outcome !== "removed") throw new Error("--outcome debe ser upheld o removed");
  const r = await reviews.getById(target);
  if (!r || r.status !== "flagged") throw new Error("Esa reseña no está en verificación.");
  console.log(`${APPLY ? "RESOLVIENDO" : "(dry-run) resolvería"} ${target} como ${outcome}${args.includes("--abusive") ? " (abusivo)" : ""}`);
  if (!APPLY) return console.log("Agrega --apply para escribir.");
  await svc.resolve({ reviewId: target, outcome, abusive: args.includes("--abusive"), by: "script:list-activity-flags" });
  console.log("listo");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
