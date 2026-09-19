"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, CalendarDays, Heart, MapPin } from "lucide-react";
import { fetchMyProfileData, type MyProfileData } from "@/app/lib/api/profile-fetcher";
import { Skeleton } from "@/app/components/ui/skeleton";

type TimelineItem = {
  id: string;
  date: Date;
  title: string;
  description: string;
  href?: string;
  icon: typeof CalendarDays;
};

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

  const items: TimelineItem[] = [
    ...data.events.filter((event) => event.status !== "draft").map((event) => ({
      id: `event-${event.id}`,
      date: new Date(event.createdAt),
      title: "Aportaste un evento",
      description: event.title,
      href: `/eventos/${event.id}`,
      icon: CalendarDays,
    })),
    ...data.sites.filter((site) => site.publicationStatus !== "draft").map((site) => ({
      id: `site-${site.id}`,
      date: new Date(site.createdAt),
      title: "Propusiste un sitio",
      description: site.name,
      href: `/donde-ir/${site.slug}`,
      icon: MapPin,
    })),
    ...data.likes.map((interaction) => ({
      id: `like-${interaction.id}`,
      date: new Date(interaction.createdAt),
      title: "Te gustó un evento",
      description: interaction.event?.title ?? "Evento",
      href: interaction.eventId ? `/eventos/${interaction.eventId}` : undefined,
      icon: Heart,
    })),
    ...data.badges.map((badge) => ({
      id: `badge-${badge.id}`,
      date: new Date(badge.earnedAt),
      title: "Recibiste una insignia",
      description: badge.name,
      icon: Award,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <section aria-labelledby="trayectoria-title" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
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
        <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-border">
          {items.map((item) => {
            const Icon = item.icon;
            const content = (
              <div className="group flex gap-4 rounded-xl px-1 py-3">
                <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold group-hover:text-primary">{item.title}</p>
                    <time className="text-xs text-muted-foreground" dateTime={item.date.toISOString()}>
                      {new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(item.date)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            );
            return <li key={item.id}>{item.href ? <Link href={item.href}>{content}</Link> : content}</li>;
          })}
        </ol>
      )}
    </section>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6" aria-hidden>
      <Skeleton className="h-6 w-40" />
      {[0, 1, 2].map((item) => <Skeleton key={item} className="h-16 w-full rounded-xl" />)}
    </div>
  );
}