"use client"

import Link from "next/link"
import { useState } from "react"
import { Stamp } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { collectStampAction } from "@/app/actions/activities/stamp.action"
import { STAMPS_FOR_BADGE } from "@/domain/entities/activities/passport"

/** «Sellar mi pasaporte»: confirma que estás en el local. Un sello por actividad; con 3 distintos llega la insignia. */
export function CollectStamp({ activityId, token, title, slug }: { activityId: string; token: string; title: string | null; slug: string | null }) {
  const [state, setState] = useState<{ ok: true; total: number } | { ok: false; error: string } | null>(null)
  const [busy, setBusy] = useState(false)
  if (!title) return <div className="mx-auto grid max-w-md gap-3 rounded-3xl border border-border bg-card p-6 text-center"><h1 className="font-heading text-2xl font-bold">Este código no es válido</h1><p className="text-sm text-muted-foreground">Pide el QR actualizado al lugar o mira las actividades de Ibagué.</p><Button asChild className="mx-auto h-12"><Link href="/actividades">Ver actividades</Link></Button></div>
  const stamp = async () => {
    setBusy(true)
    const r = await collectStampAction(activityId, token)
    setBusy(false)
    setState(r.success ? { ok: true, total: r.total } : { ok: false, error: r.error })
  }
  return (
    <div className="mx-auto grid max-w-md gap-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
      <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary-dark text-white"><Stamp className="size-8" aria-hidden /></span>
      <h1 className="font-heading text-2xl font-bold">{title}</h1>
      {state?.ok ? (
        <>
          <p role="status" className="font-semibold text-primary-dark">¡Sello conseguido! Llevas {state.total} {state.total === 1 ? "sello" : "sellos"}.</p>
          <p className="text-sm text-muted-foreground">{state.total >= STAMPS_FOR_BADGE ? "Ya tienes la insignia «Pasaporte de Ibagué»." : `Con ${STAMPS_FOR_BADGE} sellos distintos ganas la insignia «Pasaporte de Ibagué».`}</p>
          <Button asChild className="mx-auto h-12"><Link href="/mis-planes">Ver mi pasaporte</Link></Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Confirma que estás aquí para sellar tu pasaporte. Cuenta como visita verificada y marca «Yo fui».</p>
          {state && !state.ok ? <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p> : null}
          <Button type="button" size="lg" className="mx-auto h-12" disabled={busy} onClick={() => void stamp()}>{busy ? "Sellando…" : "Sellar mi pasaporte"}</Button>
          {slug ? <Link href={`/actividades/${slug}`} className="text-sm font-semibold text-primary-dark underline">Ver la actividad</Link> : null}
        </>
      )}
    </div>
  )
}
