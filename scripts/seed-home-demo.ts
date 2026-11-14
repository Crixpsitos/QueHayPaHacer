/**
 * Datos de DEMO para ver el Home nuevo completo en DEVELOP: ~21 eventos repartidos desde hoy hasta febrero (hoy 5, mañana 1,
 * fin de semana, próximas semanas, diciembre y enero), 5 destacados y 4 escapaditas (Juntas, Cajamarca, Melgar, Honda) que apuntan
 * a eventos de esos pueblos. Fechas relativas a hoy (hora de Bogotá). Se niega a correr fuera de quehaypahacer-develop.
 *
 * Marca `metadata.seedBatch="home-demo"` para borrarlos.
 *
 * Uso:
 *   npx tsx scripts/seed-home-demo.ts          # crea (borra antes los de un seed anterior)
 *   npx tsx scripts/seed-home-demo.ts --clean  # solo borra
 */
import "./_loadEnv";

const BATCH = "home-demo";
const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

interface Demo {
  key: string
  title: string
  /** Días desde hoy y hora local (puede traer decimales: 21.5 = 9:30 pm). */
  day: number
  hour: number
  venue: string
  address: string
  price: number
  cat: string
  /** Pueblo donde ocurre (si no, Ibagué). */
  town?: string
  /** Nombre (prefijo) de un sitio de develop al que se vincula el evento. */
  site?: string
  featured?: boolean
}

const EVENTS: Demo[] = [
  // hoy: 5 (el primero es el principal)
  { key: "cine", title: "Cine al parque: noche de cortos", day: 0, hour: 18, venue: "Parque Centenario", address: "Cra 4 con Calle 10", price: 0, cat: "cultura" },
  { key: "coldplay", title: "Candlelight: tributo a Coldplay", day: 0, hour: 19, venue: "Teatro Tolima", address: "Cra 3 #10-52", price: 65000, cat: "musica", featured: true },
  { key: "salsa", title: "Jueves de salsa en vivo", day: 0, hour: 20, venue: "La Terraza", address: "Calle 60 #5-30", price: 10000, cat: "musica", site: "Bar de prueba" },
  { key: "comedia", title: "Micrófono abierto de comedia", day: 0, hour: 21, venue: "Brewing", address: "Cra 5 #32-10", price: 15000, cat: "entretenimiento", site: "Bar de prueba" },
  { key: "karaoke", title: "Karaoke de despecho", day: 0, hour: 21.5, venue: "La Cantina", address: "Calle 12 #3-15", price: 0, cat: "musica" },
  // mañana: solo 1
  { key: "viejoteca", title: "Viejoteca de los 80", day: 1, hour: 20, venue: "Club Campestre", address: "Vía Picaleña km 2", price: 30000, cat: "musica", featured: true },
  // fin de semana y próximos días
  { key: "famusifro", title: "FAMUSIFRO: bandas sinfónicas", day: 2, hour: 15, venue: "C.C. Acqua", address: "Cra 5 #60-20", price: 0, cat: "musica", featured: true },
  { key: "rueda", title: "Rueda por Ibagué: ciclopaseo", day: 2, hour: 8, venue: "Parque Deportivo", address: "Calle 42 con Cra 5", price: 0, cat: "deportes" },
  { key: "plata", title: "Caminata a la Cascada La Plata", day: 3, hour: 7, venue: "Salida desde Juntas", address: "Vereda Juntas", price: 25000, cat: "naturaleza", town: "juntas" },
  { key: "mercado", title: "Mercado campesino de Cajamarca", day: 2, hour: 9, venue: "Parque principal", address: "Cajamarca, Tolima", price: 0, cat: "gastronomia", town: "cajamarca" },
  { key: "cancion", title: "Festival de la Canción Inédita: final", day: 3, hour: 16, venue: "Teatro Tolima", address: "Cra 3 #10-52", price: 20000, cat: "musica", featured: true },
  { key: "piscina", title: "Fiesta de piscina en Melgar", day: 2, hour: 12, venue: "Club Las Palmas", address: "Melgar, Tolima", price: 45000, cat: "rumba", town: "melgar" },
  { key: "lectura", title: "Club de lectura: García Márquez", day: 4, hour: 18.5, venue: "Biblioteca Darío Echandía", address: "Calle 9 #2-20", price: 0, cat: "cultura" },
  { key: "tango", title: "Noche de tango", day: 6, hour: 20, venue: "Casa Taller", address: "Calle 15 #4-40", price: 25000, cat: "musica" },
  { key: "queen", title: "Candlelight: lo mejor de Queen", day: 8, hour: 19, venue: "Teatro Tolima", address: "Cra 3 #10-52", price: 65000, cat: "musica", featured: true },
  { key: "honda", title: "Recorrido por el centro histórico de Honda", day: 10, hour: 9, venue: "Plaza de Honda", address: "Honda, Tolima", price: 20000, cat: "cultura", town: "honda" },
  { key: "museos", title: "Noche de museos", day: 14, hour: 18, venue: "Museo de Arte del Tolima", address: "Calle 9 #2-30", price: 0, cat: "cultura", site: "Museum de prueba", featured: true },
  // diciembre y enero
  { key: "novenas", title: "Novenas navideñas con orquesta", day: 30, hour: 18, venue: "Teatro Tolima", address: "Cra 3 #10-52", price: 35000, cat: "musica" },
  { key: "alumbrado", title: "Encendido del alumbrado navideño", day: 33, hour: 19, venue: "Plaza de Bolívar", address: "Calle 10 con Cra 3", price: 0, cat: "cultura" },
  { key: "reyes", title: "Concierto de Reyes", day: 52, hour: 18, venue: "Teatro Tolima", address: "Cra 3 #10-52", price: 40000, cat: "musica" },
  { key: "feria", title: "Feria de emprendedores", day: 54, hour: 16, venue: "Plaza de Bolívar", address: "Calle 10 con Cra 3", price: 0, cat: "gastronomia" },
]

