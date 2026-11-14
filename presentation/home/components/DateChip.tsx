import { cn } from "@/app/lib/utils/cn"

/** Hoja de calendario: día de la semana, número y mes. Con `solid` va en vinotinto (listas); sin él, en blanco (sobre una foto). */
export function DateChip({ wd, day, mon, solid, small, className }: { wd: string; day: string; mon: string; solid?: boolean; /** 48 px (tarjetas de los carriles) en vez de 52 px */ small?: boolean; className?: string }) {
  return (
    <span className={cn("block overflow-hidden text-center", small ? "w-12 rounded-xl" : "w-13 rounded-2xl", solid ? "bg-primary-dark text-white" : "bg-card text-wine", className)} aria-hidden>
      <span className="block pt-1.5 text-xs font-semibold leading-none">{wd}</span>
      <span className={cn("block font-heading font-bold", small ? "text-xl leading-snug" : "text-[1.375rem] leading-tight")}>{day}</span>
      <span className="block bg-brand-gold py-0.75 text-xs font-semibold leading-none text-wine">{mon}</span>
    </span>
  )
}
