import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Container } from "@/app/components/layout/shared/Container"
import { Button } from "@/app/components/ui/button/button"
import { parseFilters } from "@/domain/entities/activities/filters"
import { ActivityFilters } from "@/presentation/activities/components/ActivityFilters"
import { ActivityList } from "@/presentation/activities/components/ActivityList"
import { fetchActivityPage, resolveSiteId } from "@/presentation/activities/data/fetchers"

type SP = Record<string, string | string[] | undefined>
interface PageProps {
  searchParams: Promise<SP>
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
  const siteId = f.siteSlug ? await resolveSiteId(f.siteSlug) : undefined
  const page = f.siteSlug && !siteId ? { items: [], total: 0, nextOffset: null } : await fetchActivityPage({ category: f.category, kind: f.kind, siteId: siteId ?? undefined, when: f.when, budget: f.budget, companion: f.companion }, 0)
  return (
    <div className="grid gap-6">
      <ActivityFilters current={f} />
      {page.items.length ? (
        <ActivityList key={JSON.stringify(f)} first={page} filters={{ category: f.category, kind: f.kind, siteId: siteId ?? undefined, cuando: f.when, presupuesto: f.budget, con: f.companion }} />
      ) : (
        <div className="grid gap-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-xl font-semibold">Todavía no hay actividades aquí</h2>
          <p className="text-sm text-muted-foreground">Prueba otra categoría, o publica la tuya: es gratis.</p>
          <Button asChild size="lg" className="mx-auto h-12"><Link href="/actividades/crear">Crear una actividad</Link></Button>
        </div>
      )}
    </div>
  )
}

export default function ActividadesHubPage({ searchParams }: PageProps) {
  return (
    <Container className="grid gap-6 py-6">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{TITLE}</h1>
        <p className="max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <Hub searchParams={searchParams} />
      </Suspense>
    </Container>
  )
}
