/**
 * Seed masivo de eventos de prueba para probar listados/landings/paginación.
 * Crea 100 eventos (mix standard + multi-date con sesiones) atribuidos a usuarios
 * existentes, categorías reales (categoryInfo.id = docId), fechas futuras, scores
 * variados. Carga "música" pesado para superar 20 futuros (probar paginación).
 *
 * Marca metadata.seedBatch="bulk100" para poder borrarlos.
 *
 * Uso:
 *   npx tsx scripts/seed-bulk-events.ts          # crea 100
 *   npx tsx scripts/seed-bulk-events.ts --clean  # borra el batch (y sus sesiones)
 */
export {};

for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

const BATCH = "bulk100";
const N = 100;
const UNSPLASH = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";
const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const rnd = (n: number) => Math.floor(Math.random() * n);

async function clean(db: FirebaseFirestore.Firestore) {
  const snap = await db.collection("events").where("metadata.seedBatch", "==", BATCH).get();
  console.log(`Borrando ${snap.size} eventos del batch "${BATCH}"...`);
  let sessions = 0;
  for (const doc of snap.docs) {
    const ss = await doc.ref.collection("sessions").get();
    for (const s of ss.docs) {
      await s.ref.delete();
      sessions++;
    }
    await doc.ref.delete();
  }
  console.log(`✅ Borrados ${snap.size} eventos + ${sessions} sesiones.`);
}

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { Timestamp, GeoPoint } = await import("firebase-admin/firestore");
  const db = getFirebaseFirestore();

  if (process.argv.includes("--clean")) {
    await clean(db);
    return;
  }

  const usersSnap = await db.collection("users").limit(40).get();
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  if (users.length === 0) throw new Error("No hay usuarios.");

  const catsSnap = await db.collection("categories").where("isActive", "==", true).get();
  const cats = catsSnap.docs.map((d) => {
    const c = d.data() as Record<string, unknown>;
    return { id: d.id, title: c.title as string, slug: c.slug as string };
  });
  if (cats.length === 0) throw new Error("No hay categorías activas.");
  const musica = cats.find((c) => c.slug === "musica");

  const now = new Date();
  const descDoc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Evento de prueba generado por seed-bulk-events." }] }],
    attrs: {},
  };
  const mkLocation = () => ({
    siteId: null,
    venue: "Teatro Tolima",
    address: "Cra 3 #10-52",
    moreInfo: "",
    city: { name: "Ibagué", slug: "ibague" },
    department: { isoCode: "TOL", name: "Tolima", slug: "tolima" },
    country: { isoCode: "CO", name: "Colombia", slug: "colombia" },
    coordinates: new GeoPoint(4.4389, -75.2322),
  });

  let standard = 0;
  let multi = 0;
  let sessionsTotal = 0;

  for (let i = 0; i < N; i++) {
    const author = users[i % users.length] as { id: string; displayName?: string; photoURL?: string };
    // Música pesado (pares) → >20 futuros para probar paginación.
    const cat = i % 2 === 0 && musica ? musica : cats[i % cats.length];
    const isMulti = i % 5 < 2; // ~40%
    const title = `${isMulti ? "Multi" : "Evento"} ${cat.title} ${i + 1} (prueba)`;
    const slug = `${slugify(title)}-${Date.now().toString(36)}-${i}`;
    const score = rnd(100);
    const price =
      i % 3 === 0
        ? { isFree: true, amount: 0, currency: "COP" }
        : { isFree: false, amount: (rnd(5) + 1) * 10000, currency: "COP" };

    const base = {
      slug,
      title,
      shortDescription: `Evento de prueba de ${cat.title} en Ibagué.`,
      description: descDoc,
      mainImage: { url: UNSPLASH, path: "" },
      media: [],
      categoryInfo: { id: cat.id, title: cat.title, slug: cat.slug, tags: ["prueba", cat.slug] },
      author: {
        id: author.id,
        displayName: author.displayName ?? "Organizador",
        photoURL: author.photoURL ?? avatar(author.displayName ?? "Org"),
      },
      location: mkLocation(),
      status: "published",
      registrationType: "none",
      price,
      promotion: { isPromoted: false },
      eventType: isMulti ? "multi-date" : "standard",
      analytics: { views: rnd(500), clicks: 0, likes: rnd(50), registrations: 0, shares: rnd(20), score },
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      publishedAt: Timestamp.fromDate(now),
      metadata: { seed: true, seedBatch: BATCH },
    };

    const ref = db.collection("events").doc();

    if (isMulti) {
      const nSessions = 2 + rnd(3); // 2-4
      const dates: { start: Date; end: Date }[] = [];
      for (let s = 0; s < nSessions; s++) {
        const start = new Date(now.getTime() + ((i % 60) + 1 + s * 2) * 86400_000);
        start.setHours(19, 0, 0, 0);
        dates.push({ start, end: new Date(start.getTime() + 3 * 3600_000) });
      }
      await ref.set({
        id: ref.id,
        ...base,
        startDate: Timestamp.fromDate(dates[0].start),
        endDate: Timestamp.fromDate(dates[dates.length - 1].end),
      });
      const col = ref.collection("sessions");
      for (let s = 0; s < nSessions; s++) {
        const sref = col.doc();
        await sref.set({
          id: sref.id,
          eventId: ref.id,
          slug: `${slug}-sesion-${s + 1}`,
          title: `Sesión ${s + 1}`,
          shortDescription: `Fecha ${s + 1}`,
          description: descDoc,
          coverSource: "own",
          mainImage: { url: UNSPLASH, path: "" },
          media: [],
          location: mkLocation(),
          startDate: Timestamp.fromDate(dates[s].start),
          endDate: Timestamp.fromDate(dates[s].end),
          registrationType: "none",
          price,
          status: "published",
          analytics: { views: 0, registrations: 0, shares: 0 },
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        });
        sessionsTotal++;
      }
      multi++;
    } else {
      const start = new Date(now.getTime() + ((i % 90) + 1) * 86400_000);
      start.setHours(20, 0, 0, 0);
      await ref.set({
        id: ref.id,
        ...base,
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(new Date(start.getTime() + 3 * 3600_000)),
      });
      standard++;
    }

    if ((i + 1) % 20 === 0) console.log(`  ...${i + 1}/${N}`);
  }

  console.log(
    `\n✅ ${N} eventos: ${standard} standard, ${multi} multi-date (${sessionsTotal} sesiones). ` +
      `Autores: ${users.length}. Categorías: ${cats.length}. metadata.seedBatch="${BATCH}".`,
  );
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
