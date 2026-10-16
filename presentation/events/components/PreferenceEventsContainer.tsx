"use client";

import { useAuth } from "@/app/store/auth/AuthContext";
import { useCachedFetch } from "@/app/lib/clientCache/useCachedFetch";
import { EventCardInteractive } from "./card/EventCardInteractive";
import { ContentSection } from "@/app/components/layout/shared/ContentSection";
import { Separator } from "@/app/components/ui/separator";
import type { EventViewModel } from "../view-models/EventViewModel";

export function PreferenceEventsContainer() {
  const { user, isHydrating } = useAuth();
  // Lista personal: se pinta al instante lo último visto (10 min) y se refresca en segundo plano. Sin sesión no se pide ni guarda.
  const uid = isHydrating ? undefined : (user?.uid ?? null);
  const { data: events = [] } = useCachedFetch<EventViewModel[]>(
    uid ? "preference-events" : null,
    () => fetch("/api/profile/preference-events").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))),
    { uid, maxAgeMs: 10 * 60 * 1000 },
  );

  if (events.length === 0) return null;

  return (
    <ContentSection title="Tus preferencias">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Estas son las actividades que te gustaron en las que te interesan. ¡No te pierdas de nada!
      </p>
      <Separator className="my-6" />
      <EventCardInteractive
        events={events}
        info={{ title: "No hay recomendaciones por ahora" }}
        variant="vertical"
      />
    </ContentSection>
  );
}


