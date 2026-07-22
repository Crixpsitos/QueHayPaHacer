import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";
import { EventsSectionsSkeleton } from "@/presentation/events/components/EventsSectionsSkeleton";
import { EventosIndexSections } from "@/presentation/events/components/EventosIndexSections";
import { getEventCollections } from "@/presentation/events/lib/eventCollections";

export const metadata: Metadata = {
  title: "Eventos en Ibagué",
  description:
    "Descubre todos los eventos en Ibagué: destacados, planes para este fin de semana y por categoría. Conciertos, cultura, gastronomía y más.",
  alternates: { canonical: "/eventos" },
};

export default async function EventosIndexPage() {
  // Chips de categoría: estáticas (sin cookies). Las secciones de eventos —que
  // leen la cookie para el like— van en un hueco PPR (<Suspense>).
  const collections = await getEventCollections();
  const categoryCollections = collections.filter((c) => c.kind === "category");

  return (
    <>
      <Section spacing="sm" className="mt-4">
        <h1 className="text-3xl font-bold">Eventos en Ibagué</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Todo lo que hay pa&apos; hacer en la ciudad: lo más destacado, planes de fin
          de semana y eventos por categoría.
        </p>

        {categoryCollections.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {categoryCollections.map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/70"
              >
                {c.shortLabel}
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Suspense fallback={<EventsSectionsSkeleton />}>
        <EventosIndexSections />
      </Suspense>
    </>
  );
}
