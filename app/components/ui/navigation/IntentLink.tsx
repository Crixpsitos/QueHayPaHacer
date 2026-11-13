"use client"

import { useCallback, useEffect, useRef, type ComponentProps } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { afterUserGesture, networkAllowsPrefetch } from "@/app/lib/userGesture"

const DWELL_MS = 300

/**
 * `<Link>` que precarga solo con intención (mouse encima, foco de teclado o toque), no al entrar en pantalla.
 * En App Router `prefetch={false}` apaga todo, incluso el hover: por eso se llama a `router.prefetch` a mano.
 * `warmOnView`: además precarga cuando el enlace lleva ~300 ms visible, pero solo después del primer gesto real de la persona
 * (en celular no hay hover) y sin ahorro de datos. Úsalo en tarjetas de listados públicos, nunca en rutas de cuenta.
 */
export function IntentLink({ href, warmOnView, onMouseEnter, onFocus, onTouchStart, ...rest }: ComponentProps<typeof Link> & { warmOnView?: boolean }) {
  const router = useRouter()
  const done = useRef(false)
  const el = useRef<HTMLAnchorElement | null>(null)
  const warm = useCallback(() => {
    if (done.current || typeof href !== "string" || !href.startsWith("/")) return
    done.current = true
    router.prefetch(href)
  }, [href, router])

  useEffect(() => {
    const node = el.current
    if (!warmOnView || !node || typeof IntersectionObserver === "undefined") return
    let timer: ReturnType<typeof setTimeout> | undefined
    let off: (() => void) | undefined
    const io = new IntersectionObserver(([entry]) => {
      off?.(); if (timer) clearTimeout(timer)
      if (!entry.isIntersecting) return
      off = afterUserGesture(() => { timer = setTimeout(() => { if (networkAllowsPrefetch()) warm() }, DWELL_MS) })
    }, { threshold: 0.6 })
    io.observe(node)
    return () => { io.disconnect(); off?.(); if (timer) clearTimeout(timer) }
  }, [warmOnView, warm])

  const { ref: outer, ...others } = rest as typeof rest & { ref?: React.Ref<HTMLAnchorElement> }
  return (
    <Link
      {...others}
      ref={(n) => { el.current = n; if (typeof outer === "function") outer(n); else if (outer) (outer as React.MutableRefObject<HTMLAnchorElement | null>).current = n }}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { warm(); onMouseEnter?.(e) }}
      onFocus={(e) => { warm(); onFocus?.(e) }}
      onTouchStart={(e) => { warm(); onTouchStart?.(e) }}
    />
  )
}
export default IntentLink
