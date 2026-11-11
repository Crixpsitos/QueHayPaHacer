import Link from "next/link"
import type { UrlFilters } from "@/domain/entities/activities/filters"
import type { HubMeta } from "@/presentation/activities/data/fetchers"
import { filterHref } from "@/presentation/activities/lib/filterHref"
import { cn } from "@/app/lib/utils/cn"

const WD = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const dayParts = (iso: string) => ({ wd: WD[new Date(`${iso}T12:00:00Z`).getUTCDay()], n: Number(iso.slice(8)) })

const ghost = "inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white outline-none transition-colors hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[#FFB703]/70"
const ghostOn = "border-transparent bg-white text-foreground hover:bg-white"

/**
 * Cabecera del hub: «La semana en Ibagué». Los siete días son el filtro de «cuándo»: cada uno dice cuántas actividades
 * salen ese día y, al tocarlo, el hub se vuelve una agenda por horas. Tinta oscura con el dorado en el día elegido.
 */
export function HubHero({ current, meta }: { current: UrlFilters; meta: HubMeta }) {
  const selected = current.day ?? (current.when === "hoy" ? meta.days[0]?.date : undefined)
  const toggle = <K extends "when" | "budget" | "companion">(key: K, value: NonNullable<UrlFilters[K]>) => filterHref(current, { [key]: current[key] === value ? undefined : value })
  return (
    <header className="-mx-4 rounded-b-[2rem] bg-primary-dark px-4 pb-6 pt-8 text-white sm:mx-0 sm:rounded-[2rem] sm:px-8 sm:pb-8 sm:pt-10">
      <div className="grid gap-5">
        <div className="grid gap-2">
          <h1 className="font-heading text-[2.25rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl">La semana en Ibagué</h1>
          <p className="max-w-lg text-base leading-relaxed text-white/75">Lo que se repite cada semana: caminatas, clubes, talleres y planes en sitios. Elige un día, mueve la hora en el mapa y mira qué hay.</p>
        </div>
        <nav aria-label="Días de la semana" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {meta.days.map((d, i) => {
            const { wd, n } = dayParts(d.date)
            const on = selected === d.date
            return (
              <Link key={d.date} href={on ? filterHref(current, { day: undefined, when: undefined }) : filterHref(current, { day: d.date })} scroll={false} aria-current={on ? "date" : undefined} aria-label={`${i === 0 ? "Hoy, " : ""}${wd} ${n}: ${d.count} ${d.count === 1 ? "actividad" : "actividades"}`}
                className={cn("flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-[1.25rem] border-[1.5px] px-1 pb-3 pt-2.5 outline-none transition-colors focus-visible:ring-3 focus-visible:ring-[#FFB703]/70 sm:w-20", on ? "border-[#FFB703] bg-[#FFB703] text-[#5C0011]" : "border-white/15 bg-white/6 text-white hover:bg-white/12")}>
                <span className={cn("text-xs font-medium", on ? "text-foreground/80" : "text-white/70")}>{i === 0 ? "Hoy" : wd}</span>
                <span className="font-heading text-[1.75rem] font-bold leading-none">{n}</span>
                <span className={cn("mt-1.5 grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold", on ? "bg-primary-dark text-[#FFB703]" : "bg-white/15")}>{d.count}</span>
              </Link>
            )
          })}
        </nav>
        <div className="flex flex-wrap gap-2">
          <Link href={toggle("when", "este-fin-de-semana")} scroll={false} aria-current={current.when === "este-fin-de-semana" ? "true" : undefined} className={cn(ghost, current.when === "este-fin-de-semana" && ghostOn)}>Este fin de semana</Link>
          <Link href={toggle("when", "esta-semana")} scroll={false} aria-current={current.when === "esta-semana" ? "true" : undefined} className={cn(ghost, current.when === "esta-semana" && ghostOn)}>Toda la semana</Link>
          <Link href={toggle("budget", "gratis")} scroll={false} aria-current={current.budget === "gratis" ? "true" : undefined} className={cn(ghost, current.budget === "gratis" && ghostOn)}>Gratis</Link>
          <Link href={toggle("companion", "familia")} scroll={false} aria-current={current.companion === "familia" ? "true" : undefined} className={cn(ghost, current.companion === "familia" && ghostOn)}>En familia</Link>
        </div>
      </div>
    </header>
  )
}
