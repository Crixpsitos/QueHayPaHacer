import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import { ArrowRight } from "lucide-react"
import { fetchFeaturedPlan } from "@/presentation/activities/data/fetchers"
import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"
import { NextLine } from "@/presentation/activities/components/NextLine"

/**
 * «El plan de la semana»: una actividad con foto grande al empezar el hub. Cambia cada día y solo sale sin filtros.
 * Sin foto, la portada de color de su categoría ocupa el lugar. No se dibuja si no hay actividades.
 */
export async function FeaturedPlan() {
  const a = await fetchFeaturedPlan()
  if (!a) return null
  const cat = categoryStyle(a.categorySlug)
  const price = a.priceFrom.startsWith("Desde") ? a.priceFrom.slice(6) : a.priceFrom
  return (
    <section aria-labelledby="destacado" className="grid gap-3">
      <h2 id="destacado" className="font-heading text-2xl font-extrabold tracking-tight">El plan de la semana</h2>
      <Link prefetch={false} href={`/actividades/${a.slug}`} className="group grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-card outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/40 hover:shadow-lg md:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-4/3 overflow-hidden md:aspect-auto md:min-h-72" style={a.coverUrl ? undefined : { background: cat.bg, color: cat.ink }}>
          {a.coverUrl ? <Image src={a.coverUrl} alt={a.coverAlt} fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" /> : <cat.Icon className="absolute right-6 top-6 size-40 opacity-15" strokeWidth={1.25} aria-hidden />}
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold shadow-subtle" style={{ background: cat.bg, color: cat.ink }}><cat.Icon className="size-4" aria-hidden /> {a.categoryName}</span>
          <span className="absolute bottom-4 right-4 rounded-xl bg-[#FFB703] px-3 py-1.5 text-sm font-bold text-[#5C0011] shadow-subtle">{price}</span>
        </div>
        <div className="grid content-center gap-2 p-5 sm:p-7">
          <h3 className="font-heading text-[1.75rem] font-extrabold leading-[1.1] tracking-tight sm:text-3xl">{a.title}</h3>
          <p className="text-sm text-muted-foreground">{a.hostName}</p>
          <div className="text-[0.9375rem] font-medium"><NextLine schedule={a.schedule} scheduleText={a.scheduleText} /></div>
          <span className="mt-2 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-primary-dark px-6 text-[0.9375rem] font-semibold text-white">Ver el plan <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden /></span>
        </div>
      </Link>
    </section>
  )
}