const TOWNS = [
  { id: "demo-juntas", name: "Juntas y el Cañón del Combeima", slug: "juntas", minutesAway: 40, order: 1, events: ["plata"] },
  { id: "demo-cajamarca", name: "Cajamarca", slug: "cajamarca", minutesAway: 60, order: 2, events: ["mercado"] },
  { id: "demo-melgar", name: "Melgar", slug: "melgar", minutesAway: 90, order: 3, events: ["piscina"] },
  { id: "demo-honda", name: "Honda", slug: "honda", minutesAway: 150, order: 4, events: ["honda"] },
]

async function main() {
  const { getFirebaseFirestore } = await import("../infraestructure/firebase/config/admin/firebase");
  const { Timestamp, GeoPoint } = await import("firebase-admin/firestore");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId !== "quehaypahacer-develop") throw new Error(`Solo develop (proyecto actual: ${projectId}).`);
  const db = getFirebaseFirestore();

  const old = await db.collection("events").where("metadata.seedBatch", "==", BATCH).get();
  await Promise.all(old.docs.map((d) => d.ref.delete()));
  const oldEsc = await db.collection("escapadas").where("metadata.seedBatch", "==", BATCH).get();
  await Promise.all(oldEsc.docs.map((d) => d.ref.delete()));
  console.log(`Borrados ${old.size} eventos y ${oldEsc.size} escapadas de un seed anterior.`);
  if (process.argv.includes("--clean")) return;

  const user = (await db.collection("users").limit(1).get()).docs[0];
  if (!user) throw new Error("No hay usuarios en develop.");
  const u = user.data() as { displayName?: string; photoURL?: string };
  const cats = (await db.collection("categories").where("isActive", "==", true).get()).docs.map((d) => ({ id: d.id, ...(d.data() as { title: string; slug: string }) }));
  const cat = (slug: string) => cats.find((c) => c.slug === slug) ?? cats.find((c) => c.slug.includes(slug.slice(0, 4))) ?? cats[0];
  const sites = (await db.collection("sites").where("publicationStatus", "==", "published").limit(80).get()).docs.map((d) => ({ id: d.id, name: String((d.data() as { name?: string }).name ?? "") }));

  const todayIso = new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 10);
  const at = (day: number, hour: number) => {
    const d = new Date(Date.parse(`${todayIso}T00:00:00-05:00`) + day * 86_400_000);
    return new Date(d.getTime() + Math.round(hour * 60) * 60_000);
  };
  const now = new Date();
  const ids: Record<string, string> = {};

  let i = 0;
  for (const e of EVENTS) {
    const c = cat(e.cat);
    const ref = db.collection("events").doc();
    ids[e.key] = ref.id;
    const start = at(e.day, e.hour);
    const town = e.town ? TOWNS.find((t) => t.slug === e.town)! : null;
    const site = e.site ? sites.find((s) => s.name.startsWith(e.site!)) : undefined;
    // los de sitio vinculado toman el nombre del sitio de develop como lugar
    const venue = site ? site.name : e.venue;
    await ref.set({
      id: ref.id,
      slug: `${slugify(e.title)}-${Date.now().toString(36)}-${i}`,
      title: e.title,
      shortDescription: `${e.title} en ${town ? town.slug[0].toUpperCase() + town.slug.slice(1) : "Ibagué"}.`,
      description: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: `Evento de demostración del Home (seed-home-demo): ${e.title}.` }] }], attrs: {} },
      media: [],
      categoryInfo: { id: c.id, title: c.title, slug: c.slug, tags: ["demo", c.slug] },
      author: { id: user.id, displayName: u.displayName ?? "Organizador", photoURL: u.photoURL ?? "" },
      location: {
        siteId: site?.id ?? null,
        venue,
        address: e.address,
        moreInfo: "",
        city: { name: town ? town.slug[0].toUpperCase() + town.slug.slice(1) : "Ibagué", slug: town?.slug ?? "ibague" },
        department: { isoCode: "TOL", name: "Tolima", slug: "tolima" },
        country: { isoCode: "CO", name: "Colombia", slug: "colombia" },
        coordinates: new GeoPoint(4.4389, -75.2322),
      },
      status: "published",
      registrationType: "none",
      price: e.price ? { isFree: false, amount: e.price, currency: "COP" } : { isFree: true, amount: 0, currency: "COP" },
      promotion: e.featured
        ? { isPromoted: true, promotedAt: Timestamp.fromDate(now), promotedUntil: Timestamp.fromDate(new Date(now.getTime() + 60 * 86_400_000)) }
        : { isPromoted: false },
      eventType: "standard",
      collaborators: [],
      collaboratorsData: {},
      analytics: { views: 100 - i, clicks: 0, likes: 5, registrations: 0, shares: 0, score: 100 - i },
      startDate: Timestamp.fromDate(start),
      endDate: Timestamp.fromDate(new Date(start.getTime() + 2 * 3_600_000)),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      publishedAt: Timestamp.fromDate(now),
      metadata: { seed: true, seedBatch: BATCH },
    });
    i++;
  }

  for (const t of TOWNS) {
    await db.collection("escapadas").doc(t.id).set({
      name: t.name, slug: t.slug, minutesAway: t.minutesAway, coverUrl: "", order: t.order, isActive: true,
      eventIds: t.events.map((k) => ids[k]),
      metadata: { seed: true, seedBatch: BATCH },
    });
  }
  console.log(`✅ ${EVENTS.length} eventos, ${EVENTS.filter((e) => e.featured).length} destacados y ${TOWNS.length} escapaditas (batch "${BATCH}").`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
