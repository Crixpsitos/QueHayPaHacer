"use client";

import { useEffect, useState } from "react";
import { EventCardInteractive } from "./card/EventCardInteractive";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import type { EventViewModel } from "../view-models/EventViewModel";

export function PreferenceEventsContainer() {
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile/preference-events")
      .then((r) => r.json())
      .then((data: EventViewModel[]) => {
        setEvents(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || events.length === 0) return null;

  return (
    <ContentSection title="Tus preferencias">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Estas son las actividades que te gustaron en las que te interesan. ¡No te pierdas de nada!
      </p>
      <Separator className="my-6" />
      <EventCardInteractive
        events={events}
        info={{ title: "Lamentablemente no hay eventos recomendados :C", description: "Estamos trabajando constantemente para traerte las mejores experiencias. ¡Vuelve pronto para descubrir lo que tenemos preparado para ti!" }}
        variant="vertical"
      />
    </ContentSection>
  );
}


