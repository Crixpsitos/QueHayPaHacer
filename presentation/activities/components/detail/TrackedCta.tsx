"use client"

import type { AnchorHTMLAttributes } from "react"
import { landingSource, trackActivity } from "@/app/lib/eventTrack"

/** Enlace del botón de acción de la ficha: cuenta el clic (con el canal de origen) sin demorar la navegación. */
export function TrackedCta({ activityId, onClick, ...rest }: { activityId: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        trackActivity(activityId, "cta", landingSource({ href: window.location.href, referrer: document.referrer }))
      }}
    />
  )
}
