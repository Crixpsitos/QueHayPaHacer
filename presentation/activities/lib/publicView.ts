import { CONFIRM_LABELS } from "@/domain/entities/activities/value-objects/MeetingConfirm"
import type { Activity, Difficulty } from "@/domain/entities/activities/Activity"
import { ACTIVITY_CATEGORIES, type Companion } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { describeSchedule, type ActivitySchedule } from "@/domain/entities/activities/value-objects/ActivitySchedule"
import { ctaButtonLabel, ctaHref, type CtaKind } from "@/domain/entities/activities/value-objects/Cta"
import { isPaidActivity } from "@/domain/entities/activities/activityJoin"
import { allOnRequest, formatCop, isOnRequest, priceFromCop } from "@/domain/entities/activities/value-objects/Price"
import { promoRuleLabel, promoScheduleLabel, type Promotion } from "@/domain/entities/activities/value-objects/Promotion"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/** Lo que muestra la ficha pública: solo datos públicos, textos ya legibles y nada que no sea serializable (se cachea). */
export interface ActivityPublicView {
  id: string
  /** "N personas fueron": solo desde 10 (con menos, el número desanima). */
  visitedLabel: string | null
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
  /** Recibe reservas en QHPA (el detalle de cupos se pide aparte: la ficha se cachea por horas). */
  joinEnabled: boolean
  /** Todas las opciones cuestan: reservar pide WhatsApp. */
  paid: boolean
  priceFrom: string
  prices: { label: string; amount: string; amountCop: number; onRequest: boolean; unit: string; includes: string[]; note: string }[]
  extras: { label: string; amount: string; unit: string; note: string }[]
  meeting: { mode: "fixed" | "sharedAfterJoining" | "varies"; text: string; references: string; note: string | null; /** Dónde se confirma el punto cuando cambia cada vez. */ confirm: { label: string; url: string } | null }
  /** Coordenadas del punto de encuentro: solo si el punto es fijo (si se dice en el grupo, no se publica ningún pin). */
  meetingGeo: { latitude: number; longitude: number } | null
  sections: SiteSection[]
  promotions: { id: string; title: string; description: string; rule: string; label: string; validUntil: string; termsNote: string; promo: Promotion }[]
  offerings: { name: string; description: string; price: string; priceCop: number; group: string }[]
  spaces: { name: string; description: string; capacity: number; price: string; priceCop: number; unit: string; rules: string }[]
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

const MEETING_NOTES = { sharedAfterJoining: "El punto de encuentro se comparte en el grupo cuando te unes.", varies: "El punto cambia cada vez: se confirma antes de cada salida." } as const

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
    visitedLabel: a.analytics.visits >= 10 ? `${a.analytics.visits.toLocaleString("es-CO")} personas fueron` : null,
    scheduleText: describeSchedule(a.schedule),
    scheduleNote: a.schedule.note ?? "",
    requiresReservation: a.schedule.requiresReservation,
    schedule: a.schedule,
    joinEnabled: a.join !== null,
    paid: isPaidActivity(a.priceOptions),
    priceFrom: allOnRequest(a.priceOptions) ? "Consultar precio" : from === 0 ? "Gratis" : `Desde ${formatCop(from)}`,
    prices: a.priceOptions.map((p) => ({ label: p.label, amount: isOnRequest(p) ? "Consultar" : formatCop(p.amountCop), amountCop: p.amountCop, onRequest: isOnRequest(p), unit: p.unit, includes: p.includes, note: p.note ?? "" })),
    extras: a.extras.map((x) => ({ label: x.label, amount: `+${formatCop(x.amountCop)}`, unit: x.unit, note: x.note ?? "" })),
    meeting: { mode, text: a.meetingPoint.text, references: a.meetingPoint.references, note: mode === "fixed" ? null : MEETING_NOTES[mode], confirm: a.meetingPoint.confirm ? { label: CONFIRM_LABELS[a.meetingPoint.confirm.channel], url: a.meetingPoint.confirm.url } : null },
    meetingGeo: mode === "fixed" && a.meetingPoint.geo ? { latitude: a.meetingPoint.geo.lat, longitude: a.meetingPoint.geo.lng } : null,
    sections: a.sections,
    promotions: a.promotions.filter((p) => !p.paused).map((p) => ({ id: p.id, title: p.title, description: p.description, rule: promoRuleLabel(p.rule), label: promoScheduleLabel(p), validUntil: p.validUntil, termsNote: p.termsNote, promo: p })),
    offerings: a.offerings.filter((x) => x.available).map((x) => ({ name: x.name, description: x.description, price: formatCop(x.priceCop), priceCop: x.priceCop, group: x.group })),
    spaces: a.spaces.map((x) => ({ name: x.name, description: x.description, capacity: x.capacity, price: formatCop(x.priceCop), priceCop: x.priceCop, unit: ({ hora: "hora", dia: "día", persona: "persona", evento: "evento" } as Record<string, string>)[x.unit] ?? x.unit, rules: x.rules })),
    cta: a.cta ? { kind: a.cta.kind, label: ctaButtonLabel(a.cta), href: ctaHref(a.cta) } : null,
  }
}

/** Tarjeta de listado: lo mínimo para decidir si abrir la ficha. */
export interface ActivityCardView {
  id: string
  slug: string
  /** Enlace propio cuando la tarjeta no es de una actividad (un evento o un sitio en «Mis planes»). */
  href?: string
  title: string
  hostName: string
  hostPhoto: string
  /** Dueño del sitio vinculado (si lo tiene): se muestra al frente, como en la ficha. */
  owner?: { displayName: string; photoURL: string } | null
  categorySlug: string
  categoryName: string
  coverUrl: string | null
  coverAlt: string
  priceFrom: string
  badge: "En el sitio" | "Gratis" | "Con cita" | null
  scheduleText: string
  /** Para "Próxima: …" en el navegador. */
  schedule: ActivitySchedule
}

export function toCardView(a: Activity): ActivityCardView {
  const cover = a.media.find((m) => m.type === "image" && m.isCover && m.status !== "error")
  const from = priceFromCop(a.priceOptions)
  const byAppointment = a.schedule.rules.every((r) => r.kind === "byAppointment")
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    hostName: a.host.displayName,
    hostPhoto: a.host.photoURL ?? "",
    categorySlug: a.category,
    categoryName: ACTIVITY_CATEGORIES.find((c) => c.slug === a.category)?.name ?? "",
    coverUrl: cover ? (cover.thumbnailUrl ?? cover.url) : null,
    coverAlt: cover?.alt || a.title,
    priceFrom: allOnRequest(a.priceOptions) ? "Consultar precio" : from === 0 ? "Gratis" : `Desde ${formatCop(from)}`,
    badge: a.kind === "site" ? "En el sitio" : from === 0 && !allOnRequest(a.priceOptions) ? "Gratis" : byAppointment ? "Con cita" : null,
    scheduleText: describeSchedule(a.schedule),
    schedule: a.schedule,
  }
}
