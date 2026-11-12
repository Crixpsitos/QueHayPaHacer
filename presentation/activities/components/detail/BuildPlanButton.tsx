"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { setActivitySavedAction } from "@/app/actions/activities/engagement.action"

/** «Armar plan»: guarda esta actividad y las cercanas y te lleva a tu semana, donde se ven por día y hora y con los cruces marcados. */
export function BuildPlanButton({ ids }: { ids: string[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const go = async () => {
    setBusy(true); setError(null)
    for (const id of ids) {
      const r = await setActivitySavedAction(id, true)
      if (!r.success) {
        setBusy(false)
        if (r.authRequired) return window.location.assign(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
        return setError(r.error)
      }
    }
    router.push("/mis-planes")
  }
  return (
    <div className="grid justify-items-start gap-1">
      <Button type="button" variant="outline" size="lg" className="h-12" disabled={busy} onClick={() => void go()}><CalendarPlus aria-hidden /> {busy ? "Guardando…" : `Armar plan con estas ${ids.length}`}</Button>
      {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
