import { CalendarDays } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

/**
 * "Con eventos": el sitio tiene agenda. Los sitios con eventos suben en el listado (ver siteRanking), así que la
 * etiqueta también le dice al dueño que le conviene. `pill` = sobre la foto de una tarjeta; `ring` = junto al título.
 * Sin estado ni sesión: se puede usar en páginas públicas cacheables.
 */
export function SiteEventsBadge({
  count,
  variant = "ring",
  className,
}: {
  count?: number | null;
  variant?: "ring" | "pill";
  className?: string;
}) {
  if (!count || count < 1) return null;
  return (
    <span
      title="Este sitio tiene eventos próximos o recientes"
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full text-[11px] font-semibold",
        variant === "pill"
          ? "bg-white px-2.5 py-1 text-xs text-[#09090B] shadow-sm"
          : "bg-rose-50 px-2 py-0.5 text-rose-900 ring-1 ring-inset ring-rose-300",
        className,
      )}
    >
      <CalendarDays className={cn("shrink-0", variant === "pill" ? "size-3.5 text-[#D42F3C]" : "size-3")} aria-hidden />
      Con eventos
    </span>
  );
}
