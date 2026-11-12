import Link from "next/link"
import { Section } from "@/app/components/layout/shared/Section"
import { SITE_URL } from "@/app/lib/site"
import { fetchActivityPage } from "@/presentation/activities/data/fetchers"
import { ActivityCard } from "./ActivityCard"

/**
 * Actividades dentro de las páginas «Qué hay hoy» y «Este fin de semana» (las búsquedas reales son de «hoy»).
 * Hoy sin actividades → se muestran las de la semana con su título; sin nada, no se dibuja.
 */
export async function CollectionActivitiesSection({ kind }: { kind: "today" | "weekend" }) {
  let when: "hoy" | "este-fin-de-semana" | "esta-semana" = kind === "today" ? "hoy" : "este-fin-de-semana"
  let page = await fetchActivityPage({ when }, 0, 8)
  let fallback = false
  if (kind === "today" && page.items.length === 0) {
    when = "esta-semana"
    page = await fetchActivityPage({ when }, 0, 8)
    fallback = true
  }
  if (page.items.length === 0) return null
  const title = fallback ? "Hoy no hay actividades: mira las de esta semana" : kind === "today" ? "Actividades de hoy" : "Actividades de este fin de semana"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: page.items.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/actividades/${a.slug}` })),
  }
  return (
    <Section spacing="sm" className="mt-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">{title}</h2>
        <span className="text-sm text-muted-foreground">{page.total}</span>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Planes que se repiten: no hace falta que alguien los publique cada vez.</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{page.items.map((a) => <ActivityCard key={a.id} a={a} />)}</ul>
      <Link href={`/actividades?cuando=${when}`} className="mt-5 inline-flex min-h-11 items-center rounded-full border border-primary px-5 text-sm font-semibold text-primary-dark transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/40">Ver todas las actividades</Link>
    </Section>
  )
}
