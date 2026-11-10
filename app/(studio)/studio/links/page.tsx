import { Suspense } from "react"
import type { Metadata } from "next"
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { SITE_URL } from "@/app/lib/site"
import { PanelView } from "@/presentation/studio/components/links/PanelView"
import { buildPanel } from "@/presentation/studio/lib/panelModel"
import { resolveNav } from "@/presentation/studio/lib/panelNav"
import { getCachedStats30 } from "@/presentation/studio/lib/cachedPanelData"
import type { FichaRef, LinkRow } from "@/presentation/studio/lib/panelTypes"
import { bogotaDay } from "@/domain/entities/sites/siteStats"
import { dayRange } from "@/domain/entities/analytics/panel"

export const metadata: Metadata = { title: "Visitas y enlaces" }

function PanelSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando tus visitas">
      <div className="h-16 w-2/3 animate-pulse rounded-lg bg-slate-100" />
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-56 animate-pulse rounded-[20px] bg-slate-100" />
      <div className="h-72 animate-pulse rounded-[20px] bg-slate-100" />
    </div>
  )
}

export default function StudioLinksPage({ searchParams }: { searchParams: Promise<{ f?: string; d?: string; t?: string }> }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <PanelData searchParams={searchParams} />
    </Suspense>
  )
}

async function PanelData({ searchParams }: { searchParams: Promise<{ f?: string; d?: string; t?: string }> }) {
  const sp = await searchParams
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
  const rows: LinkRow[] = links.map((l) => ({ code: l.code, label: l.label, targetType: l.target.type, targetId: l.target.id, targetName: "", clicks: l.clicks }))

  const today = bogotaDay()
  const stats30 = await getCachedStats30(uid, fichas.map((f) => ({ type: f.type, id: f.id })), dayRange(today, 30)[0])

  // Un solo lugar decide qué se mira (ficha, período, tipo): el mismo que usa el cliente para resaltar al instante.
  const nav = resolveNav(fichas.map((f) => ({ key: `${f.type}:${f.id}`, type: f.type, views30: stats30[`${f.type}:${f.id}`]?.views ?? 0 })), sp)
  const selected = fichas.find((f) => `${f.type}:${f.id}` === nav.f)
  const docs = selected ? await dailyStatsRepository.readDays(selected.type === "event" ? "events" : "sites", selected.id, dayRange(today, nav.d * 2)[0]) : []
  return <PanelView baseUrl={SITE_URL} panel={buildPanel({ fichas, stats30, selectedKey: nav.f, period: nav.d, typeFilter: nav.t, today, links: rows, docs })} />
}
