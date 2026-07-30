/**
 * Seed de campañas para el carrusel de la home.
 * Crea campañas activas con imágenes de Unsplash y CTAs de ejemplo.
 *
 * Uso:
 *   npx tsx scripts/seed-campaigns.ts              # DRY-RUN (muestra lo que se crearía)
 *   npx tsx scripts/seed-campaigns.ts --apply      # escribe en Firestore
 *   npx tsx scripts/seed-campaigns.ts --clean      # borra las campañas del seed
 *
 * Requiere credenciales admin en el entorno (.env.local).
 */
import "./_loadEnv";
import { getFirebaseFirestore } from "@/infraestructure/firebase/config/admin/firebase";
import { Timestamp } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const CLEAN = args.includes("--clean");

// ─── Utilidades ──────────────────────────────────────────────────────────────

const now = new Date();
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400_000);

/** Unsplash source con dimensiones específicas */
const unsplash = (photoId: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${photoId}?w=${w}&q=80`;

// ─── Datos de campañas ───────────────────────────────────────────────────────

const CAMPAIGNS = [
  {
    title: "Descubre los mejores eventos de Ibagué",
    description: "Conciertos, cultura, gastronomía y más. ¡Encuentra qué hay pa' hacer cerca de ti!",
    entityType: "internal",
    priority: 1,
    isSponsored: false,
    images: {
      desktop: { url: unsplash("1470229722913-7c0e2dbbafd3", 1440, 540), width: 1440, height: 540, alt: "Concierto en vivo" },
      tablet:  { url: unsplash("1470229722913-7c0e2dbbafd3", 900, 338),  width: 900,  height: 338, alt: "Concierto en vivo" },
      mobile:  { url: unsplash("1470229722913-7c0e2dbbafd3", 600, 350),  width: 600,  height: 350, alt: "Concierto en vivo" },
    },
    cta: [
      { label: "Ver eventos",  href: "/eventos" },
      { label: "¿Dónde ir?",   href: "/donde-ir" },
    ],
    schedule: {
      startAt: addDays(now, -1),
      endAt:   addDays(now, 60),
    },
  },
  {
    title: "Los mejores restaurantes y cafés de la ciudad",
    description: "Explora los sabores de Ibagué. Desde pequeños cafés hasta restaurantes gourmet.",
    entityType: "promotion",
    priority: 2,
    isSponsored: false,
    images: {
      desktop: { url: unsplash("1517248135467-4c7edcad34c4", 1440, 540), width: 1440, height: 540, alt: "Mesa de restaurante" },
      tablet:  { url: unsplash("1517248135467-4c7edcad34c4", 900, 338),  width: 900,  height: 338, alt: "Mesa de restaurante" },
      mobile:  { url: unsplash("1517248135467-4c7edcad34c4", 600, 350),  width: 600,  height: 350, alt: "Mesa de restaurante" },
    },
    cta: [
      { label: "Ver sitios", href: "/donde-ir" },
    ],
    schedule: {
      startAt: addDays(now, -1),
      endAt:   addDays(now, 60),
    },
  },
  {
    title: "Planes para este fin de semana",
    description: "No te quedes en casa. Hay eventos y lugares increíbles esperándote en Ibagué.",
    entityType: "internal",
    priority: 3,
    isSponsored: false,
    images: {
      desktop: { url: unsplash("1529156069898-49953e39b3ac", 1440, 540), width: 1440, height: 540, alt: "Amigos disfrutando planes" },
      tablet:  { url: unsplash("1529156069898-49953e39b3ac", 900, 338),  width: 900,  height: 338, alt: "Amigos disfrutando planes" },
      mobile:  { url: unsplash("1529156069898-49953e39b3ac", 600, 350),  width: 600,  height: 350, alt: "Amigos disfrutando planes" },
    },
    cta: [
      { label: "Eventos del finde", href: "/eventos-este-fin-de-semana-ibague" },
    ],
    schedule: {
      startAt: addDays(now, -1),
      endAt:   addDays(now, 90),
    },
  },
  {
    title: "Música en vivo en Ibagué",
    description: "Conciertos, shows en vivo y noches culturales. ¡La música nunca para!",
    entityType: "event",
    priority: 4,
    isSponsored: false,
    images: {
      desktop: { url: unsplash("1493225457124-a3eb161ffa5f", 1440, 540), width: 1440, height: 540, alt: "Música en vivo" },
      tablet:  { url: unsplash("1493225457124-a3eb161ffa5f", 900, 338),  width: 900,  height: 338, alt: "Música en vivo" },
      mobile:  { url: unsplash("1493225457124-a3eb161ffa5f", 600, 350),  width: 600,  height: 350, alt: "Música en vivo" },
    },
    cta: [
      { label: "Ver eventos de música", href: "/eventos-musica-ibague" },
    ],
    schedule: {
      startAt: addDays(now, -1),
      endAt:   addDays(now, 60),
    },
  },
  {
    title: "Ibagué Cultural",
    description: "Museos, teatros, exposiciones y más. Descubre la riqueza cultural de la Capital Musical.",
    entityType: "internal",
    priority: 5,
    isSponsored: false,
    images: {
      desktop: { url: unsplash("1533174072545-7a4b6ad7a6c3", 1440, 540), width: 1440, height: 540, alt: "Evento cultural" },
      tablet:  { url: unsplash("1533174072545-7a4b6ad7a6c3", 900, 338),  width: 900,  height: 338, alt: "Evento cultural" },
      mobile:  { url: unsplash("1533174072545-7a4b6ad7a6c3", 600, 350),  width: 600,  height: 350, alt: "Evento cultural" },
    },
    cta: [
      { label: "Explorar", href: "/donde-ir" },
    ],
    schedule: {
      startAt: addDays(now, -1),
      endAt:   addDays(now, 120),
    },
  },
] as const;

// ─── Main ─────────────────────────────────────────────────────────────────────

const SEED_TAG = "seed-campaigns-v1";

async function main() {
  const db = getFirebaseFirestore();
  const col = db.collection("campaigns");

  // ── CLEAN ─────────────────────────────────────────────────────────────────
  if (CLEAN) {
    const snap = await col.where("_seedTag", "==", SEED_TAG).get();
    if (snap.empty) {
      console.log("No hay campañas de este seed para borrar.");
      return;
    }
    if (!APPLY) {
      console.log(`DRY-RUN: borraría ${snap.size} campaña(s) con tag "${SEED_TAG}"`);
      return;
    }
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`✓ Borradas ${snap.size} campañas.`);
    return;
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  console.log(`\n${APPLY ? "APLICANDO" : "DRY-RUN"}: ${CAMPAIGNS.length} campañas\n`);

  for (const c of CAMPAIGNS) {
    const payload = {
      title:       c.title,
      description: c.description,
      entityType:  c.entityType,
      status:      "active",
      priority:    c.priority,
      isSponsored: c.isSponsored,
      images:      c.images,
      cta:         c.cta,
      schedule: {
        startAt: Timestamp.fromDate(c.schedule.startAt),
        endAt:   Timestamp.fromDate(c.schedule.endAt),
      },
      analytics: { views: 0, clicks: 0 },
      _seedTag:  SEED_TAG,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log(`  [${c.priority}] "${c.title}"`);
    console.log(`       tipo: ${c.entityType} | vigencia: ${c.schedule.startAt.toLocaleDateString()} → ${c.schedule.endAt.toLocaleDateString()}`);

    if (APPLY) {
      const ref = col.doc();
      await ref.set(payload);
      console.log(`       ✓ creada con id: ${ref.id}`);
    }
  }

  console.log(`\n${APPLY ? `✓ ${CAMPAIGNS.length} campañas creadas.` : "Pasa --apply para escribir en Firestore."}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
