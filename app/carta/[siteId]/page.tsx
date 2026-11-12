import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { getSessionUid } from "@/app/actions/_session"
import { createServerContainer } from "@/infraestructure/di/container"
import { ACTIVITY_CATEGORIES } from "@/domain/entities/activities/value-objects/ActivityCategory"
import { CatalogManager } from "@/presentation/catalog/components/CatalogManager"

// Área privada del dueño del sitio.
export const metadata: Metadata = { title: "Mi carta", robots: { index: false, follow: false } }

async function Loader({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params
  const uid = await getSessionUid()
  if (!uid) redirect(`/login?redirect_to=${encodeURIComponent(`/carta/${siteId}`)}`)
  const { siteCatalogService, sitesService, activityService } = createServerContainer()
  const catalog = await siteCatalogService.getForOwner(uid, siteId)
  if (!catalog) notFound()
  const [site, acts] = await Promise.all([sitesService.getActivityLinkSnapshot(siteId), activityService.listForSite(siteId)])
  const names = new Map(ACTIVITY_CATEGORIES.map((c) => [c.slug, c.name]))
  const activities = acts.map((a) => ({ id: a.id, title: a.title, category: a.category, categoryName: names.get(a.category) ?? a.category }))
  return <CatalogManager siteId={siteId} siteName={site?.name ?? "tu sitio"} initial={catalog} activities={activities} />
}

export default function CartaPage({ params }: { params: Promise<{ siteId: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-5xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
      <Loader params={params} />
    </Suspense>
  )
}
