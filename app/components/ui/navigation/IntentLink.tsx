"use client"

import { useRef, type ComponentProps } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

/**
 * `<Link>` que precarga solo con intención (mouse encima, foco de teclado o toque), no al entrar en pantalla.
 * En App Router `prefetch={false}` apaga todo, incluso el hover: por eso se llama a `router.prefetch` a mano.
 * Así los bots y las visitas que no tocan nada no disparan renders de servidor, pero el clic real sigue siendo casi instantáneo.
 */
export function IntentLink({ href, onMouseEnter, onFocus, onTouchStart, ...rest }: ComponentProps<typeof Link>) {
  const router = useRouter()
  const done = useRef(false)
  const warm = () => {
    if (done.current || typeof href !== "string" || !href.startsWith("/")) return
    done.current = true
    router.prefetch(href)
  }
  return (
    <Link
      {...rest}
      href={href}
      prefetch={false}
      onMouseEnter={(e) => { warm(); onMouseEnter?.(e) }}
      onFocus={(e) => { warm(); onFocus?.(e) }}
      onTouchStart={(e) => { warm(); onTouchStart?.(e) }}
    />
  )
}
export default IntentLink
