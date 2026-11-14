import { siteCollectionHref } from "@/presentation/sites/lib/siteCollections"
import Link from "@/app/components/ui/navigation/IntentLink"
import { RAIL_CLASS, RAIL_ITEM_CLASS, RailHeader } from "@/app/components/layout/shared/Rail"
import type { SiteTodayView } from "../lib/buildHomeView"
import { RailSiteCard } from "./RailSiteCard"

const CHIPS = [
  { href: siteCollectionHref("restaurantes-ibague"), label: "Comer" },
  { href: siteCollectionHref("bares-ibague"), label: "Tomar algo" },
  { href: siteCollectionHref("parques-ibague"), label: "Pasear" },
  { href: siteCollectionHref("sitios-culturales-ibague"), label: "Cultura" },
]

/** «Dónde ir hoy»: sitios abiertos ahora (primero los que tienen algo esta semana), en carril deslizable. No se dibuja sin sitios. */
export function SitesToday({ sites, total }: { sites: SiteTodayView[]; total: number }) {
  if (!sites.length) return null
  return (
    <section aria-labelledby="donde-ir-hoy">
      <RailHeader id="donde-ir-hoy" title="Dónde ir hoy" hint={`${total} abiertos ahora, primero los que tienen algo esta semana.`} href="/donde-ir" linkLabel="Ver la guía" targetId="donde-ir-carril" className="mb-3.5" />
      <ul id="donde-ir-carril" className={RAIL_CLASS}>
        {sites.slice(0, 8).map((s, i) => <li key={s.id} className={RAIL_ITEM_CLASS}><RailSiteCard s={s} index={i} /></li>)}
      </ul>
      <ul className="mt-2 flex flex-wrap gap-2 lg:hidden">
        {CHIPS.map((c) => <li key={c.label}><Link href={c.href} className="flex min-h-11 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium hover:bg-muted">{c.label}</Link></li>)}
      </ul>
    </section>
  )
}
