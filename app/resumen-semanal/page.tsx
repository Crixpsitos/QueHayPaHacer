import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { getSessionUid } from "@/app/actions/_session"
import { isQhpaAdmin } from "@/app/lib/sites/qhpaAdmin"
import { SITE_URL } from "@/app/lib/site"
import { digestText } from "@/domain/entities/activities/weeklyDigest"
import { fetchWeekendDigest } from "@/presentation/activities/data/digest"

export const metadata: Metadata = { title: "Resumen del fin de semana", robots: { index: false, follow: false } }

/** Solo QHPA: el texto para el Canal de WhatsApp y la imagen para Instagram. Se publican a mano después de revisarlos. */
async function Digest() {
  const uid = await getSessionUid()
  if (!uid || !isQhpaAdmin(uid)) notFound()
  const d = await fetchWeekendDigest()
  const text = digestText(d, SITE_URL)
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Resumen del fin de semana</h1>
      {d.days.length ? (
        <>
          <section className="grid gap-2" aria-labelledby="txt">
            <h2 id="txt" className="font-semibold">Texto para el Canal de WhatsApp</h2>
            <textarea readOnly rows={Math.min(24, text.split("\n").length + 1)} value={text} className="w-full rounded-2xl border border-border bg-card p-4 font-mono text-sm" aria-label="Texto del resumen" />
            <p className="text-sm text-muted-foreground">Selecciona todo, copia y pégalo en el Canal. Revisa que nada esté vencido antes de publicar.</p>
          </section>
          <section className="grid gap-2" aria-labelledby="img">
            <h2 id="img" className="font-semibold">Imagen para Instagram</h2>
            {/* eslint-disable-next-line @next/next/no-img-element -- es una vista previa de una ruta de imagen generada */}
            <img src="/og/resumen" alt="Imagen del resumen del fin de semana" className="w-full rounded-2xl border border-border" width={1200} height={630} />
            <a href="/og/resumen" download="resumen-fin-de-semana.png" className="text-sm font-semibold text-primary-dark underline underline-offset-2">Descargar imagen</a>
          </section>
        </>
      ) : <p className="rounded-3xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">No hay eventos ni actividades con hora para este fin de semana todavía.</p>}
    </div>
  )
}

export default function ResumenPage() {
  return <Suspense fallback={<div className="mx-auto h-64 max-w-3xl animate-pulse rounded-3xl bg-muted" aria-hidden />}><Digest /></Suspense>
}
