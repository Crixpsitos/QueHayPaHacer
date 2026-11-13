import { SITE_URL } from "@/app/lib/site"
import { canShowCatalog, canShowPromotions } from "@/domain/entities/catalog/catalogRules"
import type { ActivityCategory } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { fetchSiteCatalog } from "@/presentation/catalog/data/fetchers"
import { fetchSiteActivities } from "@/presentation/activities/data/fetchers"
import { CatalogView } from "./CatalogView"

/** «Nuestra carta» y «Todas nuestras promociones» en la ficha del sitio. No pinta nada si el sitio no tiene carta ni promociones. */
export async function SiteCatalogBlock({ siteId, siteName, siteSlug }: { siteId: string; siteName: string; siteSlug: string }) {
  const [catalog, acts] = await Promise.all([fetchSiteCatalog(siteId), fetchSiteActivities(siteId)])
  if (!catalog.products.length && !catalog.promotions.length) return null
  const activityTitles = Object.fromEntries(acts.map((a) => [a.id, a.title]))
  return (
    <CatalogView
      title="Nuestra carta"
      products={catalog.products}
      promotions={catalog.promotions}
      whatsapp={catalog.whatsapp}
      reservePhone={catalog.reservePhone}
      context={{ title: siteName, url: `${SITE_URL}/donde-ir/${siteSlug || siteId}` }}
      activityTitles={activityTitles}
      siteId={siteId}
    />
  )
}

/**
 * La carta y las promociones del sitio en la ficha de una actividad. Los productos salen solo si la categoría de la actividad admite
 * catálogo; las promociones, solo las que el dueño eligió para ESTA actividad y si la categoría admite promociones.
 */
export async function ActivityCatalogBlock({ siteId, activity }: { siteId: string; activity: { id: string; title: string; slug: string; category: ActivityCategory } }) {
  const catalog = await fetchSiteCatalog(siteId)
  const products = canShowCatalog(activity.category) ? catalog.products : []
  const promotions = canShowPromotions(activity.category) ? catalog.promotions.filter((x) => x.activityIds.includes(activity.id)) : []
  if (!products.length && !promotions.length) return null
  return (
    <CatalogView
      title={products.length ? "Lo que hay para comprar" : "Promociones"}
      products={products}
      promotions={promotions}
      whatsapp={catalog.whatsapp}
      reservePhone={catalog.reservePhone}
      context={{ title: activity.title, url: `${SITE_URL}/actividades/${activity.slug}` }}
      siteId={siteId}
    />
  )
}
