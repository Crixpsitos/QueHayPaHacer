/**
 * Diagnóstico: muestra el valor real de `createdAt` en la colección `sites`
 * y detecta cuáles seguirían mostrando el badge "Nuevo" según la regla del
 * dominio (< 7 días desde createdAt).
 *
 * Uso:
 *   npx tsx scripts/inspect-sites-new-badge.ts           # muestra todos
 *   npx tsx scripts/inspect-sites-new-badge.ts --only-new # solo los que muestran "Nuevo"
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import type { Timestamp } from "firebase-admin/firestore";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONLY_NEW = process.argv.includes("--only-new");

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("sites").get();

  console.log(`\n📦 sites: ${snap.size} documentos encontrados\n`);
  console.log(`Regla "Nuevo": createdAt < ${SEVEN_DAYS_MS / (1000 * 60 * 60 * 24)} días atrás`);
  console.log(`Fecha actual: ${new Date().toISOString()}\n`);
  console.log("─".repeat(100));

  let showingNew = 0;
  let missingCreatedAt = 0;
  let problems = 0;

  for (const doc of snap.docs) {
    const data = doc.data() as {
      name?: string;
      createdAt?: Timestamp | null;
      publicationStatus?: string;
      moderationStatus?: string;
      isActive?: boolean;
    };

    const raw = data.createdAt;
    const rawType = raw === null || raw === undefined ? "NULL/UNDEFINED" : typeof raw === "object" && "toDate" in raw ? "Timestamp" : typeof raw;

    let createdAtDate: Date | null = null;
    let daysAgo: number | null = null;
    let isNew = false;

    if (raw && typeof raw === "object" && "toDate" in raw) {
      createdAtDate = (raw as Timestamp).toDate();
      daysAgo = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
      isNew = Date.now() - createdAtDate.getTime() < SEVEN_DAYS_MS;
    } else {
      missingCreatedAt++;
      // Si no hay createdAt, el mapper usa new Date() → siempre isNew = true
      isNew = true;
    }

    if (isNew) showingNew++;

    const isProblem = isNew && (daysAgo === null || daysAgo > 7);
    if (isProblem) problems++;

    if (ONLY_NEW && !isNew) continue;

    const badge = isNew ? "🆕 NUEVO" : "  ----  ";
    const warn = isProblem ? " ⚠️  PROBLEMA" : "";
    const dateStr = createdAtDate ? createdAtDate.toISOString() : `[${rawType}]`;
    const daysStr = daysAgo !== null ? `${daysAgo.toFixed(1)}d atrás` : "desconocido";
    const status = `${data.publicationStatus ?? "?"}/${data.moderationStatus ?? "?"}`;

    console.log(
      `${badge}${warn}\n` +
      `  ID: ${doc.id}\n` +
      `  Nombre: ${data.name ?? "(sin nombre)"}\n` +
      `  Estado: ${status} | activo: ${data.isActive ?? "?"}\n` +
      `  createdAt tipo: ${rawType}\n` +
      `  createdAt valor: ${dateStr}\n` +
      `  Hace: ${daysStr}\n`
    );
  }

  console.log("─".repeat(100));
  console.log(`\n📊 Resumen:`);
  console.log(`   Total sites:              ${snap.size}`);
  console.log(`   Mostrando badge "Nuevo":  ${showingNew}`);
  console.log(`   Sin createdAt (null/falta): ${missingCreatedAt}`);
  console.log(`   ⚠️  Con problema (>7d pero "Nuevo"): ${problems}`);
  console.log();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
