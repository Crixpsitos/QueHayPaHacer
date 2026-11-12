import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSessionUid } from "@/app/actions/_session"
import { Container } from "@/app/components/layout/shared/Container"
import { CollectStamp } from "@/presentation/activities/components/passport/CollectStamp"
import { createServerContainer } from "@/infraestructure/di/container"

export const metadata: Metadata = { title: "Sella tu pasaporte", robots: { index: false, follow: false } }

async function Content({ params }: { params: Promise<{ id: string; token: string }> }) {
  const { id, token } = await params
  const uid = await getSessionUid()
  if (!uid) redirect(`/login?redirect_to=${encodeURIComponent(`/sello/${id}/${token}`)}`)
  const a = /^[A-Za-z0-9_-]{1,128}$/.test(id) ? await createServerContainer().activityService.getPublicById(id) : null
  return <CollectStamp activityId={id} token={token} title={a?.title ?? null} slug={a?.slug ?? null} />
}

/** Página a la que lleva el QR del local. El sello se da con un botón (un escaneo accidental o un enlace ajeno no sella solo). */
export default function SelloPage({ params }: { params: Promise<{ id: string; token: string }> }) {
  return (
    <Container className="py-10">
      <Suspense fallback={<div className="mx-auto h-64 w-full max-w-md animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <Content params={params} />
      </Suspense>
    </Container>
  )
}
