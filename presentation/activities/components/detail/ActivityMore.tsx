import { fetchRelatedActivities } from "@/presentation/activities/data/fetchers"
import { ActivityCard } from "@/presentation/activities/components/ActivityCard"

function Row({ title, items }: { title: string; items: Awaited<ReturnType<typeof fetchRelatedActivities>>["similar"] }) {
  if (!items.length) return null
  return (
    <section className="grid gap-4">
      <h2 className="font-heading text-2xl font-extrabold tracking-tight">{title}</h2>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&>li]:w-64 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto">
        {items.map((a) => <ActivityCard key={a.id} a={a} />)}
      </ul>
    </section>
  )
}

/** Cierre de la ficha: más del mismo sitio y parecidas. No se dibuja vacío. */
export async function ActivityMore({ id, categorySlug, siteId, siteName }: { id: string; categorySlug: string; siteId: string | null; siteName: string | null }) {
  const r = await fetchRelatedActivities(id, categorySlug, siteId)
  if (!r.sameSite.length && !r.similar.length) return null
  return (
    <div className="grid gap-10">
      <Row title={siteName ? `Más en ${siteName}` : "Más del sitio"} items={r.sameSite} />
      <Row title={r.similarTitle} items={r.similar} />
    </div>
  )
}
