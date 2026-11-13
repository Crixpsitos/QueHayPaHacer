import type { Metadata } from "next"
import Link from "@/app/components/ui/navigation/IntentLink"
import { Suspense } from "react"
import { Button } from "@/app/components/ui/button/button"
import { filterHref } from "@/presentation/activities/lib/filterHref"
import { parseFilters, type ActivityFilters as Filters } from "@/domain/entities/activities/filters"
import { WHEN_LABELS, ActivityFilters } from "@/presentation/activities/components/ActivityFilters"
import { ActivityList } from "@/presentation/activities/components/ActivityList"
import { HubHero } from "@/presentation/activities/components/hub/HubHero"
import { HubHeroLive } from "@/presentation/activities/components/hub/HubHeroLive"
import { ActivityFiltersLive } from "@/presentation/activities/components/ActivityFiltersLive"
import { FeaturedPlan } from "@/presentation/activities/components/hub/FeaturedPlan"
import { CategoryTiles } from "@/presentation/activities/components/hub/CategoryTiles"
import { AgendaView } from "@/presentation/activities/components/hub/AgendaView"
import { PublishBand } from "@/presentation/activities/components/PublishBand"
import { HubMapToggle } from "@/presentation/activities/components/hub/HubMapToggle"
import { bogotaDateIso } from "@/domain/entities/activities/value-objects/occurrences"
import { fetchActivityPage, fetchAgenda, fetchHubMap, fetchHubMeta, resolveSiteId } from "@/presentation/activities/data/fetchers"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
type Params = PageProps["searchParams"]

// Solo esta ruta usa Partial Prefetching (sin el flag global): el router pide al servidor el contenido de cada ?filtro en vez de reutilizar el viejo.
export const prefetch = "partial"

const TITLE = "Actividades para hacer en Ibagué"
const DESCRIPTION = "Caminatas, clubes, talleres, planes en familia y más: lo que se hace en Ibagué cada semana, con horario, precio y cómo unirte."

// Metadatos estáticos (no leen searchParams: con `htmlLimitedBots` bloquearían toda la página). Las combinaciones de filtros
// apuntan por `canonical` al hub limpio.
export const metadata: Metadata = { title: TITLE, description: DESCRIPTION, alternates: { canonical: "/actividades" } }

/** Filtros de la URL ya resueltos (sitio por slug). Solo se llama dentro de un <Suspense>: lee searchParams. */
async function resolve(searchParams: Params) {
  const f = parseFilters(await searchParams)
  const siteId = f.siteSlug ? await resolveSiteId(f.siteSlug) : undefined
  const filters: Filters = { category: f.category, kind: f.kind, siteId: siteId ?? undefined, when: f.when, day: f.day, budget: f.budget, companion: f.companion, promo: f.promo }
  return { f, siteId, filters, noSite: Boolean(f.siteSlug && !siteId) }
}

/** Cabecera: parte del shell estático (la semana sale de una lectura en caché). El día activo lo pinta el navegador desde la URL. */
async function Header() {
  const meta = await fetchHubMeta()
  return (
    <Suspense fallback={<HubHero current={{}} meta={meta} />}>
      <HubHeroLive meta={meta} />
    </Suspense>
  )
}

/** «El plan de la semana»: solo en el hub sin filtros. */
async function Featured({ searchParams }: { searchParams: Params }) {
  if (Object.keys(parseFilters(await searchParams)).length > 0) return null
  return <FeaturedPlan />
}

/** Mapa: el botón (cerrado por defecto) está en el shell; los pines del día llegan por streaming. */
async function MapSlot({ searchParams }: { searchParams: Params }) {
  const { f, filters, noSite } = await resolve(searchParams)
  if (noSite) return null
  const data = await fetchHubMap(f.day ?? bogotaDateIso(new Date()), { ...filters, day: undefined })
  return data.pins.length || data.withoutPlace ? <HubMapToggle data={data} /> : null
}

