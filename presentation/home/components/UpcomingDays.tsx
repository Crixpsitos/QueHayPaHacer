import Link from "@/app/components/ui/navigation/IntentLink"
import type { UpcomingView } from "../lib/buildHomeView"
import { DateChip } from "./DateChip"

/** «Lo que viene»: los próximos días con eventos y saltos a los meses siguientes. No se dibuja si no hay nada próximo. */
export function UpcomingDays({ up }: { up: UpcomingView }) {
  if (!up.days.length && !up.months.length) return null
  return (
    <section aria-labelledby="lo-que-viene" className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="lo-que-viene" className="font-heading text-xl font-bold sm:text-2xl">Lo que viene</h2>
        <Link href="/eventos" className="flex min-h-11 items-center text-sm font-semibold text-primary-dark underline-offset-2 hover:underline">Ver los {up.total}</Link>
      </div>
      <p className="mb-2 text-sm text-muted-foreground lg:hidden">Los próximos eventos, día por día.</p>
      <ul>
        {up.days.map((d) => (
          <li key={d.date} className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 border-t border-border py-3">
            <DateChip wd={d.wd} day={d.day} mon={d.mon} solid className="self-start" />
            <div className="flex flex-col gap-1">
              {d.items.map((e) => (
                <Link key={e.key} href={e.href} className="block min-h-11 py-0.5 outline-none lg:min-h-0 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  <span className="block text-[0.9375rem] font-semibold leading-snug">{e.title}</span>
                  <span className="block text-[0.8125rem] text-muted-foreground">{e.meta}</span>
                </Link>
              ))}
              {d.more ? <Link href="/eventos" className="flex min-h-8 items-center lg:min-h-0 text-[0.8125rem] font-semibold text-primary-dark hover:underline">{d.more}</Link> : null}
            </div>
          </li>
        ))}
      </ul>
      {up.months.length ? (
        <ul className="flex gap-2 pt-1">
          {up.months.slice(0, 3).map((m) => (
            <li key={m.label} className="flex-1">
              <Link href="/eventos" className="flex min-h-14 flex-col items-center justify-center rounded-2xl border border-border bg-background px-1 text-center text-sm font-semibold hover:bg-muted">
                {m.label}
                <span className="text-[0.8125rem] font-medium text-primary-dark">{m.count} {m.count === 1 ? "evento" : "eventos"}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
