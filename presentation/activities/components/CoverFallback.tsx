import { categoryStyle } from "@/presentation/activities/lib/categoryStyle"

/** Portada de respaldo cuando la actividad no tiene foto: el color y el icono de su categoría (en vez de un recuadro gris vacío). */
export function CoverFallback({ categorySlug, className = "size-8" }: { categorySlug: string; className?: string }) {
  const c = categoryStyle(categorySlug)
  return (
    <div className="grid size-full place-items-center" style={{ background: c.bg, color: c.ink }} aria-hidden>
      <c.Icon className={`${className} opacity-70`} />
    </div>
  )
}
