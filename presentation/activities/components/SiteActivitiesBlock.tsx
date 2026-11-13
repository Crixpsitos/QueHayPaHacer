import Link from "@/app/components/ui/navigation/IntentLink"
import { fetchSiteActivities } from "@/presentation/activities/data/fetchers"
import { ActivityCard } from "./ActivityCard"

/** "¿Qué se puede hacer aquí?" en la ficha de un sitio. Si el sitio no tiene actividades públicas no se renderiza nada. */
export async function SiteActivitiesBlock({ siteId, siteSlug }: { siteId: string; siteSlug: string }) {
  const items = await fetchSiteActivities(siteId)
  if (!items.length) return null
  return (
    <div className="grid gap-8">
    <section aria-labelledby="que-hacer-aqui" className="grid gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="que-hacer-aqui" className="text-lg font-semibold">¿Qué se puede hacer aquí?</h2>
        {siteSlug ? <Link href={`/actividades?sitio=${siteSlug}`} className="text-sm font-semibold text-primary-dark underline-offset-4 hover:underline">Ver todas</Link> : null}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">{items.map((a) => <ActivityCard key={a.id} a={a} />)}</ul>
    </section>
    </div>
  )
}
