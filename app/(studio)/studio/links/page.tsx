import { Suspense } from "react"
import type { Metadata } from "next"
import { getPremiumSessionUid, redirectLimitedToEvents } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { SITE_URL } from "@/app/lib/site"
import { LinksView } from "@/presentation/studio/components/links/LinksView"
import type { LinkItem, LinkTargetOption } from "@/presentation/studio/components/links/LinksView"

export const metadata: Metadata = { title: "Mis enlaces" }

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

  const { linksService, studioService, sitesService } = createServerContainer()
  const [links, eventsPage, sites] = await Promise.all([
    linksService.listWithClicks(uid),
    studioService.getOrganizerEvents(uid, { limit: 50 }),
    sitesService.getMySites(uid),
  ])

  const events: LinkTargetOption[] = eventsPage.events.map((e) => ({ type: "event", id: e.eventId, name: e.name }))
  const siteOptions: LinkTargetOption[] = sites.map((s) => ({ type: "site", id: s.id, name: s.name }))
  const names = new Map([...events, ...siteOptions].map((t) => [`${t.type}:${t.id}`, t.name]))
  const items: LinkItem[] = links.map((l) => ({
    code: l.code,
    label: l.label,
    targetType: l.target.type,
    targetName: names.get(`${l.target.type}:${l.target.id}`) ?? (l.target.type === "event" ? "Evento" : "Sitio"),
    clicks: l.clicks,
  }))

  return <LinksView baseUrl={SITE_URL} links={items} events={events} sites={siteOptions} />
}
