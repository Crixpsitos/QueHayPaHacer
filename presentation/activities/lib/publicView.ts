import type { Activity, Difficulty } from "@/domain/entities/activities/Activity"
import { ACTIVITY_CATEGORIES, type Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { describeSchedule, type ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { ctaButtonLabel, ctaHref, type CtaKind } from "@/domain/entities/activities/value-objects/Cta"
import { formatCop, priceFromCop } from "@/domain/entities/activities/value-objects/Price"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/** Lo que muestra la ficha pública: solo datos públicos, textos ya legibles y nada que no sea serializable (se cachea). */
export interface ActivityPublicView {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  kind: "global" | "site"
  siteId: string | null
  categorySlug: string
  categoryName: string
  companions: string[]
  difficulty: string | null
  duration: string | null
  ageNote: string
  cover: { url: string; width: number; height: number; alt: string } | null
  gallery: { url: string; width: number; height: number; alt: string }[]
  video: { url: string; thumbnailUrl: string | null } | null
  host: { displayName: string; photoURL: string }
  scheduleText: string
  scheduleNote: string
  requiresReservation: boolean
  /** Para calcular "Próxima salida" en el navegador (el HTML se cachea por horas). */
  schedule: ActivitySchedule
  priceFrom: string
  prices: { label: string; amount: string; unit: string; includes: string[]; note: string }[]
  extras: { label: string; amount: string; unit: string; note: string }[]
  meeting: { mode: "fixed" | "sharedAfterJoining" | "varies"; text: string; references: string; note: string | null }
  sections: SiteSection[]
  cta: { kind: CtaKind; label: string; href: string } | null
}

const COMPANION_LABELS: Record<Companion, string> = { solo: "Solo", pareja: "En pareja", familia: "En familia", amigos: "Con amigos", ninos: "Con niños", mascotas: "Con mascotas" }
const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Dificultad fácil", medium: "Dificultad media", hard: "Dificultad difícil" }

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  const hours = `${h} ${h === 1 ? "hora" : "horas"}`
  return m === 0 ? hours : `${h} h ${m} min`
}

const MEETING_NOTES = { sharedAfterJoining: "El punto de encuentro se comparte en el grupo cuando te unes.", varies: "El punto cambia: se avisa antes de cada salida." } as const

export function toPublicView(a: Activity): ActivityPublicView {
  const images = a.media.filter((m) => m.type === "image" && m.status !== "error")
  const ordered = [...images.filter((m) => m.isCover), ...images.filter((m) => !m.isCover)]
  const pic = (m: (typeof images)[number]) => ({ url: m.url, width: m.width, height: m.height, alt: m.alt || a.title })
  const video = a.media.find((m) => m.type === "video" && m.status !== "error")
  const from = priceFromCop(a.priceOptions)
  const mode = a.meetingPoint.mode
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    tagline: a.tagline,
    description: a.description,
    kind: a.kind,
    siteId: a.siteId,
    categorySlug: a.category,
    categoryName: ACTIVITY_CATEGORIES.find((c) => c.slug === a.category)?.name ?? "",
    companions: a.companions.map((c) => COMPANION_LABELS[c]),
    difficulty: a.difficulty ? DIFFICULTY_LABELS[a.difficulty] : null,
    duration: a.durationMinutes ? formatDuration(a.durationMinutes) : null,
    ageNote: a.ageNote,
    cover: ordered[0] ? pic(ordered[0]) : null,
    gallery: ordered.map(pic),
    video: video ? { url: video.url, thumbnailUrl: video.thumbnailUrl ?? null } : null,
    host: { displayName: a.host.displayName, photoURL: a.host.photoURL },
    scheduleText: describeSchedule(a.schedule),
    scheduleNote: a.schedule.note ?? "",
    requiresReservation: a.schedule.requiresReservation,
    schedule: a.schedule,
    priceFrom: from === 0 ? "Gratis" : `Desde ${formatCop(from)}`,
    prices: a.priceOptions.map((p) => ({ label: p.label, amount: formatCop(p.amountCop), unit: p.unit, includes: p.includes, note: p.note ?? "" })),
    extras: a.extras.map((x) => ({ label: x.label, amount: `+${formatCop(x.amountCop)}`, unit: x.unit, note: x.note ?? "" })),
    meeting: { mode, text: a.meetingPoint.text, references: a.meetingPoint.references, note: mode === "fixed" ? null : MEETING_NOTES[mode] },
    sections: a.sections,
    cta: a.cta ? { kind: a.cta.kind, label: ctaButtonLabel(a.cta), href: ctaHref(a.cta) } : null,
  }
}
