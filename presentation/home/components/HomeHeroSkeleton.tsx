import { Section } from "@/app/components/layout/shared/Section"
import { Skeleton } from "@/app/components/ui/skeleton"

/** Mientras llega la lectura del día: mismo alto aproximado que el primer pantallazo para que la página no salte. */
export function HomeHeroSkeleton() {
  return (
    <Section spacing="sm" className="pt-5 sm:pt-7">
      <Skeleton className="h-4 w-48 rounded" />
      <h1 className="mb-3.5 mt-1 font-heading text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]">¿Qué hay pa&apos; hacer hoy?</h1>
      <Skeleton className="h-12 rounded-full" />
      <div className="mt-3.5 flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-24 rounded-full" />)}</div>
      <Skeleton className="mt-4 h-53 rounded-3xl sm:h-72" />
    </Section>
  )
}
