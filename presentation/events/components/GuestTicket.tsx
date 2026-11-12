"use client"

import { QRCodeSVG } from "qrcode.react"
import { CalendarDays, MapPin } from "lucide-react"

/** La entrada: QR grande (para escanear desde el celular), el código por si no hay cámara, y cuándo y dónde es. */
export function GuestTicket({ name, eventTitle, when, place, payload, code }: { name: string; eventTitle: string; when: string; place: string; payload: string; code: string }) {
  return (
    <section aria-label="Tu entrada" className="mx-auto grid w-full max-w-sm gap-5 overflow-hidden rounded-[2rem] border border-border bg-card shadow-card">
      <div className="grid gap-1 bg-primary-dark px-6 pb-6 pt-7 text-white">
        <p className="text-sm font-medium text-white/75">Entrada para</p>
        <h1 className="font-heading text-2xl font-extrabold leading-tight">{name}</h1>
      </div>
      <div className="grid justify-items-center gap-3 px-6">
        <div className="rounded-2xl border border-border bg-white p-4"><QRCodeSVG value={payload} size={220} level="M" marginSize={0} aria-label="Código QR de tu entrada" /></div>
        <p className="font-mono text-lg font-semibold tracking-widest">{code}</p>
        <p className="text-center text-sm text-muted-foreground">Muéstralo al llegar. Si no se puede escanear, dicta el código.</p>
      </div>
      <div className="grid gap-2 border-t border-border px-6 pb-6 pt-4 text-sm">
        <p className="font-heading text-lg font-bold leading-snug">{eventTitle}</p>
        <p className="flex items-start gap-2 text-muted-foreground"><CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />{when}</p>
        {place ? <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />{place}</p> : null}
      </div>
    </section>
  )
}
