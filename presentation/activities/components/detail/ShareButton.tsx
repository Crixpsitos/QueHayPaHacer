"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { landingSource, trackActivity } from "@/app/lib/eventTrack"

/** Compartir con la hoja nativa del celular; si no existe, copia el enlace. */
export function ShareButton({ title, activityId, className }: { title: string; activityId?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (activityId) trackActivity(activityId, "share", landingSource({ href: url, referrer: document.referrer }))
    try {
      if (navigator.share) await navigator.share({ title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* la persona canceló: no pasa nada */
    }
  }
  return (
    <Button type="button" variant="outline" size="lg" className={className ?? "h-11"} onClick={() => void share()} aria-live="polite">
      <Share2 aria-hidden /> {copied ? "Enlace copiado" : "Compartir"}
    </Button>
  )
}
