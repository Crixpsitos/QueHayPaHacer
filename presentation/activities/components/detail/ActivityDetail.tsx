import Link from "next/link"
import { Suspense } from "react"
import { Check, Clock, ExternalLink, Gauge, Info, MapPin, Users } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { SectionsAccordion } from "@/presentation/sites/components/detail/SectionsAccordion"
import type { ActivityPageData } from "@/presentation/activities/data/fetchers"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { PublishBand } from "@/presentation/activities/components/PublishBand"
import { ActivityHero } from "./ActivityHero"
import { MoreToDo } from "./MoreToDo"
import { ComplaintInfo } from "./ComplaintInfo"
import { NextDeparture } from "./NextDeparture"
import { ShareButton } from "./ShareButton"
import { ActivityEngagement } from "./ActivityEngagement"
import { ActivityHostBadge } from "./ActivityHostBadge"
import { ActivityJoin } from "./ActivityJoin"
import { TrackedCta } from "./TrackedCta"
import { EventViewTracker } from "@/app/components/analytics/EventViewTracker"

const h2 = "font-heading text-2xl font-extrabold tracking-tight"

function Fact({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-muted/70 p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-primary-dark shadow-subtle"><Icon className="size-5" aria-hidden /></span>
      <span className="grid min-w-0 leading-tight"><span className="text-xs text-muted-foreground">{label}</span><span className="truncate font-semibold">{value}</span></span>
    </li>
  )
}

