/**
 * Migración: `events/{id}.location` a la forma uniforme con sites —
 *   - `country`/`department`: se les AGREGA `slug` (conservan isoCode+name).
 *   - `city`: string → objeto `{name, slug}`.
 *   - `coordinates`: `{lat, lng}` simple → **GeoPoint** nativo de Firebase.
 *   - `siteId`: se agrega (preserva el existente, o `null` = venue externo).
 *   - `venue`/`address`/`moreInfo`: se conservan.
 *
 * A diferencia de sites, NO se aplica default Ibagué: los eventos con location
 * vacía suelen ser borradores sin ubicación elegida; se reescriben en su forma
 * nueva pero vacía (el usuario la completa al publicar).
 *
 * Uso:
 *   npx tsx scripts/migrate-events-location.ts            # DRY-RUN (no escribe)
 *   npx tsx scripts/migrate-events-location.ts --apply    # aplica los cambios
 *
 * Idempotente: salta los docs ya migrados (donde `coordinates` ya es GeoPoint).
 */
import "./_loadEnv"; // DEBE ir primero: carga .env antes de importar la config de Firebase
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { GeoPoint } from "firebase-admin/firestore";
import { toGeoSlug } from "@/app/lib/utils/geoLocation";

const APPLY = process.argv.includes("--apply");

/** Conserva isoCode+name y garantiza slug (desde name, o el existente). */
function detailWithSlug(d: unknown): { isoCode: string; name: string; slug: string } {
  const o = (d ?? {}) as { isoCode?: unknown; name?: unknown; slug?: unknown };
  const name = typeof o.name === "string" ? o.name : "";
  const existingSlug = typeof o.slug === "string" ? o.slug : "";
  return {
    isoCode: typeof o.isoCode === "string" ? o.isoCode : "",
    name,
    slug: existingSlug || (name ? toGeoSlug(name) : ""),
  };
}

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("events").get();
  console.log(`events: ${snap.size} docs — modo ${APPLY ? "APPLY (escribe)" : "DRY-RUN (no escribe)"}`);

  let migrated = 0;
  let skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const loc = (data.location ?? {}) as Record<string, unknown>;

    // Ya migrado: coordinates es GeoPoint.
    if (loc.coordinates instanceof GeoPoint) {
      skipped++;
      continue;
    }

    const coords = (loc.coordinates ?? {}) as { lat?: unknown; lng?: unknown };
    const lat = typeof coords.lat === "number" ? coords.lat : 0;
    const lng = typeof coords.lng === "number" ? coords.lng : 0;

    const cityName = typeof loc.city === "string"
      ? loc.city
      : ((loc.city as { name?: unknown })?.name as string | undefined) ?? "";

    const newLocation = {
      siteId: (loc.siteId as string | null | undefined) ?? null,
      venue: typeof loc.venue === "string" ? loc.venue : "",
      address: typeof loc.address === "string" ? loc.address : "",
      moreInfo: typeof loc.moreInfo === "string" ? loc.moreInfo : "",
      city: { name: cityName, slug: cityName ? toGeoSlug(cityName) : "" },
      department: detailWithSlug(loc.department),
      country: detailWithSlug(loc.country),
      coordinates: new GeoPoint(lat, lng),
    };

    console.log(
      `- ${doc.id}: ${newLocation.country.name || "∅"}/${newLocation.department.name || "∅"}/${newLocation.city.name || "∅"} · geo(${lat},${lng})`,
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
