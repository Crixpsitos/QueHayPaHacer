/**
 * Migración: `sites/{id}.location` de forma PLANA (countrySlug, country, regionSlug,
 * region, citySlug, city) a ANIDADA — `country`/`department` como {isoCode,name,slug},
 * `city` como {name,slug}, + `venue`, `moreInfo`, `siteId`. El `geo` (GeoPoint) se
 * mantiene tal cual.
 *
 * Uso:
 *   npx tsx scripts/migrate-sites-location.ts            # DRY-RUN (no escribe nada)
 *   npx tsx scripts/migrate-sites-location.ts --apply    # aplica los cambios
 *
 * Requiere las credenciales admin en el entorno (las mismas que usa la app).
 * Idempotente: salta los docs ya migrados (donde `location.country` ya es objeto).
 *
 * ponytail: batch de 400 (límite Firestore 500). Ibagué → CO/TOL vía country-state-city.
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { buildLocationDetails } from "@/app/lib/utils/geoLocation";

const APPLY = process.argv.includes("--apply");

// Plataforma Ibagué-only por ahora: los sitios con country/region/city vacíos
// (creados solo con address + geo) se completan con Ibagué/Tolima/Colombia.
// ponytail: quitar el default cuando haya sitios fuera de Ibagué.
const IBAGUE = {
  country: "Colombia",
  department: "Tolima",
  city: "Ibagué",
};

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("sites").get();
  console.log(`sites: ${snap.size} docs — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`);

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const loc = (data.location ?? {}) as Record<string, unknown>;

    // Ya migrado: `country` es objeto (nueva forma) en vez de string.
    if (loc.country && typeof loc.country === "object") {
      skipped++;
      continue;
    }

    const rawCountry = typeof loc.country === "string" ? loc.country.trim() : "";
    const rawRegion = typeof loc.region === "string" ? loc.region.trim() : "";
    const rawCity = typeof loc.city === "string" ? loc.city.trim() : "";

    const { country, department, city } = buildLocationDetails({
      countryName: rawCountry || IBAGUE.country,
      countrySlug: (typeof loc.countrySlug === "string" && loc.countrySlug) || undefined,
      departmentName: rawRegion || IBAGUE.department,
      departmentSlug: (typeof loc.regionSlug === "string" && loc.regionSlug) || undefined,
      cityName: rawCity || IBAGUE.city,
      citySlug: (typeof loc.citySlug === "string" && loc.citySlug) || undefined,
    });

    const newLocation = {
      geo: loc.geo, // GeoPoint nativo — SE MANTIENE
      address: typeof loc.address === "string" ? loc.address : "",
      city,
      department,
      country,
      venue: typeof data.name === "string" ? data.name : "",
      moreInfo: "",
    };

    console.log(
      `- ${doc.id}: ${country.name}/${department.name}/${city.name} (iso ${country.isoCode || "∅"}/${department.isoCode || "∅"})`,
    );

    if (APPLY) {
      batch.update(doc.ref, { location: newLocation });
      ops++;
      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    migrated++;
  }

  if (APPLY && ops > 0) await batch.commit();

  console.log(
    `\nHecho. A migrar: ${migrated}, ya migrados/saltados: ${skipped}. ${
      APPLY ? "✅ ESCRITO en Firestore." : "🟡 DRY-RUN: nada escrito (corre con --apply)."
    }`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("migración falló:", e);
    process.exit(1);
  });
