import { Suspense } from "react"
import type { Metadata } from "next"
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { SITE_URL } from "@/app/lib/site"
import { LinksView } from "@/presentation/studio/components/links/LinksView"
import { buildLinksOverview, type FichaRef, type LinkRow } from "@/presentation/studio/lib/linksOverview"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import type { StatsTotals } from "@/domain/entities/analytics/fichaStats"

export const metadata: Metadata = { title: "Visitas y enlaces" }

function LinksSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando tus enlaces">
      <div className="h-16 w-2/3 animate-pulse rounded-lg bg-gray-100" />
      <div className="h-36 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
    </div>
  )
}

export default function StudioLinksPage() {
  return (
    <Suspense fallback={<LinksSkeleton />}>
      <LinksData />
    </Suspense>
  )
}

async function LinksData() {
  await redirectLimitedToEvents()
  // Premium verificado aquí también: el layout (StudioGate) no protege requests RSC directas.
  const uid = await getPremiumSessionUid()
  if (!uid) return null

  const { linksService, studioService, sitesService, dailyStatsRepository } = createServerContainer()
  const [links, eventsPage, sites] = await Promise.all([
    linksService.listWithClicks(uid),
    studioService.getOrganizerEvents(uid, { limit: 25 }),
    sitesService.getMySites(uid),
  ])

  // Solo fichas publicadas (un enlace a un borrador no lleva a nada).
  const fichas: FichaRef[] = [
    ...eventsPage.events.filter((e) => e.status === "published").map((e) => ({ type: "event" as const, id: e.eventId, name: e.name, image: e.image })),
    ...sites.filter((s) => s.publicationStatus === "published").slice(0, 25).map((s) => ({ type: "site" as const, id: s.id, name: s.name, image: s.coverUrl || undefined })),
  ]

  const sinceDay = bogotaDay(new Date(Date.now() - 30 * 24 * 3600_000))
  const stats: Record<string, StatsTotals> = {}
  await Promise.all(
    fichas.map(async (f) => {
      stats[`${f.type}:${f.id}`] = await dailyStatsRepository.sumSince(f.type === "event" ? "events" : "sites", f.id, sinceDay)
    }),
  )

  const rows: LinkRow[] = links.map((l) => ({
    code: l.code, label: l.label, targetType: l.target.type, targetId: l.target.id, targetName: "", clicks: l.clicks,
  }))
  return <LinksView baseUrl={SITE_URL} overview={buildLinksOverview(fichas, stats, rows)} />
}
