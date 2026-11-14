import type { SiteOpeningPolicy } from "@/domain/entities/sites/value-objects/SiteOpeningPolicy"
import { clockText } from "@/presentation/home/lib/buildHomeView"
import type { SiteCategory, SiteSchedule } from "../view-models/SiteFormViewModel"
import { siteCategoryLabel } from "./constants"
import { getSiteOpenStatus } from "./openStatus"

/** Lo que el servidor lee de cada sitio, ya reducido a datos simples (se cachea). */
export interface GuiaSiteIn {
  id: string; slug: string; name: string; category: SiteCategory; address: string; coverUrl: string | null
  lat: number | null; lng: number | null
  schedule: Partial<SiteSchedule> | null; policy: SiteOpeningPolicy | null; closed: boolean
  /** Valor de su dato rápido de precio («Entrada libre», «$ 20.000»); vacío si no lo tiene. */
  price: string
  likes: number
}
export interface GuiaSite extends Omit<GuiaSiteIn, "slug" | "coverUrl"> {
  href: string; cover: string | null
  /** «Heladería · Entrada libre» */
  kind: string
  free: boolean
  /** Próximo evento de la semana en el sitio: «Hoy 9:00 pm: micrófono abierto». */
  live: string | null
  /** Título de su promoción vigente. */
  promo: string | null
}
export interface GuiaPlan { key: string; label: string; sub: string; href: string; count: number }
export interface GuiaView { /** Momento en que se armó (el navegador recalcula «abierto ahora» con su hora). */ now: number; sites: GuiaSite[]; plans: GuiaPlan[]; /** Los mejor puntuados, para «Destacados». */ featuredIds: string[] }

/** Entradas por plan: cada una agrupa tipos de sitio y lleva a la página del primero. */
export const PLANS: { key: string; label: string; sub: string; landing: string; cats: SiteCategory[] }[] = [
  { key: "comer", label: "Comer", sub: "Restaurantes", landing: "restaurantes", cats: ["restaurant"] },
  { key: "tomar", label: "Tomar algo", sub: "Bares", landing: "bares", cats: ["bar"] },
  { key: "cafe", label: "Un café", sub: "Cafeterías y heladerías", landing: "cafeterias", cats: ["cafe", "ice_cream"] },
  { key: "pasear", label: "Pasear", sub: "Parques y naturaleza", landing: "parques", cats: ["park"] },
  { key: "vista", label: "Con vista", sub: "Miradores", landing: "miradores", cats: ["viewpoint"] },
  { key: "cultura", label: "Cultura", sub: "Museos, teatros y cultura", landing: "sitios-culturales", cats: ["cultural", "museum", "theater"] },
  { key: "rumba", label: "De rumba", sub: "Discotecas", landing: "discotecas", cats: ["discotheque"] },
]

/** Tipos que muestra la página de un tipo: si es la entrada de un plan, todos los del plan (las heladerías viven en Cafeterías). */
export const landingCategories = (category: SiteCategory): SiteCategory[] => PLANS.find((p) => p.cats[0] === category)?.cats ?? [category]

const FREE = /libre|gratis|gratuit/i

export function buildGuia(input: { sites: GuiaSiteIn[]; live: Map<string, string>; promos: Record<string, string>; featuredIds?: string[]; now: Date }): GuiaView {
  const sites = input.sites
    .map(({ slug, coverUrl, ...s }): GuiaSite => ({
      ...s, href: `/donde-ir/${slug || s.id}`, cover: coverUrl || null,
      kind: [siteCategoryLabel(s.category), s.price].filter(Boolean).join(" · "), free: FREE.test(s.price),
      live: input.live.get(s.id) ?? null, promo: input.promos[s.id] ?? null,
    }))
    // Primero los que tienen algo esta semana, luego con promoción, luego los más guardados.
    .sort((a, b) => Number(!!b.live) - Number(!!a.live) || Number(!!b.promo) - Number(!!a.promo) || b.likes - a.likes || a.name.localeCompare(b.name, "es"))
  const plans = PLANS.map((p) => ({ key: p.key, label: p.label, sub: p.sub, href: `/donde-ir-${p.landing}-ibague`, count: sites.filter((s) => p.cats.includes(s.category)).length })).filter((p) => p.count > 0)
  return { now: input.now.getTime(), sites, plans, featuredIds: (input.featuredIds ?? []).filter((id) => sites.some((s) => s.id === id)).slice(0, 3) }
}

/** La misma guía, solo con los sitios de unos tipos (páginas por tipo). */
export const scopeGuia = (view: GuiaView, cats: SiteCategory[]): GuiaView => ({ ...view, sites: view.sites.filter((s) => cats.includes(s.category)), plans: [], featuredIds: [] })

/** `label` para las tarjetas; `short` para las filas compactas («Cierra 9:00 pm»). */
export interface GuiaStatus { isOpen: boolean; label: string; short: string }

/** Estado corto para las tarjetas: «Abierto hasta 9:00 pm», «Abre 5:00 pm», «Cerrado hoy». Vacío si el sitio no tiene horario. */
export function guiaStatus(s: Pick<GuiaSite, "schedule" | "policy" | "closed">, now: Date, holidays?: Record<string, string> | null): GuiaStatus {
  const closed = (label: string, short = label): GuiaStatus => ({ isOpen: false, label, short })
  if (s.closed) return closed("Cerrado temporalmente", "Cerrado por ahora")
  const st = getSiteOpenStatus(s.schedule, now, { holidays, policy: s.policy })
  if (!st.label) return closed("")
  if (st.isOpen) {
    const close = st.todayHours?.split(" – ")[1]
    return close ? { isOpen: true, label: `Abierto hasta ${clockText(close)}`, short: `Cierra ${clockText(close)}` } : { isOpen: true, label: "Abierto", short: "Abierto" }
  }
  const m = st.label.match(/Abre (mañana )?(\d{1,2}:\d{2})/)
  return closed(m ? `Abre ${m[1] ?? ""}${clockText(m[2])}` : st.label)
}
