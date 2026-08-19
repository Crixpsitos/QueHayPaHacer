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

        <div className="w-full h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </ContentSection>

      <ContentSection title="Eventos para esta semana">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Explora los eventos que se llevarán a cabo esta semana. Mantente al
          día con las actividades y no te pierdas de nada.
        </p>

        <Separator className="my-6" />

        <div className="w-full h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
      </ContentSection>
    </>
  );
};
