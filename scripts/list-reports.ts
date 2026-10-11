/**
 * Ops: lista reportes abiertos (más recientes primero) agrupados por contenido.
 * Uso: pnpm exec tsx scripts/list-reports.ts
 *      pnpm exec tsx scripts/list-reports.ts --resolve <reportId> [--apply]
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const resolveIdx = args.indexOf("--resolve");
const resolveId = resolveIdx >= 0 ? args[resolveIdx + 1] : undefined;

async function main() {
  const col = getFirebaseFirestore().collection("reports");

  if (resolveIdx >= 0) {
    if (!resolveId) throw new Error("Uso: --resolve <reportId> [--apply]");
    const ref = col.doc(resolveId);
    const doc = await ref.get();
    if (!doc.exists) throw new Error(`No existe el reporte ${resolveId}`);
    console.log({ id: doc.id, ...doc.data(), createdAt: doc.get("createdAt")?.toDate?.() });
    if (!APPLY) return console.log("dry-run (usa --apply)");
    await ref.update({ status: "resolved" });
    return console.log("ok: resolved");
  }

  // ponytail: filtra y ordena en memoria (evita índice compuesto); paginar si los abiertos crecen a miles.
  const snap = await col.where("status", "==", "open").get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAt: d.get("createdAt")?.toDate?.() as Date | undefined }))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)) as Array<
    Record<string, unknown> & { id: string; createdAt?: Date }
  >;

  const groups = new Map<string, typeof docs>();
  for (const d of docs) {
    const key = `${d.targetType}/${d.targetId}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }

  console.log(`${docs.length} reportes abiertos en ${groups.size} contenidos\n`);
  for (const [key, items] of groups) {
    console.log(`${key}  "${items[0].targetTitle}"  autor=${items[0].targetAuthorId ?? "-"}  (${items.length})`);
    for (const r of items) {
      const session = r.sessionId ? ` sesión=${r.sessionId}` : "";
      const details = r.details ? `  "${r.details}"` : "";
      console.log(`  ${r.createdAt?.toISOString() ?? "?"}  ${r.reason}${session}  uid=${r.uid}  id=${r.id}${details}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
