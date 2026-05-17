import { Suspense } from "react";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import { FeaturedEventsContainer } from "./FeaturedEventsContainer";
import { EventsCardSkeleton } from "./EventsCardSkeleton";

export const EventsContainer = () => {
  return (
    <ContentSection title="Los eventos más destacados">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Descubre los eventos más populares y recomendados en tu ciudad. Desde
        conciertos hasta exposiciones, encuentra lo mejor para disfrutar.
      </p>

      <Separator className="my-6" />

      <Suspense fallback={<EventsCardSkeleton />}>
        <FeaturedEventsContainer />
      </Suspense>
    </ContentSection>
  );
};
