"use client"

import { useEffect, useRef, useState } from "react"
import { Bookmark, Check } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { getMyActivityEngagementAction, markActivityVisitedAction, setActivitySavedAction } from "@/app/actions/activities/engagement.action"

/**
 * Guardar (privado) y "Yo fui". La ficha se cachea por horas, así que lo de cada persona se pide aquí, tras montar.
 * Sin sesión: el primer toque lleva a iniciar sesión y vuelve a esta misma página.
 */
export function ActivityEngagement({ activityId, visitedLabel, className }: { activityId: string; visitedLabel: string | null; className?: string }) {
  const [state, setState] = useState({ saved: false, visited: false })
  const [error, setError] = useState<string | null>(null)
  const busy = useRef(false) // un toque a la vez: un doble toque rápido no debe mandar dos cambios iguales

  useEffect(() => {
    let live = true
    void getMyActivityEngagementAction(activityId).then((r) => live && setState({ saved: r.saved, visited: r.visited }))
    return () => { live = false }
  }, [activityId])

  const goLogin = () => { window.location.assign(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`) }

  const toggleSaved = async () => {
    if (busy.current) return
    busy.current = true
    const next = !state.saved
    setState((s) => ({ ...s, saved: next })) // optimista: deshacer = un toque más
    setError(null)
    const r = await setActivitySavedAction(activityId, next)
    busy.current = false
    if (!r.success) {
      setState((s) => ({ ...s, saved: !next }))
      if (r.authRequired) goLogin(); else setError(r.error)
    }
  }
  const markVisited = async () => {
    if (state.visited) return
    setState((s) => ({ ...s, visited: true }))
    setError(null)
    const r = await markActivityVisitedAction(activityId)
    if (!r.success) {
      setState((s) => ({ ...s, visited: false }))
      if (r.authRequired) goLogin(); else setError(r.error)
    }
  }

  return (
    <div className={className ?? "grid gap-2"}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={state.saved ? "default" : "outline"} size="lg" className="h-11" aria-pressed={state.saved} onClick={() => void toggleSaved()}>
          <Bookmark className={state.saved ? "fill-current" : undefined} aria-hidden /> {state.saved ? "Guardada" : "Guardar"}
        </Button>
        <Button type="button" variant={state.visited ? "default" : "outline"} size="lg" className="h-11" aria-pressed={state.visited} onClick={() => void markVisited()}>
          <Check aria-hidden /> {state.visited ? "Fuiste" : "Yo fui"}
        </Button>
      </div>
      {visitedLabel ? <p className="text-sm text-muted-foreground">{visitedLabel}</p> : null}
      {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
