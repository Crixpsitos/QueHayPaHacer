/**
 * Ops: sugerencias de cambio de sitios (colección siteSuggestions). DRY-RUN por defecto; nada se escribe sin --apply.
 * Uso: pnpm exec tsx scripts/list-site-suggestions.ts
 *      pnpm exec tsx scripts/list-site-suggestions.ts --resolve <id> --status applied|rejected [--note "..."] [--apply]
 *
 * Resolver SOLO marca el estado de la sugerencia: NO modifica el sitio (el administrador lo edita aparte).
 * Ver docs/16-sitios-confianza-y-reclamos.md, sección "Sugerencias de cambio".
 */
import "./_loadEnv";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { SUGGESTION_FIELD_LABELS, type SuggestionField } from "@/domain/entities/siteSuggestion/SiteSuggestion";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const REVIEWER = "script:list-site-suggestions";
const db = getFirebaseFirestore();

async function resolve(id: string, status?: string, note?: string) {
  if (status !== "applied" && status !== "rejected")
    throw new Error('Uso: --resolve <id> --status applied|rejected [--note "..."] [--apply]');
  const ref = db.collection("siteSuggestions").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`No existe la sugerencia ${id}`);
  if (snap.get("status") !== "pending") throw new Error(`La sugerencia ya está ${snap.get("status")}`);
  console.log({ id, siteName: snap.get("siteName"), field: snap.get("field"), status, note: note ?? null });
  if (!APPLY) return console.log("dry-run (usa --apply)");
  await ref.update({
    status,
    resolvedAt: FieldValue.serverTimestamp(),
    resolvedBy: REVIEWER,
    ...(note?.trim() ? { resolutionNote: note.trim() } : {}),
  });
  console.log(`ok: ${status} (el sitio NO se modificó)`);
}

async function list() {
  // ponytail: filtra y ordena en memoria (evita índice compuesto); paginar si los pendientes crecen a miles.
  const snap = await db.collection("siteSuggestions").where("status", "==", "pending").get();
  const docs = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as FirebaseFirestore.DocumentData)
    .sort((a, b) => (a.createdAt as Timestamp)?.toMillis() - (b.createdAt as Timestamp)?.toMillis());
  console.log(`${docs.length} sugerencias pendientes\n`);
  for (const s of docs) {
    const site = await db.collection("sites").doc(s.siteId).get();
    const slug = site.get("slug");
    console.log(`id=${s.id}  ${(s.createdAt as Timestamp)?.toDate().toISOString() ?? "?"}`);
    console.log(`  sitio: "${s.siteName}" (${s.siteId}) slug=${slug ?? "-"} -> http://localhost:3000/donde-ir/${slug ?? s.siteId}`);
    console.log(`  de: ${s.authorName} uid=${s.authorUid}`);
    console.log(`  campo: ${SUGGESTION_FIELD_LABELS[s.field as SuggestionField] ?? s.field}`);
    console.log(`  sugerencia: ${s.description}`);
    console.log(`  fuente: ${s.source ?? "-"}\n`);
  }
}

async function main() {
  if (args.includes("--resolve")) {
    const id = flag("--resolve");
    if (!id) throw new Error('Uso: --resolve <id> --status applied|rejected [--note "..."] [--apply]');
    return resolve(id, flag("--status"), flag("--note"));
  }
  return list();
}
main().catch((e) => { console.error(e); process.exit(1); });
