"use client"

import type { RequestView } from "@/application/services/activities/ActivityRequestService"

const ago = (ms: number) => {
  const h = Math.floor((Date.now() - ms) / 3_600_000)
  if (h < 1) return "hace menos de una hora"
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Solicitudes de reserva: personas con cuenta que tocaron «reservar» o «preguntar». Quien organiza les escribe por el medio del
 * botón (WhatsApp, teléfono o enlace). No toman cupo: esto es solo la lista de a quién contactar. Pasadas 24 h salen como vencidas.
 */
export function ActivityRequests({ rows }: { rows: RequestView[] }) {
  return (
    <section aria-labelledby="solicitudes" className="mx-auto grid w-full max-w-2xl gap-3">
      <div className="grid gap-1">
        <h2 id="solicitudes" className="font-heading text-xl font-bold">Solicitudes de reserva <span className="text-base font-medium text-muted-foreground">({rows.filter((r) => r.state === "active").length} vigentes)</span></h2>
        <p className="text-sm text-muted-foreground">Quienes tocaron «reservar» con su cuenta. Contáctalos por el medio de tu botón. No ocupan cupo.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">Todavía nadie con cuenta ha tocado el botón de reservar.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={`${r.key}_${r.who}_${r.createdAt}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <span className="grid min-w-0 gap-0.5">
                <strong className="truncate font-semibold">{r.who}</strong>
                <span className="text-sm text-muted-foreground">{cap(r.label)} · <span suppressHydrationWarning>{ago(r.createdAt)}</span></span>
              </span>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${r.state === "active" ? "bg-[#E4F5E8] text-[#14532D]" : "bg-muted text-muted-foreground"}`}>{r.state === "active" ? "Vigente" : "Vencida"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