/** Lo único que cambia de verdad con el filtro: agenda o lista, vacíos y categorías. */
async function Results({ searchParams }: { searchParams: Params }) {
  const { f, siteId, filters, noSite } = await resolve(searchParams)
  const agendaMode = Boolean(f.when || f.day)
  const filtered = Object.keys(f).length > 0
  const [meta, agenda, page] = await Promise.all([
    fetchHubMeta(),
    agendaMode && !noSite ? fetchAgenda(filters) : Promise.resolve([]),
    !agendaMode && !noSite ? fetchActivityPage(filters, 0) : Promise.resolve({ items: [], total: 0, nextOffset: null }),
  ])
  const empty = noSite || (agendaMode ? agenda.length === 0 : page.items.length === 0)

  return (
    <>
      {agendaMode && !empty ? (
        <section aria-label="Agenda" className="grid gap-5">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{agenda.reduce((n, d) => n + d.entries.length, 0)} planes</strong>
            {f.day ? "" : f.when ? ` · ${WHEN_LABELS[f.when].toLowerCase()}` : ""}, ordenados por la hora en que empiezan
          </p>
          <AgendaView days={agenda} showDayTitles={agenda.length > 1} />
        </section>
      ) : null}

      {!agendaMode && !empty ? (
        <section aria-label="Actividades" className="grid gap-5">
          {filtered ? <p className="text-sm text-muted-foreground"><strong className="text-foreground">{page.total} {page.total === 1 ? "actividad" : "actividades"}</strong></p> : <h2 className="font-heading text-2xl font-extrabold tracking-tight">Todas las actividades</h2>}
          <ActivityList key={JSON.stringify(f)} first={page} filters={{ category: f.category, kind: f.kind, siteId: siteId ?? undefined, cuando: f.when, dia: f.day, presupuesto: f.budget, con: f.companion, promos: f.promo ? "hoy" : undefined }} />
        </section>
      ) : null}

      {!filtered && !agendaMode ? <CategoryTiles counts={meta.categories} current={f} /> : null}

      {empty && filtered ? (
        <div className="grid justify-items-start gap-3 rounded-[1.75rem] border border-border bg-card p-6">
          <h2 className="font-heading text-xl font-bold">No hay actividades con esa combinación</h2>
          <p className="text-sm text-muted-foreground">Prueba otro día o quita un filtro{f.when === "hoy" || f.day ? ", o mira lo que sí hay esta semana" : ""}.</p>
          <div className="flex flex-wrap gap-2">
            {f.when === "hoy" || f.day ? <Button asChild variant="outline" className="h-11 border-primary text-primary-dark"><Link prefetch={false} href={filterHref(f, { when: "esta-semana" })}>Ver toda la semana</Link></Button> : null}
            <Button asChild variant="outline" className="h-11"><Link prefetch={false} href="/actividades">Quitar filtros</Link></Button>
          </div>
        </div>
      ) : null}

      {empty && !filtered ? (
        <div className="grid gap-3 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-xl font-bold">Todavía no hay actividades aquí</h2>
          <p className="text-sm text-muted-foreground">Publica la tuya: es gratis.</p>
          <Button asChild size="lg" className="mx-auto h-12"><Link prefetch={false} href="/actividades/crear">Crear una actividad</Link></Button>
        </div>
      ) : null}
    </>
  )
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Cargando actividades">
      <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted" />)}</div>
    </div>
  )
}

// Pre-renderizado parcial: el shell estático lleva cabecera, botón del mapa, filtros y banda de publicar; cada parte que
// depende de la URL va en su <Suspense>. Cambiar un filtro solo repone el esqueleto de la lista.
export default function ActividadesHubPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-0 sm:px-6 sm:pt-6">
      <Header />
      <div className="grid gap-10 py-8">
        <Suspense fallback={null}><Featured searchParams={searchParams} /></Suspense>
        {/* Cerrado por defecto: el fallback es el mismo botón, así que al llegar el mapa no salta nada. */}
        <Suspense fallback={<HubMapToggle data={null} />}><MapSlot searchParams={searchParams} /></Suspense>
        <Suspense fallback={<ActivityFilters current={{}} />}><ActivityFiltersLive /></Suspense>
        <Suspense fallback={<ResultsSkeleton />}><Results searchParams={searchParams} /></Suspense>
        <PublishBand />
      </div>
    </div>
  )
}
