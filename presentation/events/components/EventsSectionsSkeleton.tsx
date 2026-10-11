import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";

export const EventsSectionsSkeleton = () => {
  return (
    <>
      <ContentSection title="Los eventos más destacados">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Descubre los eventos más populares y recomendados en tu ciudad. Desde
          conciertos hasta exposiciones, encuentra lo mejor para disfrutar.
        </p>

        <Separator className="my-6" />

        <CardGridSkeleton />
      </ContentSection>

      <ContentSection title="Eventos para esta semana">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explora los eventos que se llevarán a cabo esta semana. Mantente al
          día con las actividades y no te pierdas de nada.
        </p>

        <Separator className="my-6" />

        <CardGridSkeleton />
      </ContentSection>
    </>
  );
};

/** Misma forma que `EventCard`: imagen 4:3 + categoría, título, fecha, precio. */
function CardGridSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white">
          <div className="aspect-4/3 bg-[#F4F4F5]" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/4 rounded bg-[#F4F4F5]" />
            <div className="h-4 w-4/5 rounded bg-[#F4F4F5]" />
            <div className="h-3 w-1/2 rounded bg-[#F4F4F5]" />
            <div className="h-3 w-1/5 rounded bg-[#F4F4F5]" />
          </div>
        </div>
      ))}
    </div>
  );
}
