"use client"

import { Info } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"

/**
 * «¿Qué sitios aceptamos?»: el aviso de ayuda del formulario de sitios. Dice QUÉ es un sitio aquí (un lugar al que se puede ir y
 * volver a encontrar) sin listas de lo que no se acepta. Un solo texto para todos los puntos donde aparece el símbolo.
 */
export function SitePolicyHelp({ className }: { className?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label="¿Qué sitios aceptamos?" className={className ?? "inline-grid size-8 shrink-0 place-items-center rounded-full text-primary-dark outline-none hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-primary-dark/30"}>
          <Info className="size-4" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={12} className="max-h-[70vh] w-80 max-w-[calc(100vw-2rem)] space-y-2 overflow-y-auto p-4 text-sm leading-relaxed">
        <p className="font-heading text-base font-bold">¿Qué sitios aceptamos?</p>
        <p>Aquí la gente de Ibagué y los turistas encuentran <strong>lugares a los que pueden ir</strong>: tiendas, restaurantes, cafés, puestos de comida con punto fijo, viveros, parques, miradores, espacios culturales…</p>
        <p>Lo que cuenta es que el lugar tenga <strong>una dirección fija</strong>, para que cualquiera pueda llegar y volver a encontrarlo.</p>
        <p>Un sitio puede ofrecer una experiencia y, si quiere, también productos para llevar (por ejemplo, plantas en un vivero-café). La carta y las promociones muestran <strong>qué hay en el lugar</strong>: no somos una tienda en línea, y se pregunta por WhatsApp.</p>
        <p className="text-xs text-muted-foreground">Todos los sitios se revisan antes de publicarse.</p>
      </PopoverContent>
    </Popover>
  )
}
