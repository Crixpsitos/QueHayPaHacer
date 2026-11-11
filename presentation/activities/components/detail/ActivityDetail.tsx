import Link from "next/link"
import { ExternalLink, MapPin } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { SectionsAccordion } from "@/presentation/sites/components/detail/SectionsAccordion"
import type { ActivityPageData } from "@/presentation/activities/data/fetchers"
import { ActivityGallery } from "./ActivityGallery"
import { ComplaintInfo } from "./ComplaintInfo"
import { NextDeparture } from "./NextDeparture"
import { ShareButton } from "./ShareButton"
import { ActivityEngagement } from "./ActivityEngagement"
import { ActivityJoin } from "./ActivityJoin"
import { TrackedCta } from "./TrackedCta"
import { EventViewTracker } from "@/app/components/analytics/EventViewTracker"

const chip = "inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium"
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")

/** Ficha pública de una actividad (server component: todo lo que depende de la hora va en `NextDeparture`). */
export function ActivityDetail({ data: d, preview }: { data: ActivityPageData; preview?: string }) {
  const chips = [d.difficulty, d.duration, ...d.companions, d.ageNote || null].filter(Boolean) as string[]
  return (
    <article className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-32 pt-4 sm:px-6 lg:pb-12">
      {preview ? null : <EventViewTracker eventId={d.id} kind="activity" />}
      {preview ? <p role="status" className="rounded-2xl border border-[#F6DDA0] bg-accent px-4 py-3 text-sm font-medium text-[#7a5200]">Vista previa: {preview}</p> : null}

      <nav aria-label="Migas de pan" className="flex flex-wrap gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link> / <Link href="/actividades" className="hover:text-foreground">Actividades</Link> / <span className="text-foreground">{d.title}</span>
      </nav>

      <ActivityGallery view={d} />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-12">
        <div className="grid gap-7">
          <header className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">{d.categoryName}</span>
              {d.requiresReservation ? <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Con reserva</span> : null}
            </div>
            <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">{d.title}</h1>
            {d.tagline ? <p className="text-lg text-muted-foreground">{d.tagline}</p> : null}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid size-10 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary-dark" aria-hidden>{initials(d.host.displayName)}</span>
              <span>Organiza <strong className="font-semibold text-foreground">{d.host.displayName}</strong>{d.site ? <> · en <Link href={`/donde-ir/${d.site.slug}`} className="font-semibold text-foreground underline underline-offset-4">{d.site.name}</Link></> : null}</span>
            </div>
          </header>

          <div className="lg:hidden"><NextDeparture schedule={d.schedule} scheduleText={d.scheduleText} requiresReservation={d.requiresReservation} /></div>

          <section aria-labelledby="precio" className="grid gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="precio" className="font-heading text-xl font-semibold">Precio</h2>
              <span className="text-sm text-muted-foreground">{d.priceFrom}</span>
            </div>
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {d.prices.map((p) => (
                <li key={p.label} className="grid gap-1.5 border-b border-muted p-4 last:border-0">
                  <div className="flex justify-between gap-3 font-semibold"><span>{p.label}</span><span>{p.amount} <span className="text-sm font-normal text-muted-foreground">/ {p.unit}</span></span></div>
                  {p.includes.length ? <ul className="flex flex-wrap gap-1.5">{p.includes.map((x) => <li key={x} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{x}</li>)}</ul> : null}
                  {p.note ? <p className="text-sm text-muted-foreground">{p.note}</p> : null}
                </li>
              ))}
            </ul>
            {d.extras.length ? (
              <div className="grid gap-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">EXTRAS</h3>
                <ul className="grid gap-1.5 text-[0.95rem]">
                  {d.extras.map((x) => <li key={x.label} className="flex justify-between gap-3"><span>{x.label}</span><span className="font-semibold">{x.amount} <span className="text-sm font-normal text-muted-foreground">/ {x.unit}</span></span></li>)}
                </ul>
              </div>
            ) : null}
          </section>

          {d.kind === "global" ? (
            <section aria-labelledby="encuentro" className="flex gap-3 rounded-2xl border border-dashed border-border bg-card p-4">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary-dark" aria-hidden />
              <div className="grid gap-0.5 text-sm leading-relaxed">
                <h2 id="encuentro" className="font-semibold">Punto de encuentro</h2>
                {d.meeting.note ? <p>{d.meeting.note}</p> : <p>{d.meeting.text}{d.meeting.references ? <span className="text-muted-foreground"> · {d.meeting.references}</span> : null}</p>}
              </div>
            </section>
          ) : null}

          {chips.length ? <ul className="flex flex-wrap gap-2">{chips.map((c) => <li key={c} className={chip}>{c}</li>)}</ul> : null}

          <section aria-labelledby="sobre" className="grid gap-2">
            <h2 id="sobre" className="font-heading text-xl font-semibold">Sobre la actividad</h2>
            <p className="max-w-2xl whitespace-pre-line text-base leading-relaxed">{d.description}</p>
          </section>

          {preview || !d.joinEnabled ? null : <ActivityJoin activityId={d.id} hostName={d.host.displayName} priceFrom={d.paid ? d.priceFrom : "Gratis"} />}

          {preview ? null : <ActivityEngagement activityId={d.id} visitedLabel={d.visitedLabel} />}

          <SectionsAccordion sections={d.sections} />
          <ComplaintInfo activityId={d.id} />
        </div>

        <aside className="hidden gap-3 lg:sticky lg:top-24 lg:grid">
          <NextDeparture schedule={d.schedule} scheduleText={d.scheduleText} requiresReservation={d.requiresReservation} />
          <div className="grid gap-2">
            {d.cta ? <Button asChild size="lg" className="h-12 text-base"><TrackedCta activityId={d.id} href={d.cta.href} target={d.cta.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer">{d.cta.label} {d.cta.kind === "phone" ? null : <ExternalLink aria-hidden />}</TrackedCta></Button> : null}
            <ShareButton title={d.title} activityId={d.id} className="h-11 w-full" />
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <ShareButton title={d.title} activityId={d.id} className="h-12 shrink-0" />
        {d.joinEnabled && !preview ? <Button asChild size="lg" className="h-12 flex-1 text-base"><a href="#reservar">{d.paid ? `Reservar cupo · ${d.priceFrom.replace("Desde ", "")}` : "Unirme"}</a></Button> : null}
        {d.cta ? <Button asChild size="lg" variant={d.joinEnabled && !preview ? "outline" : "default"} className="h-12 flex-1 text-base"><TrackedCta activityId={d.id} href={d.cta.href} target={d.cta.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer">{d.cta.label}</TrackedCta></Button> : null}
      </div>
    </article>
  )
}
