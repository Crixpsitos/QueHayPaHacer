import type { Metadata } from "next"
import { Suspense } from "react"
import { Container } from "@/app/components/layout/shared/Container"
import { UnsubscribeConfirm } from "@/presentation/notificationPrefs/components/UnsubscribeConfirm"

export const metadata: Metadata = { title: "Darme de baja del correo", robots: { index: false, follow: false } }

async function Content({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "")
  return <UnsubscribeConfirm uid={one(q.u)} token={one(q.t)} />
}

export default function BajaPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <Container className="py-12">
      <Suspense fallback={<div className="mx-auto h-48 w-full max-w-md animate-pulse rounded-3xl bg-muted" aria-busy="true" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </Container>
  )
}
