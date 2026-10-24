import Link from "next/link"
import { CalendarPlus } from "lucide-react"
import { cn } from "@/app/lib/utils/cn"

/** Lleva al asistente de eventos con este sitio ya elegido (el paso de ubicación lee `?siteId=`). */
const href = (siteId: string) => `/eventos/create?siteId=${encodeURIComponent(siteId)}`

/**
 * Empujón para que el dueño programe eventos en su sitio: los sitios con eventos suben en el listado (siteRanking).
 * `compact` = enlace pequeño de la tarjeta; `banner` = bloque del detalle con la razón.
 */
export function CreateEventHere({ siteId, variant = "compact", hasEvents = false }: { siteId: string; variant?: "compact" | "banner"; hasEvents?: boolean }) {
  if (variant === "compact") {
    return (
      <Link
        href={href(siteId)}
        onClick={(e) => e.stopPropagation()}
        className="mt-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#E4E4E7] px-3 text-xs font-medium text-[#3F3F46] transition-colors hover:border-[#E63946]/30 hover:text-[#E63946]"
      >
        <CalendarPlus className="size-3.5" aria-hidden />
        Crear evento aquí
      </Link>
    )
  }
  return (
    <section className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E63946]/20 bg-[#FDF2F4] p-3.5")}>
      <p className="max-w-md text-sm text-[#52525B]">
        <span className="font-semibold text-[#09090B]">{hasEvents ? "Suma otro evento." : "Todavía no hay eventos aquí."}</span>{" "}
        Los sitios con eventos suben en el listado y se ven más.
      </p>
      <Link
        href={href(siteId)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#E63946] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#9B0A26]"
      >
        <CalendarPlus className="size-4" aria-hidden />
        Crear evento aquí
      </Link>
    </section>
  )
}
