import { fetchActivityPage } from "@/presentation/activities/data/fetchers"
import { RAIL_CLASS, RAIL_ITEM_CLASS, RailHeader } from "@/app/components/layout/shared/Rail"
import { RailActivityCard } from "./RailActivityCard"

/** «Actividades»: todas las publicadas (no solo las de hoy), en carril deslizable. No se dibuja vacío. */
export async function AllActivities() {
  const page = await fetchActivityPage({}, 0, 8)
  if (!page.items.length) return null
  return (
    <section aria-labelledby="todas-las-actividades">
      <RailHeader id="todas-las-actividades" title="Actividades" hint="Planes que se repiten: clases, caminatas, talleres y más, cualquier día." href="/actividades" linkLabel={`Ver las ${page.total}`} targetId="actividades-carril" className="mb-3.5" />
      <ul id="actividades-carril" className={RAIL_CLASS}>
        {page.items.map((a) => <li key={a.id} className={RAIL_ITEM_CLASS}><RailActivityCard a={a} /></li>)}
      </ul>
    </section>
  )
}
