import { Container } from "@/app/components/layout/shared/Container";
import { Skeleton } from "@/app/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";

export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando contenido"
      className="min-h-screen bg-background **:data-[slot=skeleton]:motion-reduce:animate-none"
    >
      {/* Minimal brand header — no Navbar dependency */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <Container>
          <div className="flex h-14 items-center">
            <span
              className="font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Que Hay Pa Hacer?
            </span>
          </div>
        </Container>
      </div>

      {/* Campaign banner */}
      <section className="overflow-hidden py-8 sm:py-10" aria-hidden="true">
        <div className="w-full px-2 sm:px-3">
          <Skeleton className="aspect-8/3 w-full rounded-xl" />
        </div>
      </section>

      <Container>
        {/* Search bar */}
        <Skeleton className="mx-auto mb-8 h-11 w-full max-w-2xl rounded-full" />

        {/* Discovery hint */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
          <p
            className="text-sm font-medium text-muted-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Descubriendo algo para ti...
          </p>
        </div>

        {/* Category pills */}
        <div className="mb-10" aria-hidden="true">
          <Skeleton className="mb-4 h-7 w-44 rounded-xl" />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-secondary bg-card p-4"
              >
                <Skeleton className="size-12 rounded-full sm:size-14" />
                <Skeleton className="h-3 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Event section 1 */}
        <EventSectionSkeleton
          titleWidth="w-72"
          cards={[
            { titleW: "w-3/4", dateW: "w-32", locW: "w-24" },
            { titleW: "w-2/3", dateW: "w-28", locW: "w-20" },
            { titleW: "w-4/5", dateW: "w-36", locW: "w-28" },
          ]}
        />

        {/* Event section 2 — oculta en mobile para no saturar */}
        <div className="hidden sm:block">
          <EventSectionSkeleton
            titleWidth="w-56"
            cards={[
              { titleW: "w-3/5", dateW: "w-24", locW: "w-28" },
              { titleW: "w-4/5", dateW: "w-32", locW: "w-20" },
              { titleW: "w-2/3", dateW: "w-36", locW: "w-24" },
            ]}
          />
        </div>
      </Container>

      {/* Texto accesible oculto visualmente */}
      <span className="sr-only">Cargando contenido, por favor espera.</span>
    </div>
  );
}

function EventSectionSkeleton({
  titleWidth,
  cards,
}: {
  titleWidth: string;
  cards: { titleW: string; dateW: string; locW: string }[];
}) {
  return (
    <div className="mb-10" aria-hidden="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className={cn("h-7 rounded-xl", titleWidth)} />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
        <div className="mt-4 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <EventCardSkeleton key={i} {...card} />
        ))}
      </div>
    </div>
  );
}

function EventCardSkeleton({
  titleW,
  dateW,
  locW,
}: {
  titleW: string;
  dateW: string;
  locW: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-secondary bg-card shadow-(--shadow-subtle)">
      {/* Image */}
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        {/* Category badge */}
        <Skeleton className="h-5 w-16 rounded-full" />
        {/* Title */}
        <Skeleton className={cn("h-5 rounded-xl", titleW)} />
        <Skeleton className="h-4 w-11/12 rounded-lg" />
        {/* Date + location */}
        <div className="mt-1 flex items-center gap-3">
          <Skeleton className={cn("h-3 rounded", dateW)} />
          <Skeleton className={cn("h-3 rounded", locW)} />
        </div>
        {/* Author */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="size-6 rounded-full" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
}
