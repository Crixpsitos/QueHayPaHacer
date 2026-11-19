import { cn } from "@/app/lib/utils/cn"
import { AdUnit } from "./AdUnit"

/**
 * Espacio de publicidad adaptable (Google Ads). Apagado por defecto: no dibuja nada hasta que `NEXT_PUBLIC_ADS_ENABLED=true`.
 * «rectangle» = dentro de un listado → bloque In-feed; «banner» = franja de página → bloque Display; si Google no tiene anuncio, el espacio se oculta entero (globals.css).
 * Reglas: nunca en el primer pantallazo ni junto a Premium, verificación o botones de pagar; un solo formato por espacio.
 */
export const adsEnabled = () => process.env.NEXT_PUBLIC_ADS_ENABLED === "true"

export function AdSlot({ format = "banner", className }: { format?: "banner" | "rectangle"; className?: string }) {
  if (!adsEnabled()) return null
  return (
    <aside data-ad aria-label="Publicidad" className={cn("overflow-hidden rounded-2xl border border-border bg-card p-2.5", className)}>
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">Publicidad</span>
      <AdUnit kind={format === "rectangle" ? "feed" : "display"} />
    </aside>
  )
}

/** Fila de publicidad como en el diseño: en PC dos banners lado a lado; en móvil uno solo (banner o rectángulo). */
export function AdRow({ mobile = "banner" }: { mobile?: "banner" | "rectangle" }) {
  if (!adsEnabled()) return null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdSlot format={mobile} className={mobile === "rectangle" ? "md:h-25" : undefined} />
      <AdSlot className="hidden md:flex" />
    </div>
  )
}
