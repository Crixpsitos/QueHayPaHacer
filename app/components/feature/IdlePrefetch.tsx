"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { afterUserGesture, networkAllowsPrefetch } from "@/app/lib/userGesture"

/** Rutas públicas, cacheadas y baratas que casi todo el mundo visita después. Nunca rutas de cuenta. */
const ROUTES = ["/actividades", "/eventos", "/donde-ir"]

/** Tras el primer gesto real y un momento de calma, precarga las rutas principales (la app se siente instantánea en celular). */
export function IdlePrefetch() {
  const router = useRouter()
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const off = afterUserGesture(() => {
      if (!networkAllowsPrefetch()) return
      timer = setTimeout(() => {
        const idle = (window as Window & { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback ?? ((f: () => void) => f())
        idle(() => { for (const r of ROUTES) if (r !== window.location.pathname) router.prefetch(r) })
      }, 1500)
    })
    return () => { off(); if (timer) clearTimeout(timer) }
  }, [router])
  return null
}
