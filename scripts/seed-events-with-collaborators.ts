/**
 * Crea eventos de prueba PUBLICADOS con colaboradores acreditados para probar
 * visualmente los créditos (card + modal del detalle):
 *   - 1 standard (con fecha/lugar propios)
 *   - 1 multi-date con 3 SESIONES reales (subcolección events/{id}/sessions)
 *
 * Colaboradores: usuarios profesionales de prueba + 2 perfiles externos con bio/redes.
 * Marca `metadata.seed = true` para poder borrarlos con cleanup-test-events.ts.
 *
 * Uso:
 *   npx tsx scripts/seed-events-with-collaborators.ts [owner-email]
 *
 * Carga `.env` / `.env.local` (FIREBASE_SERVICE_ACCOUNT_JSON) por su cuenta.
 */
export {}; // módulo (scope aislado)

for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

const DEFAULT_OWNER = "cristianpee2609@gmail.com";
const UNSPLASH = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80";
const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const { getFirebaseFirestore } = await import(
    "../infraestructure/firebase/config/admin/firebase"
  );
  const { Timestamp, GeoPoint, FieldValue } = await import("firebase-admin/firestore");

  const ownerEmail = (process.argv[2] ?? DEFAULT_OWNER).trim().toLowerCase();
  const db = getFirebaseFirestore();

  // 1) Owner (author + managedBy).
  const ownerSnap = await db.collection("users").where("email", "==", ownerEmail).limit(1).get();
  if (ownerSnap.empty) {
    console.error(`No encontré un usuario con el correo ${ownerEmail}.`);
    process.exit(1);
  }
  const owner = ownerSnap.docs[0];
  const ownerUid = owner.id;
  const o = owner.data() as { displayName?: string; photoURL?: string };
  const author = {
    id: ownerUid,
    displayName: o.displayName ?? "Organizador",
    photoURL: o.photoURL ?? avatar(o.displayName ?? "Org"),
  };

  // 2) Colaboradores usuario: profesionales de prueba (excluye owner).
  const prosSnap = await db.collection("users").where("accountType", "==", "professional").limit(6).get();
  const userCollabs = prosSnap.docs
    .filter((d) => d.id !== ownerUid)
    .slice(0, 3)
    .map((d) => {
      const u = d.data() as { displayName?: string; photoURL?: string };
      return {
        refId: d.id,
        kind: "user" as const,
        displayName: u.displayName ?? "Colaborador",
        photoURL: u.photoURL ?? avatar(u.displayName ?? "Col"),
        role: "viewer" as const,
      };
    });

  // 3) Perfiles externos (managedBy owner) con bio + redes.
  const externalsSeed = [
    { displayName: "Sonido Vivo", type: "producer", bio: "Productora de sonido en vivo para conciertos.", socialLinks: { instagram: "@sonidovivo", website: "https://sonidovivo.co" } },
    { displayName: "DJ Aurora", type: "artist", bio: "Selectora de techno melódico.", socialLinks: { instagram: "@dj.aurora", tiktok: "@djaurora" } },
  ];
  const externalCollabs: { refId: string; kind: "external"; displayName: string; photoURL: string; role: "credit" }[] = [];
  for (const e of externalsSeed) {
    const ref = await db.collection("externalProfiles").add({
      displayName: e.displayName,
      photoURL: avatar(e.displayName),
      bio: e.bio,
      type: e.type,
      managedBy: ownerUid,
      email: null,
      socialLinks: e.socialLinks,
      linkedUserId: null,
      seed: true,
      createdAt: FieldValue.serverTimestamp(),
    });
    externalCollabs.push({ refId: ref.id, kind: "external", displayName: e.displayName, photoURL: avatar(e.displayName), role: "credit" });
  }

  const allCollabs = [...userCollabs, ...externalCollabs];
  const collaborators = allCollabs.map((c) => ({ refId: c.refId, kind: c.kind }));
  const collaboratorsData = Object.fromEntries(
    allCollabs.map((c) => [c.refId, { displayName: c.displayName, photoURL: c.photoURL, role: c.role }]),
  );

  const now = new Date();
  const descDoc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Descripción de prueba para ver los créditos de colaboradores en la card y el detalle." }] }],
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

  const eventBase = (title: string, eventType: "standard" | "multi-date") => ({
    slug: `${slugify(title)}-${Date.now().toString(36)}`,
    title,
    shortDescription: "Evento de prueba con colaboradores acreditados.",
    description: descDoc,
    mainImage: { url: UNSPLASH, path: "" },
    media: [],
    categoryInfo: { id: "musica", title: "Música", slug: "musica", tags: ["rock", "envivo", "prueba"] },
    author,
    location: mkLocation(),
    status: "published",
    registrationType: "none",
    price: { isFree: true, amount: 0, currency: "COP" },
    promotion: { isPromoted: false },
    eventType,
    collaborators,
    collaboratorsData,
    analytics: { views: 120, clicks: 0, likes: 15, registrations: 0, score: 100 },
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
    publishedAt: Timestamp.fromDate(now),
    metadata: { seed: true },
  });

  const created: { title: string; slug: string; type: string }[] = [];

  // Standard
  {
    const start = new Date(now.getTime() + 2 * 86400_000);
    const end = new Date(start.getTime() + 3 * 3600_000);
    const ref = db.collection("events").doc();
    const base = eventBase("Concierto de prueba (standard)", "standard");
    await ref.set({ id: ref.id, ...base, startDate: Timestamp.fromDate(start), endDate: Timestamp.fromDate(end) });
    created.push({ title: base.title, slug: base.slug, type: "standard" });
  }

  // Multi-date + 3 sesiones reales
  {
    const ref = db.collection("events").doc();
    const base = eventBase("Festival de prueba (multi-date)", "multi-date");
    const sessionDates = [0, 1, 2].map((i) => {
      const s = new Date(now.getTime() + (2 + i * 3) * 86400_000);
      return { start: s, end: new Date(s.getTime() + 3 * 3600_000) };
    });
    const minStart = sessionDates[0].start;
    const maxEnd = sessionDates[sessionDates.length - 1].end;

    // Padre: rango que abarca las sesiones (para la card y el header).
    await ref.set({
      id: ref.id,
      ...base,
      startDate: Timestamp.fromDate(minStart),
      endDate: Timestamp.fromDate(maxEnd),
    });

    const sessionsCol = ref.collection("sessions");
    for (let i = 0; i < sessionDates.length; i++) {
      const sref = sessionsCol.doc();
      const { start, end } = sessionDates[i];
      await sref.set({
        id: sref.id,
        eventId: ref.id,
        slug: `${base.slug}-sesion-${i + 1}`,
        title: `Sesión ${i + 1}`,
        shortDescription: `Fecha ${i + 1} del festival.`,
        description: descDoc,
        coverSource: "own",
        mainImage: { url: UNSPLASH, path: "" },
        media: [],
        location: mkLocation(),
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        registrationType: "none",
        price: { isFree: true, amount: 0, currency: "COP" },
        status: "published",
        analytics: { views: 10, registrations: 0, shares: 0 },
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
    }
    created.push({ title: base.title, slug: base.slug, type: "multi-date (3 sesiones)" });
  }

  console.log(`\n✅ Eventos creados (owner: ${ownerEmail}) con ${allCollabs.length} colaboradores:\n`);
  console.log(`   Usuarios: ${userCollabs.map((c) => c.displayName).join(", ") || "(ninguno)"}`);
  console.log(`   Externos: ${externalCollabs.map((c) => c.displayName).join(", ")}`);
  created.forEach((e) => console.log(`   [${e.type}] /eventos/${e.slug}`));
  console.log(`\nBorra estos eventos de prueba con:  npx tsx scripts/cleanup-test-events.ts ${ownerEmail}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error sembrando eventos:", err);
    process.exit(1);
  });
