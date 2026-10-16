"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { useAuth } from "@/app/store/auth/AuthContext";
import { fetchMyProfileData } from "@/app/lib/api/profile-fetcher";
import { useCachedFetch } from "@/app/lib/clientCache/useCachedFetch";
import { EventPosterCard } from "./my-events/EventPosterCard";
import { matchesTab, sortEvents, TABS, totals, type EventTab } from "./my-events/myEvents";

const EMPTY: Record<EventTab, { title: string; body: string }> = {
  all: { title: "Todavía no tienes eventos", body: "Crea el primero y empieza a llenar tu cartelera." },
  published: { title: "Nada publicado todavía", body: "Termina un borrador y envíalo para que la gente lo encuentre." },
  review: { title: "Nada esperando revisión", body: "Cuando envíes un evento, lo verás aquí mientras lo revisamos." },
  draft: { title: "Sin borradores", body: "Empieza un evento y guárdalo cuando quieras; lo retomas desde aquí." },
};

const numberFormat = new Intl.NumberFormat("es-CO");

export function MyEventsManager() {
  const { user, isHydrating } = useAuth();
  const isPremium = user?.profile?.plan === "premium";
  const [tab, setTab] = useState<EventTab>("all");
  // Pinta al instante lo último visto (10 min) y refresca de fondo; la caché es de esta sesión (uid).
  const { data, error } = useCachedFetch("my-events", () => fetchMyProfileData({ allEvents: true }).then((d) => sortEvents(d.events)), {
    uid: isHydrating ? undefined : (user?.uid ?? null),
    maxAgeMs: 10 * 60_000,
  });
  const events = data ?? null;
  const hasError = !!error && !data;

  const summary = useMemo(() => (events ? totals(events) : null), [events]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">Mis eventos</h1>
          <p className="mt-2 text-muted-foreground">Revisa cómo va cada evento y retoma los que tienes pendientes.</p>
        </div>
        <Button asChild size="lg">
          <Link href="/eventos/create">
            <CalendarPlus aria-hidden />
            Crear evento
          </Link>
        </Button>
      </header>

      {hasError ? (
        <p role="alert" className="rounded-2xl bg-card px-5 py-4 text-sm text-muted-foreground">
          No pudimos cargar tus eventos. Recarga la página para intentarlo de nuevo.
        </p>
      ) : !events || !summary ? (
        <LoadingState />
      ) : (
        <>
          <dl className="grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
            <SummaryItem label="Eventos publicados" value={summary.published} />
            <SummaryItem label="Vistas totales" value={summary.views} />
            <SummaryItem label="Inscritos totales" value={summary.registrations} />
          </dl>

          <Tabs value={tab} onValueChange={(v) => setTab(v as EventTab)} className="gap-6">
            <TabsList aria-label="Filtrar eventos por estado" className="h-auto max-w-full flex-wrap">
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-1.5 px-3">
                  {t.label}
                  <span className="text-muted-foreground tabular-nums">
                    {events.filter((e) => matchesTab(e, t.value)).length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((t) => {
              const visible = events.filter((e) => matchesTab(e, t.value));
              return (
                <TabsContent key={t.value} value={t.value}>
                  {visible.length === 0 ? (
                    <EmptyState tab={t.value} />
                  ) : (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                      {visible.map((event, i) => (
                        <EventPosterCard key={event.id} event={event} isPremium={isPremium} priority={i < 3} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>

          {!isPremium && (
            <p className="text-sm text-muted-foreground">
              Estadísticas de cada evento, control de asistencia y eventos de varias fechas están en Premium.{" "}
              <Link
                href="/premium"
                className="font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Conocer Premium
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-4 sm:px-6 sm:py-5">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="font-heading text-2xl font-bold tabular-nums sm:text-3xl">{numberFormat.format(value)}</dd>
    </div>
  );
}

function EmptyState({ tab }: { tab: EventTab }) {
  const copy = EMPTY[tab];
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="font-heading text-lg font-semibold">{copy.title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{copy.body}</p>
      <Button asChild variant="outline" className="mt-5">
        <Link href="/eventos/create">
          <CalendarPlus aria-hidden />
          Crear evento
        </Link>
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Cargando tus eventos">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
