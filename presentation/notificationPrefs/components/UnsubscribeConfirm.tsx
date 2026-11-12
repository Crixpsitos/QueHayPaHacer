"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/app/components/ui/button/button"
import { unsubscribeFromEmailAction } from "@/app/actions/notificationPrefs/unsubscribe.action"

/** Un botón para confirmar la baja (el enlace del correo no da de baja por sí solo: lo abren antivirus y vistas previas). */
export function UnsubscribeConfirm({ uid, token }: { uid: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | { error: string }>("idle")
  const go = async () => { setState("busy"); const r = await unsubscribeFromEmailAction(uid, token); setState(r.success ? "done" : { error: r.error ?? "No se pudo." }) }
  return (
    <div className="mx-auto grid max-w-md gap-4 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
      <h1 className="font-heading text-2xl font-bold">{state === "done" ? "Listo, no te escribiremos más" : "¿Quieres dejar de recibir nuestros correos?"}</h1>
      {state === "done" ? <p className="text-sm text-muted-foreground">Quedó registrada tu baja. Si cambias de idea, puedes volver a activarlos en «Mis avisos».</p> : <p className="text-sm text-muted-foreground">Dejaremos de enviarte correos de Qué Hay Pa Hacer, incluidos los de tus reservas.</p>}
      {typeof state === "object" ? <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p> : null}
      {state === "done" ? <Button asChild className="mx-auto h-12"><Link href="/avisos">Mis avisos</Link></Button> : <Button type="button" size="lg" className="mx-auto h-12" disabled={state === "busy"} onClick={() => void go()}>{state === "busy" ? "Un momento…" : "Sí, darme de baja"}</Button>}
    </div>
  )
}
