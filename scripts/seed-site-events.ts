/**
 * Seed de eventos vinculados a un sitio, con imágenes y videos de galería
 * en el sitio para probar el detalle completo.
 *
 * Uso:
 *   npx tsx scripts/seed-site-events.ts --siteId EqAjF9CftJxUwO0yjJ03           # dry-run
 *   npx tsx scripts/seed-site-events.ts --siteId EqAjF9CftJxUwO0yjJ03 --apply   # aplica
 *   npx tsx scripts/seed-site-events.ts --siteId EqAjF9CftJxUwO0yjJ03 --clean   # borra
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { FieldValue } from "firebase-admin/firestore";

const APPLY = process.argv.includes("--apply");
const CLEAN = process.argv.includes("--clean");
const siteIdArg = process.argv.find((a) => a.startsWith("--siteId="))?.split("=")[1]
  ?? process.argv[process.argv.indexOf("--siteId") + 1];

if (!siteIdArg) {
  console.error("❌  Debes pasar --siteId <id>");
  process.exit(1);
}

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Imágenes y videos de Unsplash/sample para la galería del sitio
const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
  "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
  "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1200&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80",
];

// Videos de muestra (mp4 públicos de sample-videos.com)
const GALLERY_VIDEOS = [
  "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
  "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
];

// Eventos de muestra para vincular al sitio
const SAMPLE_EVENTS = [
  {
    title: "Noche de Jazz en vivo",
    shortDescription: "Una velada especial con los mejores músicos de jazz de la ciudad.",
    category: "music",
    daysFromNow: 3,
    price: 25000,
  },
  {
    title: "Cata de vinos y tapas",
    shortDescription: "Descubre los mejores vinos acompañados de tapas gourmet.",
    category: "food",
    daysFromNow: 7,
    price: 45000,
  },
  {
    title: "Tarde de coctelería artesanal",
    shortDescription: "Aprende a preparar cócteles únicos con nuestro bartender.",
    category: "food",
    daysFromNow: 10,
    price: 35000,
  },
  {
    title: "Concierto acústico privado",
    shortDescription: "Música en vivo en un ambiente íntimo y exclusivo.",
    category: "music",
    daysFromNow: 14,
    price: 0,
  },
  {
    title: "Noche de trivia y juegos",
    shortDescription: "Pon a prueba tu conocimiento en nuestra noche de trivia temática.",
    category: "gaming",
    daysFromNow: 5,
    price: 15000,
  },
];

async function main() {
  const db = getFirebaseFirestore();

  // Leer el sitio
  const siteDoc = await db.collection("sites").doc(siteIdArg).get();
  if (!siteDoc.exists) {
    console.error(`❌  Sitio '${siteIdArg}' no encontrado`);
    process.exit(1);
  }

  const siteData = siteDoc.data()!;
  console.log(`\n📍 Sitio: ${siteData.name} (${siteData.category})`);
  console.log(`   slug: ${siteData.slug}`);
  console.log(`   status: ${siteData.publicationStatus}/${siteData.moderationStatus}`);

  // ── Modo --clean ─────────────────────────────────────────────────────────
  if (CLEAN) {
    const snap = await db.collection("events")
      .where("metadata.seedBatch", "==", `site-events-${siteIdArg}`)
      .get();
    console.log(`\n🗑  Borrando ${snap.size} eventos del batch...`);
    if (APPLY) {
      for (const d of snap.docs) await d.ref.delete();
      console.log("✅ Borrados.");
    } else {
      console.log("🟡 DRY-RUN: nada borrado.");
    }
    return;
  }

  // ── Leer categorías de la DB ──────────────────────────────────────────────
  const catsSnap = await db.collection("categories").where("isActive", "==", true).limit(10).get();
  const catBySlug = Object.fromEntries(
    catsSnap.docs.map((d) => [d.data().slug ?? d.data().icon, { id: d.id, ...d.data() }])
  );

  // Leer autor del sitio para usarlo en los eventos
  const authorId = siteData.author?.id;
  const authorName = siteData.author?.displayName ?? "Test User";
  const authorPhoto = siteData.author?.photoURL ?? `https://api.dicebear.com/9.x/initials/svg?seed=${authorName}`;

  console.log(`\n📋 Modo: ${APPLY ? "APPLY (escribe)" : "DRY-RUN"}`);
  console.log(`\n─────── EVENTOS A CREAR (${SAMPLE_EVENTS.length}) ───────`);

  const now = new Date();

  for (const ev of SAMPLE_EVENTS) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + ev.daysFromNow);
    startDate.setHours(19, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(22, 0, 0, 0);

    const cat = catBySlug[ev.category] ?? Object.values(catBySlug)[0];
    const slug = `${slugify(ev.title)}-${Date.now().toString(36)}`;

    const eventData = {
      slug,
      title: ev.title,
      shortDescription: ev.shortDescription,
      description: { type: "doc", content: [], attrs: {} },
      mainImage: { url: GALLERY_IMAGES[0], path: "", status: "ready" },
      media: [],
      categoryInfo: {
        id: cat?.id ?? "unknown",
        title: cat?.title ?? ev.category,
        slug: ev.category,
        tags: [],
      },
      author: {
        id: authorId,
        displayName: authorName,
        photoURL: authorPhoto,
      },
      location: {
        siteId: siteIdArg,          // ← FK al sitio
        venue: siteData.name,
        address: siteData.location?.address ?? "",
        moreInfo: "",
        city: siteData.location?.city ?? { name: "Ibagué", slug: "ibague" },
        department: siteData.location?.department ?? { isoCode: "TOL", name: "Tolima", slug: "tolima" },
        country: siteData.location?.country ?? { isoCode: "CO", name: "Colombia", slug: "colombia" },
        coordinates: siteData.location?.geo
          ? { lat: siteData.location.geo.latitude, lng: siteData.location.geo.longitude }
          : { lat: 4.4389, lng: -75.2322 },
      },
      status: "published",
      publishedAt: FieldValue.serverTimestamp(),
      registrationType: "none",
      price: { isFree: ev.price === 0, amount: ev.price, currency: "COP" },
      promotion: { isPromoted: false },
      eventType: "standard",
      startDate,
      endDate,
      analytics: { views: 0, clicks: 0, likes: 0, shares: 0, registrations: 0, score: 5 },
      metadata: {
        seedBatch: `site-events-${siteIdArg}`,
        isFirstEvent: false,
        _meiliNeedsSync: true,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log(`  + ${ev.title} (${startDate.toLocaleDateString("es-CO")}) — ${ev.price === 0 ? "GRATIS" : `$${ev.price.toLocaleString("es-CO")}`}`);

    if (APPLY) {
      await db.collection("events").add(eventData);
    }
  }

  // ── Actualizar galería del sitio ──────────────────────────────────────────
  console.log(`\n─────── GALERÍA DEL SITIO ───────`);
  const galleryMedia = [
    ...GALLERY_IMAGES.map((url, i) => ({
      id: `seed-img-${i}`,
      type: "image",
      url,
      path: "",
      width: 1200,
      height: 800,
      alt: `${siteData.name} — foto ${i + 1}`,
      isCover: i === 0,
      status: "ready",
      markerUrl: { url, path: "" },
      thumbnailUrl: url.replace("w=1200", "w=400"),
    })),
    ...GALLERY_VIDEOS.map((url, i) => ({
      id: `seed-vid-${i}`,
      type: "video",
      url,
      path: "",
      width: 1280,
      height: 720,
      duration: i === 0 ? 5 : 10,
      mimeType: "video/mp4",
      isCover: false,
      status: "ready",
    })),
  ];

  console.log(`  Imágenes: ${GALLERY_IMAGES.length}, Videos: ${GALLERY_VIDEOS.length}`);

  if (APPLY) {
    await db.collection("sites").doc(siteIdArg).update({
      media: galleryMedia,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log("  ✅ Galería actualizada en el sitio.");
  }

  console.log(`\n─────────────────────────────────────────────`);
  if (!APPLY) {
    console.log("🟡 DRY-RUN: nada escrito. Corre con --apply para aplicar.");
  } else {
    console.log(`✅ Listo. ${SAMPLE_EVENTS.length} eventos creados y galería actualizada.`);
    console.log(`   Ver sitio: http://localhost:3000/donde-ir/${siteData.slug || siteIdArg}`);
  }
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
