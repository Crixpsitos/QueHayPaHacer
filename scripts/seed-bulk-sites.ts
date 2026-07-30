/**
 * Seed masivo de sitios de prueba para probar el discovery de sitios
 * (/donde-ir + landings por tipo + paginación). Crea 50 sitios published +
 * approved + isActive, tipos variados, score variado, Ibagué. Autores existentes.
 * Marca seedBatch="sites-bulk".
 *
 *   npx tsx scripts/seed-bulk-sites.ts          # crea 50
 *   npx tsx scripts/seed-bulk-sites.ts --clean  # borra el batch
 */
export {};
for (const f of [".env", ".env.local"]) {
  try {
    (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(f);
  } catch {
    // opcional
  }
}

const BATCH = "sites-bulk";
const N = 50;
const IMG = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80";
const avatar = (s: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(s)}`;
const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const rnd = (n: number) => Math.floor(Math.random() * n);

// Tipos con peso: café/bar/restaurante pesados (>12 para probar paginación).
const CATS = ["cafe", "bar", "restaurant", "discotheque", "park", "museum", "cultural", "viewpoint", "hostel", "hotel", "gym", "spa", "theater", "mall", "other"];
const HEAVY = ["cafe", "bar", "restaurant"];

async function main() {
  const { getFirebaseFirestore } = await import("../infraestructure/firebase/config/admin/firebase");
  const { Timestamp, GeoPoint } = await import("firebase-admin/firestore");
  const db = getFirebaseFirestore();

  if (process.argv.includes("--clean")) {
    const snap = await db.collection("sites").where("seedBatch", "==", BATCH).get();
    console.log(`Borrando ${snap.size} sitios del batch "${BATCH}"...`);
    for (const d of snap.docs) await d.ref.delete();
    console.log("✅ Borrados.");
    return;
  }

  const usersSnap = await db.collection("users").limit(30).get();
  const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  if (users.length === 0) throw new Error("No hay usuarios.");

  const now = Timestamp.now();
  const day = { open: "08:00", close: "22:00", closed: false };
  const schedule = {
    monday: day, tuesday: day, wednesday: day, thursday: day,
    friday: day, saturday: day, sunday: { open: "10:00", close: "18:00", closed: false },
  };
  const location = {
    geo: new GeoPoint(4.4389, -75.2322),
    country: { isoCode: "CO", name: "Colombia", slug: "colombia" },
    department: { isoCode: "TOL", name: "Tolima", slug: "tolima" },
    city: { name: "Ibagué", slug: "ibague" },
    address: "Cra 3 #10-52, Centro",
    venue: "Ibagué",
    moreInfo: "",
    siteId: null,
  };

  const byCat: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const author = users[i % users.length] as { id: string; displayName?: string; photoURL?: string };
    const cat = i % 2 === 0 ? HEAVY[i % HEAVY.length] : CATS[i % CATS.length];
    byCat[cat] = (byCat[cat] || 0) + 1;
    const name = `${cat[0].toUpperCase()}${cat.slice(1)} de prueba ${i + 1}`;
    const slug = `${slugify(name)}-${Date.now().toString(36)}-${i}`;
    const ref = db.collection("sites").doc();

    await ref.set({
      id: ref.id,
      name,
      slug,
      category: cat,
      description: `Sitio de prueba (${cat}) en Ibagué. Un buen lugar para pasar el rato.`,
      location,
      media: [
        {
          id: `m-${i}`,
          type: "image",
          path: "",
          url: IMG,
          width: 1200,
          height: 800,
          alt: name,
          status: "ready",
          markerUrl: { url: IMG, path: "" },
          isCover: true,
        },
      ],
      schedule,
      author: {
        id: author.id,
        displayName: author.displayName ?? "Organizador",
        photoURL: author.photoURL ?? avatar(author.displayName ?? "Org"),
      },
      publicationStatus: "published",
      moderationStatus: "approved",
      isActive: true,
      analytics: { clicks: rnd(300), views: rnd(500), likes: rnd(60), shares: rnd(30), eventCount: rnd(8), score: rnd(100) },
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      reviewedAt: now,
      reviewedBy: "seed",
      rejectedAt: null,
      rejectionReason: null,
      seedBatch: BATCH,
    });

    if ((i + 1) % 10 === 0) console.log(`  ...${i + 1}/${N}`);
  }

  console.log(`\n✅ ${N} sitios (published+approved+activos). Por tipo: ${JSON.stringify(byCat)}. seedBatch="${BATCH}".`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
