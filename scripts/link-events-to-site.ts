/**
 * Vincula eventos a un sitio: setea `event.location.siteId` y hereda los campos
 * de `site.location` (venue, address, city, department, country, coordenadas).
 * Así `getEventsBySite` (filtra por `location.siteId`) puebla el "Itinerario de
 * eventos" del sitio.
 *
 * Rename clave al copiar: `site.location.geo` (GeoPoint) → `event.location.coordinates`.
 * Se reemplaza el objeto `location` completo → queda con la misma shape que
 * escribe `EventsFirebaseMapper.toStoredLocation`.
 *
 * Uso:
 *   npx tsx scripts/link-events-to-site.ts                        # DRY-RUN (sitio por defecto, eventos del dueño)
 *   npx tsx scripts/link-events-to-site.ts <siteId> --apply       # vincula los eventos del dueño del sitio
 *   npx tsx scripts/link-events-to-site.ts <siteId> --any --count 12 --apply  # 12 eventos de cualquier autor (ver paginación)
 *   npx tsx scripts/link-events-to-site.ts <siteId> --clear --apply           # revierte: siteId → null
 *
 * Requiere credenciales admin en el entorno.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ANY = args.includes("--any");
const CLEAR = args.includes("--clear");
const countArg = args.find((a) => a.startsWith("--count="));
const countFlagIdx = args.indexOf("--count");
const COUNT = countArg
  ? Number(countArg.split("=")[1])
  : countFlagIdx >= 0
    ? Number(args[countFlagIdx + 1])
    : undefined; // sin tope → todos los candidatos
const siteId = args.find((a) => !a.startsWith("--") && !Number.isFinite(Number(a))) ?? "YM8uDHfs3To1QTXTg0j6";

interface SiteLocation {
  geo: unknown;
  country: unknown;
  department: unknown;
  city: unknown;
  address?: string;
  venue?: string;
  moreInfo?: string;
}

/**
 * Recuenta los eventos que apuntan al sitio y fija `analytics.eventCount` (valor
 * absoluto, no incremento → sin drift). La KPI "Eventos" lo lee de ahí.
 */
async function syncEventCount(
  db: FirebaseFirestore.Firestore,
): Promise<number> {
  const agg = await db.collection("events").where("location.siteId", "==", siteId).count().get();
  const n = agg.data().count;
  await db.collection("sites").doc(siteId).update({ "analytics.eventCount": n });
  return n;
}

/** Construye el `location` heredado del sitio (geo→coordinates) + siteId. */
function inheritedLocation(sl: SiteLocation) {
  return {
    siteId,
    venue: sl.venue ?? "",
    address: sl.address ?? "",
    moreInfo: sl.moreInfo ?? "",
    city: sl.city ?? { name: "", slug: "" },
    department: sl.department ?? { isoCode: "", name: "", slug: "" },
    country: sl.country ?? { isoCode: "", name: "", slug: "" },
    coordinates: sl.geo, // GeoPoint reusado tal cual
  };
}

async function main() {
  const db = getFirebaseFirestore();

  const siteSnap = await db.collection("sites").doc(siteId).get();
  if (!siteSnap.exists) {
    console.error(`El sitio ${siteId} no existe.`);
    process.exit(1);
  }
  const siteName = siteSnap.get("name");
  const siteAuthor = siteSnap.get("author.id");
  const siteLocation = siteSnap.get("location") as SiteLocation;

  const mode = APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)";
  console.log(`Sitio "${siteName}" (${siteId}) — dueño ${siteAuthor} — modo ${mode}`);

  // ── Revertir vínculo ────────────────────────────────────────────────────
  if (CLEAR) {
    const snap = await db.collection("events").get();
    const linked = snap.docs.filter((d) => d.get("location.siteId") === siteId);
    console.log(`--clear: ${linked.length} eventos apuntan a este sitio → siteId=null`);
    linked.forEach((d) => console.log(`  ${d.id} · ${d.get("title")}`));
    if (!APPLY) return console.log("🟡 DRY-RUN: nada escrito (corre con --apply).");

    let batch = db.batch();
    let ops = 0;
    for (const d of linked) {
      batch.update(d.ref, { "location.siteId": null });
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    if (ops > 0) await batch.commit();
    const total = await syncEventCount(db);
    return console.log(`✅ ESCRITO: ${linked.length} eventos desvinculados. analytics.eventCount=${total}.`);
  }

  // ── Vincular ──────────────────────────────────────────────────────────────
  // Colección chica (18 docs): traemos todo y filtramos/ordenamos en memoria
  // (evita índice compuesto author.id + createdAt).
  const snap = await db.collection("events").get();
  const toSecs = (v: unknown): number => {
    if (v && typeof v === "object" && "_seconds" in v) return (v as { _seconds: number })._seconds;
    if (v && typeof v === "object" && "toMillis" in v) return (v as { toMillis(): number }).toMillis() / 1000;
    return 0;
  };
  const candidates = snap.docs
    .filter((d) => ANY || d.get("author.id") === siteAuthor)
    .sort((a, b) => toSecs(b.get("createdAt")) - toSecs(a.get("createdAt")));

  const chosen = COUNT != null ? candidates.slice(0, COUNT) : candidates;

  console.log(
    `Candidatos: ${candidates.length} ${ANY ? "(cualquier autor)" : "(del dueño)"} — a vincular: ${chosen.length}\n`,
  );
  chosen.forEach((d) =>
    console.log(`  ${d.id} · ${d.get("title")} · siteId: ${d.get("location.siteId")} → ${siteId}`),
  );

  if (!chosen.length) return console.log("\nNada que vincular.");
  if (!APPLY) return console.log("\n🟡 DRY-RUN: nada escrito (corre con --apply).");

  const location = inheritedLocation(siteLocation);
  let batch = db.batch();
  let ops = 0;
  for (const d of chosen) {
    batch.update(d.ref, { location });
    if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();

  const total = await syncEventCount(db);
  console.log(`\n✅ ESCRITO: ${chosen.length} eventos vinculados a "${siteName}". analytics.eventCount=${total}.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("link falló:", e);
    process.exit(1);
  });
