"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Share2, Users } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { setActivityActiveAction } from "@/app/actions/activities/set-activity-active.action"
import { cn } from "@/app/lib/utils/cn"
import { ShareKit } from "@/presentation/shared/components/ShareKit"
import type { MyActivitySummary, StatusKey } from "@/presentation/activities/lib/activityStatus"

const CHIP: Record<StatusKey, string> = {
  draft: "bg-muted text-foreground",
  review: "bg-accent text-[#7a5200]",
  rejected: "bg-destructive/10 text-destructive",
  live: "bg-[#E4F5E8] text-[#14532D]",
  paused: "bg-secondary text-foreground",
}

function Row({ a }: { a: MyActivitySummary }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kit, setKit] = useState(false)

  const toggle = async () => {
    setBusy(true)
    setError(null)
    const r = await setActivityActiveAction(a.id, !a.isActive)
    setBusy(false)
    if (!r.success) return setError(r.error)
    router.refresh()
  }

  return (
    <li className="grid gap-3 rounded-3xl border border-border bg-card p-3 shadow-card sm:grid-cols-[9rem_1fr] sm:p-4">
      <div className="aspect-video overflow-hidden rounded-2xl bg-muted sm:aspect-square">
        {a.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- portada propia en Storage (miniatura optimizada)
          <img src={a.coverUrl} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="grid content-start gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-heading text-lg font-semibold leading-tight">{a.title}</h2>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", CHIP[a.status.key])}>{a.status.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{a.schedule}</p>
        <p className="text-sm">{a.status.help}</p>
        {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild variant="outline" size="lg" className="h-11"><Link href={`/actividades/${a.id}/editar`}><Pencil aria-hidden /> Editar</Link></Button>
          {a.joinEnabled ? <Button asChild variant="ghost" size="lg" className="h-11"><Link href={`/actividades/${a.id}/inscritos`}><Users aria-hidden /> Reservas</Link></Button> : null}
          {a.status.key !== "draft" ? <Button asChild variant="ghost" size="lg" className="h-11"><Link href={`/actividades/${a.slug}`}>{a.status.key === "live" ? "Ver" : "Vista previa"}</Link></Button> : null}
          {a.status.key === "live" || a.status.key === "review" ? <Button type="button" variant="ghost" size="lg" className="h-11" onClick={() => setKit(true)}><Share2 aria-hidden /> Compartir</Button> : null}
          {a.canToggleActive ? <Button type="button" variant="ghost" size="lg" className="h-11" disabled={busy} onClick={() => void toggle()}>{a.isActive ? "Pausar" : "Reactivar"}</Button> : null}
        </div>
      </div>
      {kit ? <ShareKit open kind="activity" id={a.id} title={a.title} where={a.schedule} imageUrl={a.coverUrl ?? undefined} pendingReview={a.status.key === "review"} onClose={() => setKit(false)} /> : null}
    </li>
  )
}

/** "Mis actividades": todas las de la cuenta con su estado y las acciones que corresponden. */
export function MyActivities({ items }: { items: MyActivitySummary[] }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Mis actividades</h1>
        <Button asChild size="lg" className="h-11"><Link href="/actividades/crear"><Plus aria-hidden /> Crear actividad</Link></Button>
      </div>
      {items.length ? (
        <ul className="grid gap-4">{items.map((a) => <Row key={a.id} a={a} />)}</ul>
      ) : (
        <div className="grid gap-3 rounded-3xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-heading text-xl font-semibold">Aún no tienes actividades</h2>
          <p className="text-sm text-muted-foreground">Una actividad es algo que se hace en Ibagué: una caminata los domingos, un club de lectura, tomar helado en tu local. Publícala gratis.</p>
          <Button asChild size="lg" className="mx-auto h-12"><Link href="/actividades/crear">Crear mi primera actividad</Link></Button>
        </div>
      )}
    </div>
  )
}
