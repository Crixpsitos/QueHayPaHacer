import { cacheLife, cacheTag } from "next/cache"
import { loadPublishedEvents } from "@/presentation/home/data/fetchHomeView"
import { formatPrice, hasFreePart, tiersLabel } from "@/presentation/events/components/detail/format"
import { registrationLabel, spotsInfo } from "@/presentation/events/components/card/cardMeta"
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper"
import { eventJsonLdHtml } from "@/presentation/events/lib/eventJsonLd"
import { getEventCollections } from "@/presentation/events/lib/eventCollections"
import { buildCartelera, type CarteleraIn, type CarteleraView } from "../lib/buildCartelera"
import { fetchEventSessions } from "./eventDetailFetchers"
import { eventSlots } from "../lib/sessionSlots"

export interface CarteleraCat { label: string; href: string; count: number; icon?: string; current?: boolean }
export interface CarteleraData { view: CarteleraView; /** Categorías con eventos próximos, enlazadas a su página (la actual va marcada). */ cats: CarteleraCat[]; /** Cuántos de los que vienen son gratis. */ free: number; /** Datos estructurados de los primeros eventos (para buscadores). */ jsonLd: string[] }

const MAX_PAGES = 20 // ponytail: hasta 600 eventos próximos en memoria; si la ciudad pasa de ahí, paginar por mes en el servidor

/**
 * Todo lo que pinta /eventos (o una variante por categoría, con `categorySlug`), en una sola caché corta.
 * Filtrar por día o por «cuándo» no pide nada más: ocurre en el navegador.
 */
export const fetchCartelera = async (categorySlug: string | null = null): Promise<CarteleraData> => {
  "use cache"
  cacheLife("hub")
  cacheTag("event-list", "cartelera")
  const now = new Date()
  const [list, collections] = await Promise.all([loadPublishedEvents(MAX_PAGES), getEventCollections()])
  const all = list.filter((e) => e.endDate.getTime() >= now.getTime()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const catDefs = collections.filter((c) => c.kind === "category")
  const inCat = (c: (typeof catDefs)[number]) => (e: (typeof all)[number]) => e.categoryInfo?.id === c.categoryId || e.categoryInfo?.id === c.categorySlug || e.categoryInfo?.slug === c.categorySlug
  const current = categorySlug ? catDefs.find((c) => c.slug === categorySlug) : undefined
  const upcoming = current ? all.filter(inCat(current)) : all

  const view = buildCartelera((await Promise.all(upcoming.map(async (e): Promise<CarteleraIn[]> => {
    const spots = spotsInfo(e.capacity, e.analytics?.registrations ?? 0)
    const multi = e.eventType === "multi-date"
    const base = {
      id: e.id, slug: e.slug, title: e.title, startsAt: e.startDate.getTime(), endsAt: e.endDate.getTime(), venue: e.location?.venue ?? "",
      place: [e.location?.venue, e.location?.address].filter(Boolean).join(" · "),
      price: multi || !e.price ? "Ver precios" : formatPrice(e.price), free: !multi && hasFreePart(e.price),
      tiers: multi ? "" : tiersLabel(e.price),
      coverUrl: e.mainImage?.status === "error" ? null : (e.mainImage?.url ?? null),
      category: e.categoryInfo?.title ?? "", multi: multi ? "Varias fechas" : "",
      info: [registrationLabel(e.registrationType), spots?.label].filter(Boolean).join(" · "),
      going: e.analytics?.likes ?? 0, views: e.analytics?.views ?? 0,
    }
    if (!multi) return [base]
    // Un evento de varias fechas sale una vez por función, en su propio día, con su hora, lugar y precio.
    const slots = eventSlots((await fetchEventSessions(e.id)).map((s) => ({ id: s.id, slug: s.slug, status: s.status, startDate: s.startDate, endDate: s.endDate, venue: s.location?.venue ?? "", address: s.location?.address ?? "", price: formatPrice(s.price), free: hasFreePart(s.price), tiers: tiersLabel(s.price) })), now.getTime())
    if (!slots.length) return [base]
    return slots.map((x) => ({
      ...base, key: `${e.id}:${x.sessionId}`, href: `/eventos/${e.slug || e.id}/sessions/${x.ref}`, parentHref: `/eventos/${e.slug || e.id}`,
      startsAt: x.startsAt, endsAt: x.endsAt, venue: x.venue || base.venue, place: x.place || base.place, price: x.price || base.price, free: x.free, tiers: x.tiers, multi: x.label,
    }))
  }))).flat(), now)
  const cats = catDefs.map((c) => ({ label: c.shortLabel, href: `/${c.slug}`, icon: c.categoryIcon, current: c.slug === categorySlug, count: all.filter(inCat(c)).length }))
    .filter((c) => c.count > 0 || c.current).sort((a, b) => b.count - a.count)
  const jsonLd = upcoming.slice(0, 20).map((e) => eventJsonLdHtml(EventViewModelMapper.toViewModel(e), { attendeeCount: e.analytics?.registrations ?? 0 }))
  return { view, cats, free: view.events.filter((e) => e.free).length, jsonLd }
}
