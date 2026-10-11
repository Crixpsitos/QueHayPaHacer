"use client";

import { useEffect, useState } from "react";
import { Award, CalendarDays, Heart, MapPin } from "lucide-react";
import { fetchMyProfileData, type MyProfileData } from "@/app/lib/api/profile-fetcher";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
  MissingEventCard,
  TimelineBadgeCard,
  TimelineEventCard,
  TimelineSiteCard,
} from "./TimelineRelatedContent";
import {
  buildProfileTimelineItems,
  groupProfileTimelineItems,
  type ProfileTimelineItem,
} from "@/presentation/profile/lib/profileTimeline";

const ACTIVITY_META = {
  event: { title: "Aportaste un evento", icon: CalendarDays },
  site: { title: "Aportaste un sitio", icon: MapPin },
  like: { title: "Te gustó un evento", icon: Heart },
  badge: { title: "Obtuviste una insignia", icon: Award },
} satisfies Record<ProfileTimelineItem["type"], { title: string; icon: typeof CalendarDays }>;

const formatActivityDate = (date: Date) =>
  new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

export function ProfileTimeline() {
  const [data, setData] = useState<MyProfileData | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    fetchMyProfileData()
      .then(setData)
      .catch(() => setHasError(true));
  }, []);

  if (hasError) {
    return <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">No pudimos cargar tu trayectoria.</p>;
  }

  if (!data) {
    return <TimelineSkeleton />;
  }

  const items = buildProfileTimelineItems(data);
  const groups = groupProfileTimelineItems(items);

  return (
    <section aria-labelledby="trayectoria-title" className="min-w-0 py-2">
      <div className="mb-6">
        <h2 id="trayectoria-title" className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>Tu trayectoria</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tu actividad y aportes dentro de QHPA.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
          <p className="font-medium">Tu trayectoria comienza aquí.</p>
          <p className="mt-1 text-sm text-muted-foreground">Explora, participa o aporta algo que otros deberían descubrir.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.dateKey} aria-labelledby={`timeline-date-${group.dateKey}`}>
              <time
                id={`timeline-date-${group.dateKey}`}
                dateTime={group.dateKey}
                className="block text-sm font-semibold text-foreground"
              >
                {formatActivityDate(group.date)}
              </time>

              <ol className="mt-4 ml-4 border-l border-border">
                {group.items.map((item) => {
                  const meta = ACTIVITY_META[item.type];
                  const Icon = meta.icon;

                  return (
                    <li key={item.id} className="relative grid min-w-0 grid-cols-[minmax(0,1fr)] pb-7 pl-6 last:pb-0 sm:pl-8">
                      <span className="absolute -left-4 top-0 flex size-8 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-3">
                        <p className="pt-1 text-sm font-semibold text-foreground">{meta.title}</p>

                        {item.type === "event" && (
                          <TimelineEventCard
                            event={item.event}
                            href={`/eventos/${item.event.id}`}
                            contributed
                          />
                        )}
                        {item.type === "site" && <TimelineSiteCard site={item.site} />}
                        {item.type === "like" && (
                          item.interaction.event ? (
                            <TimelineEventCard
                              event={item.interaction.event}
                              href={`/eventos/${item.interaction.eventId}`}
                              showAuthor
                            />
                          ) : (
                            <MissingEventCard />
                          )
                        )}
                        {item.type === "badge" && <TimelineBadgeCard badge={item.badge} />}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function TimelineSkeleton() {
  return (
    <div className="w-full space-y-4 py-2" aria-hidden>
      <Skeleton className="h-6 w-40" />
      {[0, 1, 2].map((item) => <Skeleton key={item} className="h-32 w-full rounded-lg" />)}
    </div>
  );
}