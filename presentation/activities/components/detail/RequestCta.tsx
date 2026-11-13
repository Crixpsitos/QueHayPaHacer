"use client"

import { useEffect, useState, type AnchorHTMLAttributes } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { cn } from "@/app/lib/utils/cn"
import { useAuth } from "@/app/store/auth/AuthContext"
import { landingSource, trackActivity } from "@/app/lib/eventTrack"
import { getRequestOptionsAction, requestActivityAction } from "@/app/actions/activities/request.action"
import type { RequestOptions } from "@/application/services/activities/ActivityRequestService"
import { buildReservationMessage, reservationWhatsappHref, type ExtraPick } from "@/domain/entities/activities/reservationExtras"
import { ExtrasPicker } from "../ExtrasPicker"

type Props = { activityId: string; kind: string; title: string } & AnchorHTMLAttributes<HTMLAnchorElement>

/**
 * Botón de reservar o preguntar (WhatsApp, teléfono o enlace de reserva) de una actividad SIN «Unirme».
 * Sin cuenta: avisa que conviene iniciar sesión para guardar los datos de la reserva; «Ahora no» sigue al botón como siempre.
 * Con cuenta: deja constancia para quien organiza (quién eres, qué salida) y sigue al botón; si hay varias salidas, pregunta cuál.
 * Lo de cada persona se pide aquí tras montar: la ficha se cachea por horas.
 */
export function RequestCta({ activityId, kind, title, onClick, children, className, ...rest }: Props) {
  const { user, isHydrating } = useAuth()
  const [options, setOptions] = useState<RequestOptions | null>(null)
  const [dialog, setDialog] = useState<"login" | "day" | "extras" | null>(null)
  const [day, setDay] = useState<string>("")
  const [picks, setPicks] = useState<ExtraPick[]>([])

  // Con sesión se traen las salidas ya, para que el toque abra el botón sin esperar (si no, el navegador bloquea la pestaña nueva).
  useEffect(() => {
    if (!user) return
    let live = true
    void getRequestOptionsAction(activityId).then((o) => live && (setOptions(o), setDay(o.departures[0]?.key ?? "")))
    return () => { live = false }
  }, [user, activityId])

  const href = (rest.href as string) ?? "#"
  const go = () => { if (kind === "phone") window.location.href = href; else window.open(href, "_blank", "noopener,noreferrer") }
  const deps = options?.departures ?? []
  const extras = options?.extras ?? []
  /** Deja constancia y abre el botón; si es WhatsApp, con el mensaje ya escrito (día y servicios). */
  const finish = (key: string, chosen: ExtraPick[]) => {
    const date = !key || key === "open" ? null : key
    void requestActivityAction(activityId, date, chosen).catch(() => undefined)
    const label = date ? (deps.find((d) => d.key === key)?.label ?? null) : null
    const msg = buildReservationMessage({ activityTitle: title, activityUrl: window.location.origin + window.location.pathname, dateLabel: label, extras: chosen, paid: false })
    const wa = kind === "whatsapp" ? reservationWhatsappHref(href, msg) : null
    setDialog(null)
    if (wa) window.open(wa, "_blank", "noopener,noreferrer"); else go()
  }
  const next = () => (extras.length ? setDialog("extras") : finish(day, []))

  const click = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    trackActivity(activityId, "cta", landingSource({ href: window.location.href, referrer: document.referrer }))
    e.preventDefault()
    if (isHydrating) return go()
    if (!user) return setDialog("login")
    // si las salidas aún no llegaron (primer toque muy rápido) también se abre el diálogo: así el botón siempre se abre con un toque real
    if (!options || deps.length > 1) return setDialog("day")
    if (extras.length) return setDialog("extras")
    finish(deps[0]?.key ?? "", [])
  }

  const chip = (on: boolean) => cn("min-h-12 rounded-2xl border px-4 text-left text-sm font-semibold capitalize outline-none focus-visible:ring-3 focus-visible:ring-ring/40", on ? "border-primary-dark bg-primary-light text-primary-dark" : "border-border bg-card")

  return (
    <>
      <a {...rest} className={className} onClick={click}>{children}</a>
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog === "login" ? (
            <>
              <DialogHeader>
                <DialogTitle>Reserva con tu cuenta</DialogTitle>
                <DialogDescription>Te recomendamos iniciar sesión para guardar tus datos en la reserva: así quien organiza sabe quién eres y para qué día. Si prefieres, sigue sin cuenta.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <a href={`/login?redirect_to=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white">Iniciar sesión</a>
                <button type="button" onClick={() => { setDialog(null); go() }} className="min-h-12 rounded-full border border-border px-5 text-sm font-semibold">Ahora no</button>
              </div>
            </>
          ) : dialog === "day" ? (
            <>
              <DialogHeader>
                <DialogTitle>¿Para qué día quieres reservar?</DialogTitle>
                <DialogDescription>Quien organiza verá tu nombre y el día que elijas, y te contactará por el medio del botón.</DialogDescription>
              </DialogHeader>
              {!options ? <p role="status" className="text-sm text-muted-foreground">Cargando los días…</p> : null}
              <div role="radiogroup" aria-label="Día" className="grid gap-2">
                {deps.map((o) => <button key={o.key} type="button" role="radio" aria-checked={day === o.key} onClick={() => setDay(o.key)} className={chip(day === o.key)}>{o.label}</button>)}
              </div>
              <button type="button" disabled={!options} onClick={next} className="inline-flex min-h-12 disabled:opacity-50 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white">Continuar</button>
            </>
          ) : dialog === "extras" ? (
            <>
              <DialogHeader>
                <DialogTitle>¿Quieres agregar algo más?</DialogTitle>
                <DialogDescription>Servicios que se pagan aparte. Los incluimos en el mensaje para que quien organiza los tenga listos.</DialogDescription>
              </DialogHeader>
              <ExtrasPicker offered={extras} value={picks} onChange={setPicks} />
              <button type="button" onClick={() => finish(day, picks)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-semibold text-white">{picks.length ? "Continuar con mi pedido" : "Continuar sin agregar"}</button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
