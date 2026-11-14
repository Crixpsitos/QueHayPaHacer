import { cn } from "@/app/lib/utils/cn"

/**
 * Espacio de publicidad adaptable (Google Ads). Apagado por defecto: no dibuja nada hasta que `NEXT_PUBLIC_ADS_ENABLED=true`.
 * Reserva el alto desde el inicio para que la página no salte. Cuando exista la configuración real, aquí va el anuncio.
 * Reglas: nunca en el primer pantallazo ni junto a Premium, verificación o botones de pagar; un solo formato por espacio.
 */
export const adsEnabled = () => process.env.NEXT_PUBLIC_ADS_ENABLED === "true"

export function AdSlot({ format = "banner", className }: { format?: "banner" | "rectangle"; className?: string }) {
  if (!adsEnabled()) return null
  return (
    <aside aria-label="Publicidad" className={cn("flex flex-col justify-between rounded-2xl border border-dashed border-muted-foreground/50 bg-muted p-2.5 text-muted-foreground", format === "banner" ? "h-25" : "h-62.5", className)}>
      <span className="text-xs font-semibold">Publicidad</span>
      <span className="text-[0.8125rem]">Anuncio adaptable: ocupa todo el ancho</span>
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
