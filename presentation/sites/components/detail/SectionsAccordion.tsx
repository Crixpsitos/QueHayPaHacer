import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import type { SiteSection } from "@/domain/entities/sites/value-objects/SiteSections"

/** Datos de consulta de la ficha (cómo llegar, qué incluye, fuentes…). Todas cerradas al cargar. */
export function SectionsAccordion({ sections }: { sections: SiteSection[] }) {
  if (sections.length === 0) return null
  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold">Más información</h2>
      <Accordion type="multiple">
        {sections.map((s, i) => (
          <AccordionItem key={i} value={`s${i}`}>
            <AccordionTrigger>{s.title}</AccordionTrigger>
            <AccordionContent>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{s.body}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
