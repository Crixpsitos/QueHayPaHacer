import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import Link from "@/app/components/ui/navigation/IntentLink"
import { Container } from "@/app/components/layout/shared/Container"
import { Section } from "@/app/components/layout/shared/Section"
import { AdSlot } from "@/presentation/home/components/AdSlot"
import { fetchGuia, guiaJsonLdHtml } from "../../data/fetchGuia"
import { guiaStatus, landingCategories, scopeGuia } from "../../lib/buildGuia"
import { getSiteCollections, siteCollectionHref, type SiteCollectionDef } from "../../lib/siteCollections"
import { SITE_ICON_MAP } from "../discovery/SiteCategoryChips"
import { Guia } from "./Guia"

/** Variante de la guía para un tipo de sitio (/donde-ir-cafeterias-ibague): cabecera propia con cifras, tipos hermanos, mapa y lista numerada. */
export async function SiteTypeGuia({ def }: { def: SiteCollectionDef }) {
  const { view: all, weekEvents } = await fetchGuia()
  const view = scopeGuia(all, landingCategories(def.category!))
  const Icon = SITE_ICON_MAP[def.category!] ?? MapPin
  const now = new Date(view.now)
  const facts = [
    { big: view.sites.length, small: "en la guía" },
    { big: view.sites.filter((s) => guiaStatus(s, now).isOpen).length, small: "abiertos ahora" },
    { big: view.sites.filter((s) => s.promo).length, small: "con promo" },
  ]
  // Tipos hermanos: los que tienen sitios (y este, aunque esté vacío).
  const siblings = getSiteCollections()
    .filter((c) => c.kind === "type" && c.category)
    .map((c) => ({ c, count: all.sites.filter((s) => landingCategories(c.category!).includes(s.category)).length }))
    .filter((x) => x.count > 0 || x.c.slug === def.slug)
    .sort((a, b) => Number(b.c.slug === def.slug) - Number(a.c.slug === def.slug) || b.count - a.count)
  const label = def.shortLabel.toLowerCase()
  return (
    <>
      {view.sites.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: guiaJsonLdHtml(view) }} /> : null}
      <div className="rounded-b-[1.75rem] bg-accent text-wine sm:rounded-none">
        <Container className="pb-5 pt-2 sm:pb-6">
          <Link href="/donde-ir" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-wine hover:underline"><ChevronLeft className="size-4" aria-hidden />Toda la guía</Link>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0 flex-[1_1_28rem]">
              <div className="flex items-start gap-3.5 sm:items-center sm:gap-4">
                <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-[1.125rem] bg-primary-dark text-brand-gold sm:size-16"><Icon className="size-7" /></span>
                <h1 className="font-heading text-[1.75rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.75rem]">{def.title}</h1>
              </div>
              <p className="mt-3 max-w-2xl text-[0.9375rem] text-amber-ink sm:text-base">{def.description} Con horario, cómo llegar y lo que pasa ahí esta semana.</p>
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

      <Section spacing="sm" className="pt-3.5 sm:pt-5" containerClassName="flex flex-col gap-4 sm:gap-5">
        <nav aria-label="Otros tipos de sitio">
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {siblings.map(({ c, count }) => {
              const on = c.slug === def.slug
              return (
                <li key={c.slug} className="shrink-0">
                  <Link href={siteCollectionHref(c.slug)} aria-current={on ? "page" : undefined} className={on ? "flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-primary-dark bg-primary-dark px-4 text-sm font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/50" : "flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-border bg-card px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"}>
                    {c.shortLabel}<span className={on ? "text-brand-gold" : "text-primary-dark"}>{count}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <Guia view={view} variant="type" listTitle={`${def.shortLabel} en la guía`} />
        <AdSlot />
        {weekEvents > 0 ? (
          <Link href="/eventos" className="grid grid-cols-[minmax(0,1fr)_1.5rem] items-center gap-3 rounded-[1.25rem] bg-primary-dark p-4 text-white outline-none hover:bg-wine focus-visible:ring-3 focus-visible:ring-ring/60 sm:px-6">
            <span>
              <span className="block font-heading text-[1.0625rem] font-bold sm:text-lg">Lo que hay esta semana en Ibagué</span>
              <span className="block text-sm text-white/85">{weekEvents === 1 ? "1 evento en la cartelera." : `${weekEvents} eventos en la cartelera.`}</span>
            </span>
            <ChevronRight className="size-5.5 text-brand-gold" aria-hidden />
          </Link>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-3xl bg-accent px-5 py-5 text-wine sm:px-7 sm:py-6">
          <div className="min-w-0 flex-[1_1_18rem]">
            <h2 className="font-heading text-xl font-bold leading-tight sm:text-[1.5rem]">¿Falta un lugar en {label}?</h2>
            <p className="mt-1.5 text-sm text-amber-ink sm:text-base">Agrégalo gratis y sale en esta página y en el mapa.</p>
          </div>
          <Link href="/sites/create" className="flex min-h-12 w-full items-center justify-center rounded-full bg-primary-dark px-6 font-semibold text-white outline-none hover:bg-wine focus-visible:ring-3 focus-visible:ring-ring/60 sm:w-auto">Agregar un sitio</Link>
        </div>
      </Section>
    </>
  )
}
