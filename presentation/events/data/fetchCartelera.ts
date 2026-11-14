import { cacheLife, cacheTag } from "next/cache"
import { loadPublishedEvents } from "@/presentation/home/data/fetchHomeView"
import { formatPrice } from "@/presentation/events/components/detail/format"
import { spotsInfo } from "@/presentation/events/components/card/cardMeta"
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper"
import { eventJsonLdHtml } from "@/presentation/events/lib/eventJsonLd"
import { getEventCollections } from "@/presentation/events/lib/eventCollections"
import { buildCartelera, type CarteleraView } from "../lib/buildCartelera"

export interface CarteleraData { view: CarteleraView; /** «Por gusto»: categorías con eventos próximos, enlazadas a su página. */ cats: { label: string; href: string; count: number }[]; /** Datos estructurados de los primeros eventos (para buscadores). */ jsonLd: string[] }

/** Todo lo que pinta /eventos, en una sola caché corta. Filtrar por día o por «cuándo» no pide nada más: ocurre en el navegador. */
export const fetchCartelera = async (): Promise<CarteleraData> => {
  "use cache"
  cacheLife("hub")
  cacheTag("event-list", "cartelera")
  const now = new Date()
  const [list, collections] = await Promise.all([loadPublishedEvents(), getEventCollections()])
  const upcoming = list.filter((e) => e.endDate.getTime() >= now.getTime()).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const view = buildCartelera(upcoming.map((e) => {
    const spots = spotsInfo(e.capacity, e.analytics?.registrations ?? 0)
    const multi = e.eventType === "multi-date"
    return {
      id: e.id, slug: e.slug, title: e.title, startsAt: e.startDate.getTime(), endsAt: e.endDate.getTime(), venue: e.location?.venue ?? "",
      price: multi ? "Varias fechas" : formatPrice(e.price), free: !multi && (e.price?.isFree || !e.price?.amount),
      coverUrl: e.mainImage?.status === "error" ? null : (e.mainImage?.url ?? null),
      category: e.categoryInfo?.title ?? "",
      tag: spots && spots.tone !== "ok" ? spots.label : multi ? "Varias funciones" : "",
    }
  }), now)
  const cats = collections.filter((c) => c.kind === "category").map((c) => ({
    label: c.shortLabel, href: `/${c.slug}`,
    count: upcoming.filter((e) => e.categoryInfo?.id === c.categoryId || e.categoryInfo?.id === c.categorySlug || e.categoryInfo?.slug === c.categorySlug).length,
  })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count)
  const jsonLd = upcoming.slice(0, 20).map((e) => eventJsonLdHtml(EventViewModelMapper.toViewModel(e), { attendeeCount: e.analytics?.registrations ?? 0 }))
  return { view, cats, jsonLd }
}