/** Ficha pública de una actividad (server component: todo lo que depende de la hora va en `NextDeparture`). */
export function ActivityDetail({ data: d, preview }: { data: ActivityPageData; preview?: string }) {
  const cat = categoryStyle(d.categorySlug)
  const facts = [
    d.duration ? { icon: Clock, label: "Dura", value: d.duration } : null,
    d.difficulty ? { icon: Gauge, label: "Dificultad", value: d.difficulty } : null,
    d.companions.length ? { icon: Users, label: "Ideal para ir", value: d.companions.join(", ") } : null,
    d.ageNote ? { icon: Info, label: "Edades", value: d.ageNote } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[]
  const reserveLabel = d.paid ? `Reservar cupo · ${d.priceFrom.replace("Desde ", "")}` : "Unirme"

  return (
    <article className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-32 pt-0 sm:px-6 sm:pt-4 lg:pb-14">
      {preview ? null : <EventViewTracker eventId={d.id} kind="activity" />}
      {preview ? <p role="status" className="mt-4 rounded-2xl border border-[#F6DDA0] bg-accent px-4 py-3 text-sm font-medium text-[#7a5200]">Vista previa: {preview}</p> : null}

      <nav aria-label="Migas de pan" className="hidden flex-wrap gap-1.5 text-sm text-muted-foreground sm:flex">
        <Link href="/" className="hover:text-foreground">Inicio</Link> / <Link href="/actividades" className="hover:text-foreground">Actividades</Link> / <span className="text-foreground">{d.title}</span>
      </nav>

      <div className="grid gap-0">
        <ActivityHero view={d} title={d.title} />

        {/* hoja que sube sobre la foto en el móvil */}
        <header className="relative -mt-9 grid gap-3 rounded-t-[2rem] bg-background px-0 pt-7 sm:mt-6 sm:rounded-none sm:pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-4" aria-hidden /> {d.categoryName}</span>
            {d.requiresReservation ? <span className="rounded-full bg-foreground px-3 py-1.5 text-[0.8125rem] font-semibold text-background">Con reserva</span> : null}
          </div>
          <h1 className="font-heading text-[2.5rem] font-extrabold leading-[1.02] tracking-tight sm:text-5xl">{d.title}</h1>
          {d.tagline ? <p className="max-w-xl text-lg leading-snug text-muted-foreground">{d.tagline}</p> : null}
        </header>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_23rem] lg:items-start lg:gap-14">
        <div className="grid gap-10">
          <div className="lg:hidden"><NextDeparture schedule={d.schedule} scheduleText={d.scheduleText} requiresReservation={d.requiresReservation} /></div>

          {facts.length ? <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Datos rápidos">{facts.map((f) => <Fact key={f.label} {...f} />)}</ul> : null}

          <section aria-labelledby="sobre" className="grid gap-3">
            <h2 id="sobre" className={h2}>Sobre la actividad</h2>
            <p className="max-w-2xl whitespace-pre-line text-[1.0625rem] leading-[1.7]">{d.description}</p>
          </section>

          <section aria-labelledby="precio" className="grid gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="precio" className={h2}>Lo que cuesta</h2>
              <span className="text-sm text-muted-foreground">{d.priceFrom}</span>
            </div>
            <ul className="grid gap-3">
              {d.prices.map((p) => (
                <li key={p.label} className="grid gap-3 rounded-3xl border border-border bg-card p-5 shadow-subtle">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-heading text-lg font-bold leading-snug">{p.label}</span>
                    <span className="shrink-0 text-right"><span className="font-heading text-2xl font-extrabold tracking-tight">{p.amountCop === 0 ? "Gratis" : p.amount}</span>{p.amountCop === 0 ? null : <span className="block text-xs text-muted-foreground">por {p.unit}</span>}</span>
                  </div>
                  {p.includes.length ? <ul className="grid gap-1.5 text-[0.9375rem]">{p.includes.map((x) => <li key={x} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-[#14532D]" aria-hidden />{x}</li>)}</ul> : null}
                  {p.note ? <p className="text-sm text-muted-foreground">{p.note}</p> : null}
                </li>
              ))}
            </ul>
            {d.extras.length ? (
              <div className="grid gap-2 rounded-2xl bg-muted/70 p-4">
                <h3 className="text-sm font-semibold">Se paga aparte</h3>
                <ul className="grid gap-1.5 text-[0.9375rem]">
                  {d.extras.map((x) => <li key={x.label} className="flex justify-between gap-3"><span>{x.label}</span><span className="font-semibold">{x.amount} <span className="text-sm font-normal text-muted-foreground">/ {x.unit}</span></span></li>)}
                </ul>
              </div>
            ) : null}
          </section>

          {d.kind === "global" ? (
            <section aria-labelledby="encuentro" className="grid gap-3">
              <h2 id="encuentro" className={h2}>Dónde nos encontramos</h2>
              <div className="flex gap-4 rounded-3xl bg-foreground p-5 text-background">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#FFB703] text-foreground"><MapPin className="size-6" aria-hidden /></span>
                <div className="grid content-center gap-0.5 leading-snug">
                  {d.meeting.note ? <p className="text-lg font-semibold">{d.meeting.note}</p> : <><p className="font-heading text-xl font-bold">{d.meeting.text}</p>{d.meeting.references ? <p className="text-sm text-background/75">{d.meeting.references}</p> : null}</>}
                </div>
              </div>
            </section>
          ) : null}

          {preview || !d.joinEnabled ? null : <ActivityJoin activityId={d.id} hostName={d.host.displayName} priceFrom={d.paid ? d.priceFrom : "Gratis"} />}

          {preview ? null : <ActivityEngagement activityId={d.id} visitedLabel={d.visitedLabel} />}

          <SectionsAccordion sections={d.sections} />

          <section aria-labelledby="organiza" className="grid gap-3">
            <h2 id="organiza" className={h2}>Quién la organiza</h2>
            <ActivityHostBadge host={d.host} site={d.site} />
          </section>
        </div>

        <aside className="hidden gap-3 lg:sticky lg:top-24 lg:grid">
          <NextDeparture schedule={d.schedule} scheduleText={d.scheduleText} requiresReservation={d.requiresReservation} />
          <div className="grid gap-2">
            {d.joinEnabled && !preview ? <Button asChild size="lg" className="h-12 text-base"><a href="#reservar">{reserveLabel}</a></Button> : null}
            {d.cta ? <Button asChild size="lg" variant={d.joinEnabled && !preview ? "outline" : "default"} className="h-12 text-base"><TrackedCta activityId={d.id} href={d.cta.href} target={d.cta.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer">{d.cta.label} {d.cta.kind === "phone" ? null : <ExternalLink aria-hidden />}</TrackedCta></Button> : null}
            <ShareButton title={d.title} activityId={d.id} className="h-11 w-full" />
          </div>
        </aside>
      </div>

      {preview ? null : (
        <Suspense fallback={null}>
          <MoreToDo id={d.id} />
        </Suspense>
      )}

      <PublishBand title="¿Tienes un plan como este?" text="Publícalo gratis y deja que la gente reserve su cupo. Se repite solo cada semana." />

      <ComplaintInfo activityId={d.id} />

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        {preview ? null : <ActivityEngagement activityId={d.id} visitedLabel={null} variant="icon" />}
        {d.joinEnabled && !preview ? <Button asChild size="lg" className="h-12 flex-1 text-base"><a href="#reservar">{reserveLabel}</a></Button> : null}
        {d.cta ? <Button asChild size="lg" variant={d.joinEnabled && !preview ? "outline" : "default"} className="h-12 flex-1 text-base"><TrackedCta activityId={d.id} href={d.cta.href} target={d.cta.kind === "phone" ? undefined : "_blank"} rel="noopener noreferrer">{d.cta.label}</TrackedCta></Button> : null}
      </div>
    </article>
  )
}
