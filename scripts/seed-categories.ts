/**
 * Script para crear/actualizar categorías de eventos en Firestore.
 * Las categorías ya no usan filtros — todas apuntan a /explorar.
 *
 * Uso:
 *   npx tsx scripts/seed-categories.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/seed-categories.ts --apply    # aplica los cambios
 */
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Init Firebase ──────────────────────────────────────────────────────────────
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    readFileSync(resolve("quehaypahacerAccountService.json"), "utf-8"),
  );
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore(getApps()[0], "quehaypahacer-db");
const APPLY = process.argv.includes("--apply");

// ── Definición de categorías ───────────────────────────────────────────────────
const CATEGORIES = [
  {
    slug: "musica",
    title: "Música",
    description: "Conciertos, festivales, presentaciones en vivo y experiencias musicales.",
    icon: "music",
  },
  {
    slug: "arte",
    title: "Arte & Cultura",
    description: "Exposiciones, teatro, danza, cine y todo lo que nutre el espíritu.",
    icon: "art",
  },
  {
    slug: "gastronomia",
    title: "Gastronomía",
    description: "Ferias de comida, catas, clases de cocina y eventos gastronómicos.",
    icon: "food",
  },
  {
    slug: "deportes",
    title: "Deportes",
    description: "Torneos, maratones, clases deportivas y competencias locales.",
    icon: "sports",
  },
  {
    slug: "educacion",
    title: "Educación",
    description: "Charlas, talleres, conferencias y eventos académicos para aprender.",
    icon: "education",
  },
  {
    slug: "tecnologia",
    title: "Tecnología",
    description: "Hackathons, meetups, demos y conferencias sobre innovación y tech.",
    icon: "tech",
  },
  {
    slug: "bienestar",
    title: "Bienestar",
    description: "Yoga, meditación, spa, talleres de salud mental y vida saludable.",
    icon: "health",
  },
  {
    slug: "familia",
    title: "Familia",
    description: "Actividades para niños, ferias familiares y planes para todos.",
    icon: "family",
  },
  {
    slug: "entretenimiento",
    title: "Entretenimiento",
    description: "Fiestas, shows de comedia, eventos nocturnos y todo lo divertido.",
    icon: "party",
  },
  {
    slug: "naturaleza",
    title: "Naturaleza",
    description: "Senderismo, ecoturismo, actividades al aire libre y campamentos.",
    icon: "nature",
  },
] as const;

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏷️  Seed de categorías — modo ${APPLY ? "APPLY ✏️" : "DRY-RUN 👀"}\n`);

  const coll = db.collection("categories");
  const existing = await coll.get();
  const bySlug = new Map(existing.docs.map((d) => [d.data().slug, d.id]));

  let created = 0;
  let updated = 0;

  for (const cat of CATEGORIES) {
    const data = {
      slug: cat.slug,
      title: cat.title,
      description: cat.description,
      icon: cat.icon,
      isActive: true,
      navigation: { resource: "/explorar", filters: {} },
      updatedAt: FieldValue.serverTimestamp(),
    };

    const existingId = bySlug.get(cat.slug);
    if (existingId) {
      console.log(`  ↻  ${cat.slug}: ${cat.title} (actualiza)`);
      if (APPLY) await coll.doc(existingId).update(data);
      updated++;
    } else {
      console.log(`  +  ${cat.slug}: ${cat.title} (nueva)`);
      if (APPLY) await coll.add({ ...data, createdAt: Timestamp.now() });
      created++;
    }
  }

  console.log(`\nResumen: ${created} nuevas, ${updated} actualizadas.`);
  if (!APPLY) console.log("⚠️  Dry-run. Pasa --apply para escribir en Firestore.");
}

main().catch(console.error);
