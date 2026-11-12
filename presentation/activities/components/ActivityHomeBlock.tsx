import Link from "next/link"
import { Section } from "@/app/components/layout/shared/Section"
import { fetchHomeActivities } from "@/presentation/activities/data/fetchers"
import { ActivityCard } from "./ActivityCard"

/** Portada: lo que se puede hacer hoy (o esta semana si hoy hay poco). No se dibuja vacío. */
export async function ActivityHomeBlock() {
  const data = await fetchHomeActivities()
  if (!data) return null
  const today = data.mode === "today"
  return (
    <Section spacing="sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">{today ? "Actividades de hoy" : "Actividades de esta semana"}</h2>
        <Link href={`/actividades?cuando=${today ? "hoy" : "esta-semana"}`} className="shrink-0 text-sm font-semibold text-primary-dark underline-offset-2 hover:underline">Ver todas</Link>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{today ? `${cap(data.dateLabel)} · lo que se puede hacer hoy en Ibagué` : "Hoy no hay mucho: estas salen en los próximos días."}</p>
      {/* móvil: carrusel con imán; desde sm: rejilla */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&>li]:w-60 [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-auto">
        {data.items.map((a) => <ActivityCard key={a.id} a={a} />)}
      </ul>
    </Section>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
