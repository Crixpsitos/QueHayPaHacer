import { ChevronLeft } from "lucide-react"
import Link from "@/app/components/ui/navigation/IntentLink"
import { Container } from "@/app/components/layout/shared/Container"
import { Section } from "@/app/components/layout/shared/Section"
import { CATEGORY_ICON_MAP } from "@/presentation/categories/lib/categoryIconMap"
import { AdSlot, adsEnabled } from "@/presentation/home/components/AdSlot"
import type { CollectionDef } from "../lib/eventCollections"
import { fetchCartelera } from "../data/fetchCartelera"
import { Cartelera } from "./Cartelera"

/** Variante de la cartelera para una categoría (/eventos-musica-ibague): cabecera propia con cifras y las categorías hermanas; misma boleta y mismos filtros. */
export async function CategoryCartelera({ def }: { def: CollectionDef }) {
  const { view, cats, free, jsonLd } = await fetchCartelera(def.slug)
  const Icon = def.categoryIcon ? CATEGORY_ICON_MAP[def.categoryIcon] : undefined
  const next = view.events[0]
  const facts = [
    { big: String(view.total), small: "por venir" },
    { big: String(free), small: "gratis" },
    ...(next ? [{ big: next.date === view.today ? "Hoy" : `${next.wd.charAt(0).toUpperCase()}${next.wd.slice(1)} ${next.day}`, small: `el próximo, ${next.time} ${next.ampm}` }] : []),
  ]
  return (
    <>
      {jsonLd.map((html, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: html }} />)}
      <div className="rounded-b-[1.75rem] bg-accent text-wine sm:rounded-none">
        <Container className="pb-5 pt-2 sm:pb-6">
          <Link href="/eventos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wine hover:underline"><ChevronLeft className="size-4" aria-hidden />Todos los eventos</Link>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0 flex-[1_1_28rem]">
              <div className="flex items-start gap-3.5 sm:items-center sm:gap-4">
                {Icon ? <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-[1.125rem] bg-primary-dark text-brand-gold sm:size-16"><Icon className="size-7" /></span> : null}
                <h1 className="font-heading text-[1.75rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.75rem]">{def.title}</h1>
              </div>
              <p className="mt-3 max-w-2xl text-[0.9375rem] text-amber-ink sm:text-base">{def.description}</p>
            </div>
            <dl className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:grid-cols-[repeat(3,8.25rem)] sm:gap-2.5">
              {facts.map((f) => (
                <div key={f.small} className="rounded-2xl bg-card px-3 py-2.5 sm:px-3.5">
                  <dd className="font-heading text-[1.375rem] font-bold leading-tight">{f.big}</dd>
                  <dt className="text-[0.8125rem] text-amber-ink">{f.small}</dt>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </div>
      <Section spacing="sm" className="pt-5 sm:pt-7">
        <Cartelera view={view} cats={cats} allLabel={`Todo en ${def.shortLabel}`} catsTitle="Otras categorías" spotlight={false} ad={adsEnabled() ? <AdSlot format="rectangle" /> : null} />
      </Section>
      <Section spacing="sm" className="pt-2 sm:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-3xl bg-primary-dark px-5 py-6 text-white sm:px-7">
          <div className="min-w-0 flex-[1_1_18rem]">
            <h2 className="font-heading text-[1.375rem] font-bold leading-tight sm:text-[1.625rem]">¿Tienes un evento de {def.shortLabel.toLowerCase()}?</h2>
            <p className="mt-1.5 text-sm text-white/85 sm:text-base">Publícalo gratis y sale en esta página.</p>
          </div>
          <Link href="/eventos/create" className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-gold px-6 font-semibold text-wine outline-none hover:bg-brand-gold/90 focus-visible:ring-3 focus-visible:ring-white/70 sm:w-auto">Publicar un evento</Link>
        </div>
      </Section>
    </>
  )
}
