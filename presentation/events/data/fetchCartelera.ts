import { cacheLife, cacheTag } from "next/cache"
import { loadPublishedEvents } from "@/presentation/home/data/fetchHomeView"
import { formatPrice } from "@/presentation/events/components/detail/format"
import { registrationLabel, spotsInfo } from "@/presentation/events/components/card/cardMeta"
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper"
import { eventJsonLdHtml } from "@/presentation/events/lib/eventJsonLd"
import { getEventCollections } from "@/presentation/events/lib/eventCollections"
import { buildCartelera, type CarteleraView } from "../lib/buildCartelera"

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

  const view = buildCartelera(upcoming.map((e) => {
    const spots = spotsInfo(e.capacity, e.analytics?.registrations ?? 0)
    const multi = e.eventType === "multi-date"
    const tiers = e.price?.tiers?.length ?? 0
    return {
      id: e.id, slug: e.slug, title: e.title, startsAt: e.startDate.getTime(), endsAt: e.endDate.getTime(), venue: e.location?.venue ?? "",
      place: [e.location?.venue, e.location?.address].filter(Boolean).join(" · "),
      price: multi || !e.price ? "Ver precios" : formatPrice(e.price), free: !multi && !!e.price && (e.price.isFree || !e.price.amount),
      tiers: !multi && tiers > 1 ? `${tiers} precios` : "",
      coverUrl: e.mainImage?.status === "error" ? null : (e.mainImage?.url ?? null),
      category: e.categoryInfo?.title ?? "", multi: multi ? "Varias fechas" : "",
      info: [registrationLabel(e.registrationType), spots?.label].filter(Boolean).join(" · "),
      going: e.analytics?.likes ?? 0, views: e.analytics?.views ?? 0,
    }
  }), now)
  const cats = catDefs.map((c) => ({ label: c.shortLabel, href: `/${c.slug}`, icon: c.categoryIcon, current: c.slug === categorySlug, count: all.filter(inCat(c)).length }))
    .filter((c) => c.count > 0 || c.current).sort((a, b) => b.count - a.count)
  const jsonLd = upcoming.slice(0, 20).map((e) => eventJsonLdHtml(EventViewModelMapper.toViewModel(e), { attendeeCount: e.analytics?.registrations ?? 0 }))
  return { view, cats, free: view.events.filter((e) => e.free).length, jsonLd }
}
