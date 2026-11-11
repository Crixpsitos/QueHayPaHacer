/**
 * Ops: entrega de datos de un oferente a la autoridad (Ley 1480 art. 53). DRY-RUN por defecto.
 * Uso: pnpm exec tsx scripts/export-host-identity.ts --uid <uidDelOferente>
 *      pnpm exec tsx scripts/export-host-identity.ts --uid <uid> --apply --out <ruta.json>
 * Sin --apply solo dice si existe el registro y qué campos tiene (NUNCA imprime los valores).
 * Con --apply escribe el JSON en --out y deja constancia en hostIdentities/{uid}/accessLog.
 */
import "./_loadEnv";
import { writeFileSync } from "node:fs";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { HostIdentityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/HostIdentityFirebaseRepository";
import { HostIdentityService } from "@/application/services/activities/HostIdentityService";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = args.includes("--apply");
const uid = flag("--uid");
const out = flag("--out");

async function main() {
  if (!uid) throw new Error("Falta --uid <uid>");
  const repo = new HostIdentityFirebaseRepository(getFirebaseFirestore());
  const record = await repo.get(uid);
  if (!record) {
    console.log(`Sin registro de identificación para ${uid}.`);
    return;
  }
  if (!APPLY) {
    console.log(`DRY-RUN: existe registro (${record.kind}) confirmado el ${record.confirmedAt.toISOString()}. Campos: ${Object.keys(record).join(", ")}.`);
    console.log("Para exportar: --apply --out <ruta.json>");
    return;
  }
  if (!out) throw new Error("Con --apply hace falta --out <ruta.json>");
  const exported = await new HostIdentityService(repo).exportForAuthority(uid, "script:export-host-identity");
  writeFileSync(out, JSON.stringify(exported, null, 2), { mode: 0o600 });
  console.log(`Exportado a ${out} (permisos 600) y registrado en la bitácora de acceso.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
