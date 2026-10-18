/**
 * Repara `events/{id}.location.coordinates` guardados como map `{_latitude,_longitude}`
 * (bug de removeUndefinedProperties que aplanaba GeoPoints) → GeoPoint real.
 * Si el map quedó en 0,0 intenta recuperar desde `location.lat/lng`. Los que no
 * tienen ningún dato recuperable se listan para corregir a mano.
 *
 * Uso:
 *   pnpm exec tsx scripts/repair-event-geopoints.ts           # dry-run
 *   pnpm exec tsx scripts/repair-event-geopoints.ts --apply   # escribe
 */
import "./_loadEnv";
import { GeoPoint } from "firebase-admin/firestore";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";

const APPLY = process.argv.includes("--apply");
const num = (v: unknown) => (typeof v === "number" && v !== 0 ? v : undefined);

async function main() {
  const db = getFirebaseFirestore();
  const snap = await db.collection("events").select("title", "location").get();
  let repaired = 0;
  const unrecoverable: string[] = [];

  for (const doc of snap.docs) {
    const loc = doc.data().location ?? {};
    const c = loc.coordinates;
    if (c instanceof GeoPoint && c.latitude !== 0) continue;

    const lat = num(c?.latitude) ?? num(c?._latitude) ?? num(loc.lat);
    const lng = num(c?.longitude) ?? num(c?._longitude) ?? num(loc.lng);
    if (lat === undefined || lng === undefined) {
      unrecoverable.push(`${doc.id} (${doc.data().title ?? "sin título"})`);
      continue;
    }

    repaired++;
    console.log(`${APPLY ? "repara" : "repararía"} ${doc.id}: ${lat}, ${lng}`);
    if (APPLY) {
      await doc.ref.update({
        "location.coordinates": new GeoPoint(lat, lng),
        "location.lat": lat,
        "location.lng": lng,
      });
    }
  }

  console.log(`\n${repaired} reparables · ${unrecoverable.length} sin coordenadas recuperables`);
  for (const line of unrecoverable) console.log(`  - ${line}`);
  if (!APPLY) console.log("dry-run (usa --apply)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
