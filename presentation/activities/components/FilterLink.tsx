"use client"

import { useRef, type ComponentProps } from "react"
import { useRouter } from "next/navigation"

/**
 * Cambia un filtro del hub. Es un botón, no un `<a href>`: cada chip enlazaba a la combinación siguiente (los filtros se suman a los
 * actuales) y un rastreador de Meta recorría miles de URLs únicas (~60 000 peticiones al día, 0,1 % de aciertos de caché).
 * Sin `href` no hay nada que seguir. La URL sigue viviendo en la dirección (se comparte copiando la barra).
 * Precarga solo con intención (mouse encima, foco o toque), como `IntentLink`.
 */
export function FilterLink({ href, scroll = false, onClick, onMouseEnter, onFocus, onTouchStart, className, ...rest }: Omit<ComponentProps<"button">, "type"> & { href: string; scroll?: boolean }) {
  const router = useRouter()
  const warmed = useRef(false)
  const warm = () => { if (!warmed.current) { warmed.current = true; router.prefetch(href) } }
  return (
    <button
      {...rest}
      type="button"
      className={`cursor-pointer ${className ?? ""}`}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) router.push(href, { scroll }) }}
      onMouseEnter={(e) => { warm(); onMouseEnter?.(e) }}
      onFocus={(e) => { warm(); onFocus?.(e) }}
      onTouchStart={(e) => { warm(); onTouchStart?.(e) }}
    />
  )
}
