/**
 * Seed de interacciones de un sitio → `sites/{siteId}/interactions/{autoId}` con
 * `{ type: "click"|"like"|"share", createdAt }`. Alimenta la gráfica semanal de
 * `getSiteAnalytics` (ventana: últimas 8 semanas). Los clicks/likes/shares se
 * reparten con tendencia creciente para que la curva se vea realista.
 *
 * Uso:
 *   npx tsx scripts/seed-site-interactions.ts                       # DRY-RUN (sitio por defecto)
 *   npx tsx scripts/seed-site-interactions.ts <siteId> --apply      # escribe
 *   npx tsx scripts/seed-site-interactions.ts <siteId> --apply --clear  # borra las existentes y re-seedea
 *
 * Requiere credenciales admin en el entorno.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { Timestamp } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CLEAR = args.includes("--clear");
const siteId = args.find((a) => !a.startsWith("--")) ?? "YM8uDHfs3To1QTXTg0j6";

const WEEKS = 8;
const DAY_MS = 86400 * 1000;
type InteractionType = "click" | "like" | "share";

/** Genera las interacciones de las últimas WEEKS semanas con tendencia creciente. */
function generate(now: Date): { type: InteractionType; createdAt: Date }[] {
  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  windowStart.setDate(windowStart.getDate() - 7 * (WEEKS - 1));

  const docs: { type: InteractionType; createdAt: Date }[] = [];

  for (let w = 0; w < WEEKS; w++) {
    const weekStartMs = windowStart.getTime() + w * 7 * DAY_MS;
    const clicks = 12 + w * 3; // crecimiento: 12,15,18,...,33
    const likes = Math.round(clicks * 0.22);
    const shares = Math.round(clicks * 0.05);

    const push = (type: InteractionType, count: number) => {
      for (let i = 0; i < count; i++) {
        // Momento aleatorio dentro de la semana, sin pasar de "ahora".
        const t = weekStartMs + Math.random() * 7 * DAY_MS;
        docs.push({ type, createdAt: new Date(Math.min(t, now.getTime())) });
      }
    };

    push("click", clicks);
    push("like", likes);
    push("share", shares);
  }

  return docs;
}

async function main() {
  const db = getFirebaseFirestore();

  const siteSnap = await db.collection("sites").doc(siteId).get();
  if (!siteSnap.exists) {
    console.error(`El sitio ${siteId} no existe.`);
    process.exit(1);
  }

  const col = db.collection(`sites/${siteId}/interactions`);
  const docs = generate(new Date());

  const byType = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    `Sitio "${siteSnap.data()?.name}" (${siteId}) — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`,
  );
  console.log(`A crear: ${docs.length} interacciones →`, byType);
  console.log(
    `Contadores del sitio a fijar: clicks=${byType.click ?? 0}, likes=${byType.like ?? 0}, shares=${byType.share ?? 0} (para que los KPI cuadren con la gráfica)`,
  );

  if (!APPLY) {
    console.log("🟡 DRY-RUN: nada escrito (corre con --apply).");
    return;
  }

  if (CLEAR) {
    const existing = await col.get();
    console.log(`--clear: borrando ${existing.size} interacciones existentes…`);
    let delBatch = db.batch();
    let delOps = 0;
    for (const d of existing.docs) {
      delBatch.delete(d.ref);
      if (++delOps >= 400) {
        await delBatch.commit();
        delBatch = db.batch();
        delOps = 0;
      }
    }
    if (delOps > 0) await delBatch.commit();
  }

  let batch = db.batch();
  let ops = 0;
  for (const d of docs) {
    batch.set(col.doc(), { type: d.type, createdAt: Timestamp.fromDate(d.createdAt) });
    if (++ops >= 400) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();

  // Los KPI (totales) leen los contadores del doc del sitio, no el log. Los
  // fijamos a los totales seedeados para que gráfica y KPI cuadren.
  await db.collection("sites").doc(siteId).update({
    "analytics.clicks": byType.click ?? 0,
    "analytics.likes": byType.like ?? 0,
    "analytics.shares": byType.share ?? 0,
  });

  console.log(
    `✅ ESCRITO: ${docs.length} interacciones + contadores del sitio actualizados.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("seed falló:", e);
    process.exit(1);
  });
