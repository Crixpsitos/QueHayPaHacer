/**
 * Ops: revisión de actividades que esperan aprobación de QHPA. DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/list-activities.ts                                        # lista las pendientes
 *      pnpm exec tsx scripts/list-activities.ts --approve <id> [--apply]
 *      pnpm exec tsx scripts/list-activities.ts --reject <id> --reason "..." [--apply]
 * Aprobar suma una aprobada a la cuenta (la tercera la vuelve "de confianza") y avisa al creador por la campanita.
 * LIMITACIÓN: el script no puede invalidar la caché de Next (updateTag/revalidateTag solo existen dentro de Next);
 * la actividad aprobada aparece en los listados en unos minutos.
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { ActivityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityFirebaseRepository";
import { ActivityAccountFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityAccountFirebaseRepository";
import { NotificationFirebaseRepository } from "@/infraestructure/firebase/repositories/notification/NotificationFirebaseRepository";
import { NotificationService } from "@/application/services/notification/NotificationService";
import { ActivityModerationService } from "@/application/services/activities/ActivityModerationService";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = args.includes("--apply");
const REVIEWER = "script:list-activities";
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const db = getFirebaseFirestore();
const notifications = new NotificationService(new NotificationFirebaseRepository(db));
const svc = new ActivityModerationService({
  repo: new ActivityFirebaseRepository(db),
  accounts: new ActivityAccountFirebaseRepository(db),
  notify: (uid, n) => notifications.notify(uid, n),
  clock: () => new Date(),
});

async function main() {
  const approveId = flag("--approve");
  const rejectId = flag("--reject");
  if (approveId || rejectId) {
    const id = (approveId ?? rejectId)!;
    const reason = flag("--reason") ?? "";
    if (!APPLY) {
      console.log(`DRY-RUN: ${approveId ? "aprobaría" : `rechazaría (motivo: "${reason}")`} la actividad ${id}. Agrega --apply para ejecutarlo.`);
      return;
    }
    const r = approveId ? await svc.approve(id, REVIEWER) : await svc.reject(id, REVIEWER, reason);
    console.log(r.ok ? `Hecho: actividad ${id} ${approveId ? "aprobada" : "rechazada"}.` : `No se pudo: ${r.error}`);
    if (!r.ok) process.exitCode = 1;
    return;
  }
  const rows = await svc.listPending(100);
  if (!rows.length) return console.log("No hay actividades pendientes.");
  console.log(`${rows.length} pendiente(s), la más antigua primero:\n`);
  for (const r of rows) console.log(`- ${r.id}  "${r.title}"  [${r.category}]  creador ${r.ownerUid}  hace ${r.ageHours} h\n    ${SITE}/actividades/${r.slug}  (vista previa solo para el creador y QHPA)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
