import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Section } from "@/app/components/layout/shared/Section"
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/app/lib/site"
import { ActivityCard } from "@/presentation/activities/components/ActivityCard"
import { PublishBand } from "@/presentation/activities/components/PublishBand"
import { ACTIVITY_COLLECTIONS } from "@/presentation/activities/lib/activityCollections"
import { activityListJsonLdHtml } from "@/presentation/activities/lib/activityListJsonLd"
import { fetchActivityPage } from "@/presentation/activities/data/fetchers"

const TITLE = "Cosas para hacer en Ibagué: planes, actividades y sitios"
const DESCRIPTION = "Todo lo que se puede hacer en Ibagué en un solo lugar: actividades de la semana, eventos de hoy y sitios para salir, con horario, precio y cómo llegar."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/cosas-para-hacer-en-ibague" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/cosas-para-hacer-en-ibague", type: "website", siteName: SITE_NAME, locale: "es_CO", images: [DEFAULT_OG_IMAGE] },
}

/** Página pilar: une actividades, eventos de hoy y sitios. Texto aprobado por el dueño (docs/34). */
async function Pillar() {
  const week = await fetchActivityPage({ when: "esta-semana" }, 0, 6)
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: activityListJsonLdHtml({ siteUrl: SITE_URL, path: "/cosas-para-hacer-en-ibague", name: "Cosas para hacer en Ibagué", items: week.items.map((a) => ({ slug: a.slug, title: a.title })) }) }} />
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">Cosas para hacer en Ibagué</h1>
        <div className="mt-3 grid max-w-2xl gap-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
          <p>Ibagué tiene tres tipos de planes y conviene no mezclarlos. Los <strong className="text-foreground">eventos</strong> pasan una vez, con fecha y hora marcadas: conciertos, ferias, obras. Las <strong className="text-foreground">actividades</strong> se repiten cada semana: clubes, caminatas, clases, trotes. Y los <strong className="text-foreground">sitios</strong> son los lugares a los que puedes ir cuando quieras: cafés, parques, museos, miradores.</p>
          <p>Esta página junta los tres. Empieza por lo que sale esta semana; si buscas algo para hoy mismo, entra a los eventos de hoy, y si solo quieres un lugar bonito para caminar, mira los sitios.</p>
        </div>
      </Section>

      <Section spacing="sm" className="mt-6">
        <div className="flex items-baseline justify-between gap-3"><h2 className="text-2xl font-bold">Actividades de esta semana</h2><Link href="/actividades" className="text-sm font-semibold text-primary-dark underline-offset-2 hover:underline">Ver todas</Link></div>
        {week.items.length ? <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{week.items.map((a, i) => <ActivityCard key={a.id} a={a} priority={i < 3} />)}</ul> : <p className="mt-4 text-sm text-muted-foreground">Todavía no hay actividades publicadas esta semana.</p>}
      </Section>

      <Section spacing="sm" className="mt-6">
        <h2 className="text-2xl font-bold">Elige cómo buscar</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          <li><Link href="/que-hay-hoy-ibague" className="grid h-full gap-1 rounded-3xl border border-border bg-card p-5 hover:bg-muted/50"><span className="font-heading text-lg font-bold">Eventos de hoy</span><span className="text-sm text-muted-foreground">Lo que pasa hoy con fecha y hora.</span></Link></li>
          <li><Link href="/actividades" className="grid h-full gap-1 rounded-3xl border border-border bg-card p-5 hover:bg-muted/50"><span className="font-heading text-lg font-bold">Actividades en el mapa</span><span className="text-sm text-muted-foreground">Mueve la hora y mira qué hay cerca.</span></Link></li>
          <li><Link href="/donde-ir" className="grid h-full gap-1 rounded-3xl border border-border bg-card p-5 hover:bg-muted/50"><span className="font-heading text-lg font-bold">Dónde ir</span><span className="text-sm text-muted-foreground">Cafés, parques, museos y miradores.</span></Link></li>
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">O entra por tema: {ACTIVITY_COLLECTIONS.map((c, i) => <span key={c.slug}>{i ? " · " : ""}<Link href={`/${c.slug}`} className="font-semibold text-primary-dark underline-offset-2 hover:underline">{c.title.replace(/ en Ibagué| para hacer| para el/g, "").trim()}</Link></span>)}</p>
      </Section>

      <Section spacing="sm" className="mt-6"><PublishBand /></Section>
    </>
  )
}

export default function CosasParaHacerPage() {
  return <Suspense fallback={<div className="mx-auto h-64 max-w-5xl animate-pulse rounded-3xl bg-muted" aria-hidden />}><Pillar /></Suspense>
}
