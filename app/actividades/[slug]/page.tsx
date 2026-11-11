import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { fetchActivityPreview, fetchPublicActivity } from "@/presentation/activities/data/fetchers"
import { ActivityDetail } from "@/presentation/activities/components/detail/ActivityDetail"
import { SITE_NAME } from "@/app/lib/site"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const a = await fetchPublicActivity(slug)
  // No pública (o inexistente): sin metadatos propios y fuera del índice.
  if (!a) return { title: "Actividad", robots: { index: false, follow: false } }
  const description = (a.tagline || a.description).slice(0, 155)
  const url = `/actividades/${a.slug}`
  return {
    title: `${a.title} en Ibagué`,
    description,
    alternates: { canonical: url },
    openGraph: { title: a.title, description, url, type: "website", siteName: SITE_NAME, locale: "es_CO" },
    twitter: { card: "summary_large_image", title: a.title, description },
  }
}

const PREVIEW_TEXT = {
  draft: "es un borrador y solo la ves tú.",
  review: "está en revisión y solo la ves tú (y QHPA). Te avisamos al publicarla.",
  rejected: "fue rechazada. Edítala y vuelve a enviarla.",
  paused: "está pausada: no aparece en listados.",
  live: "así la ve la gente.",
} as const

async function ActivityPage({ params }: PageProps) {
  const { slug } = await params
  const pub = await fetchPublicActivity(slug)
  if (pub) return <ActivityDetail data={pub} />

  // No es pública: solo su dueño o QHPA pueden verla (vista previa). Para cualquier otro, 404 (no se revela que existe).
  const uid = await getSessionUid()
  const prev = uid ? await fetchActivityPreview(slug, { uid, isAdmin: isQhpaAdmin(uid) }) : null
  if (!prev) notFound()
  const key = prev.publicationStatus !== "published" ? "draft" : prev.moderationStatus === "rejected" ? "rejected" : prev.moderationStatus === "pending" ? "review" : prev.isActive ? "live" : "paused"
  return <ActivityDetail data={prev.data} preview={PREVIEW_TEXT[key]} />
}

export default function ActividadPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="mx-auto h-96 w-full max-w-6xl animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
      <ActivityPage params={params} />
    </Suspense>
  )
}
