/**
 * Migra slugs de categorías de inglés a español preservando docIds.
 * Elimina las categorías duplicadas creadas por el seed con slugs españoles nuevos.
 *
 * Uso:
 *   npx tsx scripts/migrate-category-slugs.ts           # DRY-RUN
 *   npx tsx scripts/migrate-category-slugs.ts --apply   # aplica
 */
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync } from "fs";
import { resolve } from "path";

if (!getApps().length) {
  const serviceAccount = JSON.parse(readFileSync(resolve("quehaypahacerAccountService.json"), "utf-8"));
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore(getApps()[0], "quehaypahacer-db");
const APPLY = process.argv.includes("--apply");

// Mapa: slug inglés existente → slug español destino
const SLUG_MAP: Record<string, string> = {
  art:           "arte",
  food:          "gastronomia",
  sports:        "deportes",
  education:     "educacion",
  tech:          "tecnologia",
  health:        "bienestar",
  family:        "familia",
  party:         "entretenimiento",
  nature:        "naturaleza",
};

async function main() {
  console.log(`\n🔄 Migrar slugs de categorías — ${APPLY ? "APPLY ✏️" : "DRY-RUN 👀"}\n`);

  const coll = db.collection("categories");
  const all = await coll.get();

  const bySlug = new Map(all.docs.map((d) => [d.data().slug as string, d]));

  let renamed = 0;
  let deleted = 0;

  for (const [engSlug, esSlug] of Object.entries(SLUG_MAP)) {
    const oldDoc = bySlug.get(engSlug);
    const newDoc = bySlug.get(esSlug); // duplicado creado por el seed

    if (oldDoc) {
      console.log(`  ↻  ${engSlug} → ${esSlug} (docId: ${oldDoc.id})`);
      if (APPLY) {
        await oldDoc.ref.update({ slug: esSlug, updatedAt: FieldValue.serverTimestamp() });
      }
      renamed++;
    } else {
      console.log(`  ⚠  No se encontró categoría con slug="${engSlug}" — omitida`);
    }

    if (newDoc) {
      console.log(`  🗑  Eliminar duplicado "${esSlug}" (docId: ${newDoc.id})`);
      if (APPLY) await newDoc.ref.delete();
      deleted++;
    }
  }

  console.log(`\nResumen: ${renamed} renombradas, ${deleted} duplicados eliminados.`);
  if (!APPLY) console.log("⚠️  Dry-run. Pasa --apply para escribir en Firestore.");
  process.exit(0);
}

main().catch(console.error);
