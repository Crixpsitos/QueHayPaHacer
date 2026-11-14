import Image from "next/image"
import Link from "@/app/components/ui/navigation/IntentLink"
import type { EscapadaView } from "../lib/buildHomeView"

const BG = ["bg-sand", "bg-brand-gold", "bg-primary", "bg-primary-dark"]

/** «Escapaditas de tu ciudad»: pueblos cercanos que carga el administrador. No se dibuja mientras no haya ninguno con planes próximos. */
export function EscapadasSection({ items }: { items: EscapadaView[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="escapaditas">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id="escapaditas" className="font-heading text-2xl font-bold sm:text-3xl">Escapaditas de tu ciudad</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">Planes cerca de Ibagué, para ir y volver el mismo día.</p>
        </div>
        <Link href="/contactanos" className="hidden min-h-11 items-center text-sm font-semibold text-primary-dark underline-offset-2 hover:underline sm:flex">Sugerir una escapadita</Link>
      </div>
      <ul className="relative -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(15.5rem,1fr))] sm:gap-5 sm:overflow-visible sm:px-0 [scrollbar-width:none]">
        {items.map((x, i) => (
          <li key={x.id} className="w-51 shrink-0 snap-start sm:w-auto">
            <Link href={x.href} className="group flex h-full flex-col overflow-hidden rounded-[1.375rem] border border-border bg-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="relative block h-28 sm:h-35">
                {x.cover ? <Image src={x.cover} alt="" fill sizes="(min-width: 640px) 16rem, 13rem" className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none" /> : <span aria-hidden className={`absolute inset-0 ${BG[i % BG.length]}`} />}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-card px-2.5 py-1 text-[0.8125rem] font-semibold text-wine">{x.far}</span>
              </span>
              <span className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
                <span className="font-heading text-base font-bold leading-tight sm:text-lg">{x.name}</span>
                <span className="mt-0.5 text-[0.8125rem] font-semibold text-primary-dark">{x.plans}</span>
                <span className="mt-1.5 text-[0.8125rem] text-muted-foreground">{x.next}</span>
              </span>
            </Link>
          </li>
        ))}
        <li className="w-42 shrink-0 snap-start sm:hidden">
          <Link href="/contactanos" className="flex h-full min-h-40 flex-col items-center justify-center gap-1.5 rounded-[1.375rem] border-[1.5px] border-dashed border-primary-dark p-3.5 text-center text-[0.9375rem] font-semibold text-primary-dark outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Sugerir una escapadita
            <span className="text-[0.8125rem] font-medium text-muted-foreground">¿Conoces un plan en un pueblo cercano?</span>
          </Link>
        </li>
      </ul>
    </section>
  )
}
