import { RailHeader } from "@/app/components/layout/shared/Rail"
import { cacheLife, cacheTag } from "next/cache"
import { createServerContainer } from "@/infraestructure/di/container"
import type { Events } from "@/domain/entities/events/Events"
import { EventCardInteractive } from "@/presentation/events/components/card/EventCardInteractive"
import { EventViewModelMapper } from "@/presentation/events/mapper/EventViewModelMapper"
import { fetchEvent } from "../data/fetchHomeView"

async function fetchFeaturedIds(): Promise<string[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("event-list", "featured-events")
  const ids = await createServerContainer().eventFeed.getFeatured()
  const now = Date.now() // dentro de la caché: fuera de ella rompe el prerender
  const events = (await Promise.all(ids.map(fetchEvent))).filter((e): e is Events => !!e && e.status === "published" && e.endDate.getTime() >= now)
  return events.map((e) => e.id)
}

/** Sección de eventos en carril deslizable con la tarjeta limpia (fecha, tipo de fecha, lugar, precio, cuántos van, vistas). */
function EventCardsSection({ id, title, hint, href, linkLabel, events }: { id: string; title: string; hint?: string; href: string; linkLabel: string; events: Events[] }) {
  if (!events.length) return null
  const rail = `${id}-carril`
  return (
    <section aria-labelledby={id}>
      <RailHeader id={id} title={title} hint={hint} href={href} linkLabel={linkLabel} targetId={rail} className="mb-3.5" />
      <EventCardInteractive events={events.map((e) => EventViewModelMapper.toViewModel(e))} info={{ title: "Sin eventos por ahora" }} variant="rail" railId={rail} />
    </section>
  )
}

const load = async (ids: string[]) => (await Promise.all(ids.map(fetchEvent))).filter((e): e is Events => !!e && e.status === "published")

/** «Próximos eventos»: los que vienen, del más cercano al más lejano. No se dibuja vacío. */
export async function HomeUpcomingEvents({ ids, total }: { ids: string[]; total: number }) {
  return <EventCardsSection id="proximos-eventos" title="Próximos eventos" hint="Lo que viene esta semana y los días siguientes." href="/eventos" linkLabel={`Ver los ${total}`} events={await load(ids)} />
}

/** «Destacados»: los recomendados vigentes. No se dibuja sin destacados. */
export async function HomeFeatured() {
  const events = await load(await fetchFeaturedIds())
  return <EventCardsSection id="destacados" title="Destacados" href="/eventos-destacados-ibague" linkLabel="Ver todos" events={events.slice(0, 8)} />
}
