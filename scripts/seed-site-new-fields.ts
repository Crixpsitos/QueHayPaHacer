/**
 * Seed de campos nuevos (redes sociales, botón de reserva, cierre temporal)
 * en sitios específicos por slug.
 *
 * Uso:
 *   npx tsx scripts/seed-site-new-fields.ts            # dry-run (sin cambios)
 *   npx tsx scripts/seed-site-new-fields.ts --apply    # aplica los cambios
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");

// ── Definición de los sitios a actualizar ─────────────────────────────────────

const UPDATES: {
  slug: string;
  description: string;
  patch: Record<string, unknown>;
}[] = [
  {
    slug: "other-de-prueba-30-mrvj2eo8-29",
    description: "Redes sociales + botón de reserva (WhatsApp)",
    patch: {
      socialMedia: {
        instagram: "https://instagram.com/quehaypahacer",
        facebook:  "https://facebook.com/quehaypahacer",
        tiktok:    "https://tiktok.com/@quehaypahacer",
        twitter:   "https://twitter.com/quehaypahacer",
        website:   "https://quehaypahacerapp.com",
      },
      bookingUrl: "https://wa.me/573000000000?text=Hola%2C%20quiero%20reservar%20una%20mesa",
      temporarilyClosed: { isClosed: false, reason: "" },
    },
  },
  {
    slug: "restaurant-de-prueba-18-mrvj2byf-17",
    description: "Cierre temporal por remodelación",
    patch: {
      temporarilyClosed: {
        isClosed: true,
        reason:   "Estamos en remodelación. Volvemos en agosto con una nueva experiencia.",
      },
    },
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const db = getFirebaseFirestore();

  console.log(`\n🌱 seed-site-new-fields — modo: ${APPLY ? "APPLY ✏️" : "DRY-RUN 👀"}\n`);
  console.log("─".repeat(70));

  for (const { slug, description, patch } of UPDATES) {
    // Buscar el doc por slug
    const snap = await db.collection("sites").where("slug", "==", slug).limit(1).get();

    if (snap.empty) {
      console.log(`❌  [${slug}] — no encontrado en Firestore`);
      continue;
    }

    const doc = snap.docs[0];
    console.log(`\n📄 [${slug}]`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Acción: ${description}`);
    console.log(`   Patch:`);
    console.log(JSON.stringify(patch, null, 4).replace(/^/gm, "     "));

    if (APPLY) {
      await doc.ref.update({ ...patch, updatedAt: FieldValue.serverTimestamp() });
      console.log(`   ✅  Actualizado`);
    } else {
      console.log(`   ⏭  Dry-run — usa --apply para guardar`);
    }
  }

  console.log("\n" + "─".repeat(70));
  console.log(APPLY ? "\n✅  Todos los cambios aplicados." : "\n⚠️  Dry-run completado. Nada fue modificado.");
}

main().catch((e) => { console.error(e); process.exit(1); });
