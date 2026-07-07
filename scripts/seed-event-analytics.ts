/**
 * Seed de analíticas de un evento (studio/events/{id}):
 *   1) INSCRIPCIONES → subcolección `events/{id}/registrations/{userId}` con
 *      `{ name, registeredAt, status }`. Alimentan la tabla de inscritos Y la
 *      curva "Ritmo de inscripción" (getRegistrationRamp bucketea por horas
 *      antes de `startDate`; eje HORAS si el horizonte ≤48h, si no DÍAS).
 *      Requiere que el evento tenga `startDate` (+ `endDate`); si no, la ramp
 *      sale vacía → el script avisa y solo setea contadores.
 *   2) CONTADORES → `analytics.{views,likes,shares,registrations,clicks}` en el
 *      doc del evento (valores absolutos). Las KPI del detalle los leen de ahí.
 *
 * Los `registeredAt` se reparten en una ventana antes de `startDate` con sesgo
 * hacia el evento (más altas cerca del inicio) → curva acumulada realista.
 *
 * Uso:
 *   npx tsx scripts/seed-event-analytics.ts                                  # DRY-RUN (evento por defecto)
 *   npx tsx scripts/seed-event-analytics.ts <eventId> --apply
 *   npx tsx scripts/seed-event-analytics.ts <eventId> --registrations 60 --views 500 --likes 90 --shares 30 --apply
 *   npx tsx scripts/seed-event-analytics.ts <eventId> --window-hours 40 --apply   # eje por HORAS (evento de corto plazo)
 *   npx tsx scripts/seed-event-analytics.ts <eventId> --clear --apply             # borra inscripciones + registrations=0
 *
 * Requiere credenciales admin en el entorno.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { Timestamp } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CLEAR = args.includes("--clear");

function numArg(name: string, def: number | undefined): number | undefined {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return Number(eq.split("=")[1]);
  const i = args.indexOf(`--${name}`);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("--")) return Number(args[i + 1]);
  return def;
}

const eventId = args.find((a) => !a.startsWith("--") && !Number.isFinite(Number(a))) ?? "IdcCG1TYhNkd1bPmPXHS";

const REGISTRATIONS = numArg("registrations", 40)!;
const VIEWS = numArg("views", 320)!;
const LIKES = numArg("likes", 55)!;
const SHARES = numArg("shares", 18)!;
const CLICKS = numArg("clicks", undefined); // undefined → no se toca
const WINDOW_HOURS = numArg("window-hours", undefined);
const WINDOW_DAYS = numArg("window-days", 12)!;

const HOUR_MS = 3600 * 1000;
const NAMES = [
  "Camila Rojas", "Andrés Gómez", "Valentina Díaz", "Santiago Ruiz", "Laura Torres",
  "Mateo Herrera", "Sofía Castro", "Sebastián Mora", "Isabella Peña", "Nicolás Vargas",
  "Mariana Silva", "Daniel Ortiz", "Gabriela León", "Juan Restrepo", "Paula Cárdenas",
];

type SeedReg = { userId: string; name: string; registeredAt: Date; status: "accepted" | "pending" };

/** Reparte `count` inscripciones en la ventana previa a `startDate`, con sesgo al evento. */
function generateRegistrations(count: number, startDate: Date, windowMs: number): SeedReg[] {
  const startMs = startDate.getTime();
  const docs: SeedReg[] = [];
  for (let i = 0; i < count; i++) {
    const f = count === 1 ? 1 : i / (count - 1); // 0..1
    const skew = Math.pow(f, 1.6); // acelera cerca del evento (más altas al final)
    // -1s garantiza registeredAt < startDate (hoursBefore ≥ 0).
    const registeredAt = new Date(startMs - windowMs * (1 - skew) - 1000);
    docs.push({
      userId: `seed-reg-${i + 1}`,
      name: NAMES[i % NAMES.length],
      registeredAt,
      status: Math.random() < 0.7 ? "accepted" : "pending",
    });
  }
  return docs;
}

async function main() {
  const db = getFirebaseFirestore();

  const snap = await db.collection("events").doc(eventId).get();
  if (!snap.exists) {
    console.error(`El evento ${eventId} no existe.`);
    process.exit(1);
  }
  const title = snap.get("title");
  const startTs = snap.get("startDate");
  const startDate: Date | null = startTs?.toDate ? startTs.toDate() : null;

  const mode = APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)";
  console.log(`Evento "${title}" (${eventId}) — modo ${mode}`);

  const col = db.collection(`events/${eventId}/registrations`);

  // ── Limpiar ───────────────────────────────────────────────────────────────
  if (CLEAR) {
    const existing = await col.get();
    console.log(`--clear: borra ${existing.size} inscripciones + analytics.registrations=0`);
    if (!APPLY) return console.log("🟡 DRY-RUN: nada escrito (corre con --apply).");
    let batch = db.batch();
    let ops = 0;
    for (const d of existing.docs) {
      batch.delete(d.ref);
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    if (ops > 0) await batch.commit();
    await snap.ref.update({ "analytics.registrations": 0 });
    return console.log(`✅ ESCRITO: inscripciones borradas, registrations=0.`);
  }

  // ── Inscripciones (ramp) ────────────────────────────────────────────────────
  const windowMs = (WINDOW_HOURS != null ? WINDOW_HOURS : WINDOW_DAYS * 24) * HOUR_MS;
  const canRamp = Boolean(startDate);
  const regs = canRamp ? generateRegistrations(REGISTRATIONS, startDate!, windowMs) : [];

  if (!canRamp) {
    console.log(
      "⚠️  El evento no tiene startDate → la curva 'Ritmo de inscripción' saldrá vacía. Se setean solo los contadores.",
    );
  } else {
    const axis = (WINDOW_HOURS != null ? WINDOW_HOURS : WINDOW_DAYS * 24) <= 48 ? "HORAS" : "DÍAS";
    console.log(
      `Inscripciones: ${regs.length} repartidas en ${WINDOW_HOURS != null ? `${WINDOW_HOURS}h` : `${WINDOW_DAYS}d`} antes de ${startDate!.toISOString()} → eje ${axis}`,
    );
    console.log(`  primera: ${regs[0]?.registeredAt.toISOString()} · última: ${regs[regs.length - 1]?.registeredAt.toISOString()}`);
  }

  const counters: Record<string, number> = {
    "analytics.views": VIEWS,
    "analytics.likes": LIKES,
    "analytics.shares": SHARES,
    "analytics.registrations": regs.length,
  };
  if (CLICKS != null) counters["analytics.clicks"] = CLICKS;
  console.log("Contadores a fijar:", counters);

  if (!APPLY) return console.log("\n🟡 DRY-RUN: nada escrito (corre con --apply).");

  // Escribe inscripciones (docId = userId para que confirmAttendance/remove las ubiquen).
  let batch = db.batch();
  let ops = 0;
  for (const r of regs) {
    batch.set(col.doc(r.userId), {
      userId: r.userId,
      name: r.name,
      registeredAt: Timestamp.fromDate(r.registeredAt),
      status: r.status,
      checkedInAt: null,
    });
    if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
  }
  if (ops > 0) await batch.commit();

  // Contadores (dot-path → crea/actualiza el mapa analytics preservando score).
  await snap.ref.update(counters);

  console.log(`\n✅ ESCRITO: ${regs.length} inscripciones + contadores actualizados.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("seed falló:", e);
    process.exit(1);
  });
