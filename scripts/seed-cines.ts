/**
 * Actividades «Ir al cine» de los cines de Ibagué (E2): sin cartelera propia, con botón al sitio OFICIAL de cada cadena
 * (la cartelera cambia cada semana y no hay API pública: ver docs/32 y SPEC 8.7). Precio «a consultar».
 * Datos de la sala (dirección, cadena) verificados el 2026-11-12 en directorios públicos (locatecinemas.com, colombia.com) y
 * prensa; los enlaces son las páginas principales de cada cadena. DRY-RUN por defecto.
 * Uso: pnpm exec tsx scripts/seed-cines.ts --owner <uid> [--apply]      |      --clean --apply  (borra las tres)
 * ¡En producción solo con orden explícita del dueño!
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { ActivityFirebaseRepository } from "@/infraestructure/firebase/repositories/activities/ActivityFirebaseRepository";
import { makeActivity } from "@/domain/entities/activities/activity.fixture";
import { activityPublishError } from "@/domain/entities/activities/Activity";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CLEAN = args.includes("--clean");
const owner = args.includes("--owner") ? args[args.indexOf("--owner") + 1] : "";
const VERIFIED = "12 de noviembre de 2026";

const CINES = [
  { slug: "ir-al-cine-cinemark-multicentro", chain: "Cinemark", name: "Cinemark Multicentro", place: "Centro comercial Multicentro", address: "Carrera 5 No. 60-123, local 218", geo: { lat: 4.43619, lng: -75.20681 }, url: "https://www.cinemark.com.co" },
  { slug: "ir-al-cine-royal-films-acqua", chain: "Royal Films", name: "Royal Films Acqua", place: "Centro comercial Acqua", address: "Carrera 9 No. 57-2", geo: null, url: "https://www.royal-films.com" },
  { slug: "ir-al-cine-cine-colombia-la-estacion", chain: "Cine Colombia", name: "Cine Colombia La Estación", place: "Centro comercial La Estación", address: "Avenida Ambalá con calle 60", geo: null, url: "https://www.cinecolombia.com" },
];

async function main() {
  const db = getFirebaseFirestore();
  const repo = new ActivityFirebaseRepository(db);
  if (CLEAN) {
    for (const c of CINES) {
      const s = await db.collection("activities").where("slug", "==", c.slug).get();
      console.log(`${APPLY ? "borrando" : "(dry-run) borraría"} ${c.slug}: ${s.size}`);
      if (APPLY) for (const d of s.docs) await db.recursiveDelete(d.ref);
    }
    return;
  }
  if (!owner) throw new Error("Falta --owner <uid> (la cuenta que publica estas actividades).");
  for (const c of CINES) {
    const { id: _i, ...a } = makeActivity({
      slug: c.slug, title: `Ir al cine en ${c.name}`, tagline: `Mira la cartelera de ${c.chain} en Ibagué`,
      description: `${c.name} queda en el ${c.place}, ${c.address}, en Ibagué. La cartelera y los horarios cambian cada semana: míralos en el sitio oficial de ${c.chain} con el botón «Ver la cartelera» y compra tu boleta allá. Las funciones se reparten por salas y formatos, y los precios varían según el día.`,
      kind: "global", siteId: null, category: "cine-y-espectaculos", companions: ["pareja", "amigos", "familia"], difficulty: null, durationMinutes: 150, ageNote: "Según la clasificación de cada película",
      host: { kind: "user", id: owner, displayName: "Qué Hay Pa Hacer", photoURL: "" }, ownerUid: owner,
      meetingPoint: { mode: "fixed", text: `${c.place}, ${c.address}`, references: "", geo: c.geo },
      schedule: { rules: [{ kind: "always" }], skipDates: [], requiresReservation: false, note: "Funciones todos los días; los horarios los fija el cine cada semana." },
      priceOptions: [{ label: "Boleta (varía según día y formato)", amountCop: 0, unit: "consultar", includes: [] }], extras: [],
      sections: [{ title: "Cartelera y horarios", body: `La cartelera cambia cada semana: consúltala siempre en el sitio oficial de ${c.chain}. Datos de la sala (dirección y cadena) verificados el ${VERIFIED} en directorios públicos; los horarios y precios los confirma el cine.` }],
      offerings: [], spaces: [], promotions: [], join: null,
      cta: { kind: "website", value: c.url, label: "Ver la cartelera" }, media: [],
      publicationStatus: "published", moderationStatus: "approved", isActive: true,
      createdAt: new Date(), updatedAt: new Date(), publishedAt: new Date(), reviewedAt: new Date(), reviewedBy: "script:seed-cines",
    });
    const error = activityPublishError({ ...a, id: "x" } as never);
    // Sin foto: la portada compacta de la categoría hace de portada hasta que se suban fotos reales desde la app.
    if (error && !error.includes("portada")) throw new Error(`${c.slug}: ${error}`);
    console.log(`${c.slug} | ${a.title} | ${c.url}`);
    if (!APPLY) continue;
    if (await repo.slugExists(c.slug)) { console.log("  ya existe"); continue; }
    await repo.create(a);
  }
  console.log(APPLY ? "listo" : "(dry-run) agrega --apply para escribir");
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
