import { ChevronDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/**
 * Datos de consulta de la ficha (cómo llegar, qué incluye, fuentes…). Todas cerradas al cargar.
 * Cada sección es una tarjeta con su flecha en un círculo: se ve que se abre (antes parecía texto suelto).
 */
export function SectionsAccordion({ sections }: { sections: SiteSection[] }) {
  if (sections.length === 0) return null
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">Más información</h2>
        <span className="text-sm text-muted-foreground">Toca para abrir</span>
      </div>
      <Accordion type="multiple" className="grid gap-2.5">
        {sections.map((s, i) => (
          <AccordionItem key={i} value={`s${i}`} className="rounded-2xl border border-border bg-card px-4 shadow-subtle last:border-b data-[state=open]:border-primary-dark/40">
            <AccordionTrigger className="min-h-14 py-0 font-heading text-lg font-bold [&>svg]:hidden [&[data-state=open]_.chev]:rotate-180">
              <span>{s.title}</span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark" aria-hidden><ChevronDown className="chev size-4 transition-transform duration-200 motion-reduce:transition-none" /></span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted-foreground">{s.body}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
