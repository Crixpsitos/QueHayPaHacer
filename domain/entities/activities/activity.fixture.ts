import { ImageMedia } from "@/domain/entities/sites/value-objects/ImageMedia"
import type { Activity } from "./Activity"

/** Actividad válida y completa para pruebas; cada prueba cambia solo lo que le interesa. */
export function makeActivity(p: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    slug: "senderismo-los-domingos",
    title: "Senderismo los domingos",
    tagline: "Caminata con almuerzo",
    description: "Salimos cada domingo a caminar por los cerros de Ibagué, con almuerzo incluido.",
    kind: "global",
    siteId: null,
    host: { kind: "user", id: "u1", displayName: "Club Cerros", photoURL: "" },
    ownerUid: "u1",
    category: "aire-libre",
    companions: ["amigos", "pareja"],
    difficulty: "medium",
    durationMinutes: 240,
    ageNote: "",
    meetingPoint: { mode: "fixed", text: "Parque Murillo Toro", references: "", geo: null },
    schedule: { rules: [{ kind: "weekly", weekdays: [0], start: "06:00" }], skipDates: [], requiresReservation: false },
    priceOptions: [{ label: "Salida completa", amountCop: 40000, unit: "persona", includes: ["Almuerzo"] }],
    extras: [],
    sections: [],
    cta: null,
    media: [new ImageMedia("m1", "https://x.test/1.jpg", 800, 600, "", "https://x.test/m.jpg", true)],
    rating: { count: 0, sum: 0, avg: 0, dist: [0, 0, 0, 0, 0] },
    analytics: { views: 0, clicks: 0, visits: 0, reviews: 0 },
    publicationStatus: "published",
    moderationStatus: "approved",
    isActive: true,
    reviewedAt: null,
    reviewedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: new Date("2026-11-01T00:00:00Z"),
    updatedAt: new Date("2026-11-01T00:00:00Z"),
    publishedAt: new Date("2026-11-01T00:00:00Z"),
    ...p,
  }
}
