import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/app/components/ui/button/button"
import { filterHref } from "@/presentation/activities/lib/filterHref"
import { parseFilters, type ActivityFilters as Filters } from "@/domain/entities/activities/filters"
import { WHEN_LABELS, ActivityFilters } from "@/presentation/activities/components/ActivityFilters"
import { ActivityList } from "@/presentation/activities/components/ActivityList"
import { HubHero } from "@/presentation/activities/components/hub/HubHero"
import { CategoryTiles } from "@/presentation/activities/components/hub/CategoryTiles"
import { AgendaView } from "@/presentation/activities/components/hub/AgendaView"
import { PublishBand } from "@/presentation/activities/components/PublishBand"
import { fetchActivityPage, fetchAgenda, fetchHubMeta, resolveSiteId } from "@/presentation/activities/data/fetchers"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const TITLE = "Actividades para hacer en Ibagué"
const DESCRIPTION = "Caminatas, clubes, talleres, planes en familia y más: lo que se hace en Ibagué cada semana, con horario, precio y cómo unirte."

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const filtered = Object.keys(parseFilters(await searchParams)).length > 0
  // Las combinaciones de filtros no se indexan (contenido repetido); el hub limpio sí.
  return { title: TITLE, description: DESCRIPTION, alternates: { canonical: "/actividades" }, robots: filtered ? { index: false, follow: true } : undefined }
}

async function Hub({ searchParams }: PageProps) {
  const f = parseFilters(await searchParams)
  const [meta, siteId] = await Promise.all([fetchHubMeta(), f.siteSlug ? resolveSiteId(f.siteSlug) : Promise.resolve(undefined)])
  const filters: Filters = { category: f.category, kind: f.kind, siteId: siteId ?? undefined, when: f.when, day: f.day, budget: f.budget, companion: f.companion }
  const noSite = Boolean(f.siteSlug && !siteId)
  const agendaMode = Boolean(f.when || f.day)
  const filtered = Object.keys(f).length > 0

  const agenda = agendaMode && !noSite ? await fetchAgenda(filters) : []
  const page = !agendaMode && !noSite ? await fetchActivityPage(filters, 0) : { items: [], total: 0, nextOffset: null }
  const empty = noSite || (agendaMode ? agenda.length === 0 : page.items.length === 0)

  return (
    <>
      <HubHero current={f} meta={meta} />
      <div className="grid gap-10 py-8">
        <ActivityFilters current={f} />

        {!filtered ? <CategoryTiles counts={meta.categories} current={f} /> : null}

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
            <ActivityList key={JSON.stringify(f)} first={page} filters={{ category: f.category, kind: f.kind, siteId: siteId ?? undefined, cuando: f.when, dia: f.day, presupuesto: f.budget, con: f.companion }} />
          </section>
        ) : null}

        {empty && filtered ? (
          <div className="grid justify-items-start gap-3 rounded-[1.75rem] border border-border bg-card p-6">
            <h2 className="font-heading text-xl font-bold">No hay actividades con esa combinación</h2>
            <p className="text-sm text-muted-foreground">Prueba otro día o quita un filtro{f.when === "hoy" || f.day ? ", o mira lo que sí hay esta semana" : ""}.</p>
            <div className="flex flex-wrap gap-2">
              {f.when === "hoy" || f.day ? <Button asChild variant="outline" className="h-11 border-primary text-primary-dark"><Link href={filterHref(f, { when: "esta-semana" })}>Ver toda la semana</Link></Button> : null}
              <Button asChild variant="outline" className="h-11"><Link href="/actividades">Quitar filtros</Link></Button>
            </div>
          </div>
        ) : null}

        {empty && !filtered ? (
          <div className="grid gap-3 rounded-[1.75rem] border border-dashed border-border bg-card p-8 text-center">
            <h2 className="font-heading text-xl font-bold">Todavía no hay actividades aquí</h2>
            <p className="text-sm text-muted-foreground">Publica la tuya: es gratis.</p>
            <Button asChild size="lg" className="mx-auto h-12"><Link href="/actividades/crear">Crear una actividad</Link></Button>
          </div>
        ) : null}

        <PublishBand />
      </div>
    </>
  )
}

export default function ActividadesHubPage({ searchParams }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-0 sm:px-6 sm:pt-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-[2rem] bg-muted" aria-busy="true" />}>
        <Hub searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
