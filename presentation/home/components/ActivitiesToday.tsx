import Link from "@/app/components/ui/navigation/IntentLink"
import type { HomeView } from "../lib/buildHomeView"

/** Actividades de hoy (o de la semana si hoy no hay) en un panel vinotinto. No se dibuja vacío. */
export function ActivitiesToday({ title, items }: { title: HomeView["activitiesTitle"]; items: HomeView["activities"] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="actividades-hoy" className="rounded-3xl bg-primary-dark px-4 pb-2 pt-4 text-white sm:px-6 sm:pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="actividades-hoy" className="font-heading text-xl font-bold sm:text-2xl">{title}</h2>
        <Link href="/actividades?cuando=esta-semana" className="flex min-h-11 items-center text-sm font-semibold text-brand-gold underline-offset-2 hover:underline">Ver la semana</Link>
      </div>
      <ul>
        {items.map((a) => (
          <li key={a.key} className="border-t border-white/20">
            <Link href={a.href} className="grid min-h-16 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 py-2 outline-none hover:bg-white/5 focus-visible:ring-3 focus-visible:ring-white/60 sm:grid-cols-[6rem_minmax(0,1fr)]">
              <span className="whitespace-nowrap font-heading text-base font-bold text-brand-gold sm:text-[1.0625rem]">{a.time}</span>
              <span>
                <span className="block text-[0.9375rem] font-semibold leading-snug">{a.title}</span>
                <span className="block text-[0.8125rem] text-white/85">{a.meta}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
