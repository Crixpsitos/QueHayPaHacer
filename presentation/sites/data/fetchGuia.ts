import { cacheLife, cacheTag } from "next/cache"
import { SITE_URL } from "@/app/lib/site"
import { createServerContainer } from "@/infraestructure/di/container"
import { momentRanges } from "@/domain/entities/home/moments"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { loadPublishedEvents } from "@/presentation/home/data/fetchHomeView"
import { liveBySite } from "@/presentation/home/lib/buildHomeView"
import { buildGuia, type GuiaView } from "../lib/buildGuia"
import type { SiteDetail } from "../view-models/SiteFormViewModel"
import { fetchFeaturedSites, fetchSiteDetailById } from "./siteListFetchers"

export interface GuiaData { view: GuiaView; /** Eventos de la ciudad que quedan esta semana (para el cruce con /eventos). */ weekEvents: number }

/**
 * Todo lo que pinta /donde-ir y sus páginas por tipo, en una sola caché corta: los sitios públicos, el próximo evento
 * de la semana en cada uno y su promoción vigente. Buscar y filtrar ocurre en el navegador.
 * ponytail: todos los sitios en memoria (igual que la portada); si la guía pasa de unos cientos, paginar «Todos» en el servidor.
 */
export const fetchGuia = async (): Promise<GuiaData> => {
  "use cache"
  cacheLife("hub")
  cacheTag("site-list", "event-list", "guia")
  const now = new Date()
  const c = createServerContainer()
  const [ids, events, featured, promos] = await Promise.all([
    c.sitesService.getAllSites(),
    loadPublishedEvents(),
    fetchFeaturedSites(),
    // Sin promociones la guía sigue sirviendo: un fallo aquí no debe tumbar la página.
    c.siteCatalogService.currentPromoBySite().catch((e) => { console.error("[guia] promociones", e); return {} as Record<string, string> }),
  ])
  const sites = (await Promise.all(ids.map(fetchSiteDetailById))).filter((s): s is SiteDetail => !!s)
  const evs = events.map((e) => ({ siteId: e.location?.siteId ?? null, startsAt: e.startDate.getTime(), endsAt: e.endDate.getTime(), title: e.title }))
  const weekEnd = momentRanges(now).semana.to
  const view = buildGuia({
    now, promos, live: liveBySite(evs, now), featuredIds: featured.map((s) => s.id),
    sites: sites.map((s) => ({
      id: s.id, slug: s.slug, name: s.name, category: s.category, address: s.address ?? "", coverUrl: s.coverUrl || null,
      lat: s.coordinates?.latitude || null, lng: s.coordinates?.longitude || null,
      schedule: s.schedule ?? null, policy: s.openingPolicy ?? null, closed: s.temporarilyClosed?.isClosed === true,
      price: s.facts?.find((f) => f.icon === "price")?.value ?? "", likes: s.analytics?.likes ?? 0,
    })),
  })
  return { view, weekEvents: evs.filter((e) => e.endsAt >= now.getTime() && bogotaDateIso(new Date(e.startsAt)) <= weekEnd).length }
}

/** Lista de sitios para buscadores (carrusel de Google), con `<` escapado. */
export const guiaJsonLdHtml = (view: GuiaView): string =>
  JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: view.sites.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: `${SITE_URL}${s.href}` })) }).replace(/</g, "\\u003c")
