"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/app/components/ui/button/button"
import { cn } from "@/app/lib/utils/cn"
import { setActivitySavedAction, setActivityPlanSlotAction } from "@/app/actions/activities/engagement.action"
import type { PlanSlot } from "@/domain/entities/activities/weekPlan"
import { planDateLabel, type MyPlansView } from "@/presentation/activities/lib/plansView"
import type { ActivityCardView } from "@/presentation/activities/lib/publicView"
import { NextLine } from "./NextLine"
import { WeekPlan } from "./WeekPlan"
import { RemovedReviews } from "./reviews/RemovedReviews"
import { PassportTab } from "./passport/PassportTab"

type Tab = "week" | "upcoming" | "saved" | "done" | "passport"
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function Thumb({ a }: { a: ActivityCardView }) {
  return (
    <div className="relative size-21 shrink-0 overflow-hidden rounded-xl bg-muted">
      {a.coverUrl ? <Image src={a.coverUrl} alt="" fill sizes="84px" className="object-cover" /> : null}
    </div>
  )
}

function Row({ a, children, aside }: { a: ActivityCardView; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-card p-2.5">
      <Thumb a={a} />
      <div className="grid min-w-0 flex-1 content-start gap-0.5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/actividades/${a.slug}`} className="font-heading text-base font-semibold leading-snug outline-none hover:underline focus-visible:underline">{a.title}</Link>
          {aside}
        </div>
        {children ?? <p className="text-sm text-muted-foreground">{a.hostName}</p>}
      </div>
    </li>
  )
}

function Empty({ title, text, cta }: { title: string; text: string; cta: { href: string; label: string } }) {
  return (
    <div className="grid justify-items-start gap-2 rounded-3xl border border-border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button asChild className="h-12"><Link href={cta.href}>{cta.label}</Link></Button>
    </div>
  )
}

/** «Mis planes»: lo que reservé (próximo), lo que guardé y lo que ya hice. Todo es de mi cuenta. */
export function MyPlans({ initial }: { initial: MyPlansView }) {
  const [tab, setTab] = useState<Tab>(initial.upcoming.length || initial.saved.length ? "week" : "upcoming")
  const [removed, setRemoved] = useState<string[]>([])
  const [savedGone, setSavedGone] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [slots, setSlots] = useState<Record<string, PlanSlot>>(initial.slots)
  const setSlot = async (id: string, slot: PlanSlot | null): Promise<string | null> => {
    const r = await setActivityPlanSlotAction(id, slot)
    if (!r.success) return r.error
    setSlots((p) => { const n = { ...p }; if (slot) n[id] = slot; else delete n[id]; return n })
    return null
  }

  const gone = initial.removedSaved.filter((id) => !removed.includes(id))
  const saved = initial.saved.filter((a) => !savedGone.includes(a.id))
  const unsave = async (id: string, onDone: () => void) => {
    setError(null)
    const r = await setActivitySavedAction(id, false)
    if (r.success) onDone(); else setError(r.error ?? "No se pudo quitar. Intenta de nuevo.")
  }

  const weekCards = [...initial.upcoming.map((u) => u.card), ...saved].filter((c, i, all) => all.findIndex((x) => x.id === c.id) === i)
  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "week", label: "Semana", n: weekCards.length },
    { id: "upcoming", label: "Próximo", n: initial.upcoming.length },
    { id: "saved", label: "Guardado", n: saved.length + gone.length },
    { id: "done", label: "Hecho", n: initial.done.length },
    { id: "passport", label: "Pasaporte", n: -1 },
  ]

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <h1 className="font-heading text-3xl font-bold">Mis planes</h1>
      <RemovedReviews />
      <div role="tablist" aria-label="Mis planes" className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => setTab(t.id)} className={cn("flex min-h-11 min-w-fit flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40", tab === t.id ? "bg-card shadow-subtle" : "text-muted-foreground")}>
            {t.label} {t.n >= 0 ? <span className="font-medium text-muted-foreground">{t.n}</span> : null}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="grid gap-3">
        {tab === "week" ? <WeekPlan cards={weekCards} slots={slots} onSlot={setSlot} removableIds={saved.filter((a) => !initial.upcoming.some((u) => u.card.id === a.id)).map((a) => a.id)} onRemove={(id) => void unsave(id, () => setSavedGone((x) => [...x, id]))} /> : null}
        {tab === "passport" ? <PassportTab /> : null}

        {tab === "upcoming" ? (
          initial.upcoming.length ? (
            <>
              <ul className="grid gap-3">
                {initial.upcoming.map((u) => {
                  const d = planDateLabel(u.key)
                  return (
                    <Row key={`${u.card.id}-${u.key}`} a={u.card} aside={<span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", u.status === "pending" ? "bg-accent text-[#7a5200]" : "bg-[#E4F5E8] text-[#14532D]")}>{u.status === "pending" ? "Por pagar" : "Estás dentro"}</span>}>
                      <p className="text-sm font-medium">{d ? cap(d) : u.card.scheduleText}</p>
                      <p className="text-sm text-muted-foreground">{u.card.hostName}{u.status === "pending" ? " · te escribirán por WhatsApp" : ""}</p>
                    </Row>
                  )
                })}
              </ul>
              <p className="text-xs text-muted-foreground">Solo tus reservas con salida por venir, de la más cercana a la más lejana. Abre una para cancelar.</p>
            </>
          ) : <Empty title="Todavía no tienes reservas" text="Reserva un cupo en una actividad y aparecerá aquí con su fecha." cta={{ href: "/que-hay-hoy-ibague", label: "Ver qué hay hoy" }} />
        ) : null}

        {tab === "saved" ? (
          saved.length + gone.length ? (
            <>
              <ul className="grid gap-3">
                {saved.map((a) => (
                  <Row key={a.id} a={a}>
                    <div className="text-sm font-medium"><NextLine schedule={a.schedule} scheduleText={a.scheduleText} /></div>
                    <p className="text-sm text-muted-foreground">{a.hostName} · <button type="button" onClick={() => void unsave(a.id, () => setSavedGone((x) => [...x, a.id]))} className="font-semibold text-primary-dark underline-offset-2 hover:underline">Quitar</button></p>
                  </Row>
                ))}
                {gone.map((id) => (
                  <li key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-3 text-sm text-muted-foreground">
                    <span>Una actividad guardada ya no está disponible.</span>
                    <button type="button" onClick={() => void unsave(id, () => setRemoved((x) => [...x, id]))} className="shrink-0 font-semibold text-primary-dark underline-offset-2 hover:underline">Quitar de guardados</button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Guardar es privado: solo tú ves esta lista.</p>
            </>
          ) : <Empty title="Todavía no tienes planes guardados" text="Guarda lo que te interese con el marcador de cada actividad y vuelve cuando quieras decidir." cta={{ href: "/actividades", label: "Ver actividades" }} />
        ) : null}

        {tab === "done" ? (
          initial.done.length ? (
            <ul className="grid gap-3">
              {initial.done.map((a) => <Row key={a.id} a={a}><p className="text-sm text-muted-foreground">{a.hostName}</p><p className="text-sm font-semibold text-[#14532D]">Fuiste</p></Row>)}
            </ul>
          ) : <Empty title="Aún no marcas ninguna como hecha" text="Cuando vayas a una actividad, toca «Yo fui» en su página y quedará aquí." cta={{ href: "/actividades", label: "Ver actividades" }} />
        ) : null}

        {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}
