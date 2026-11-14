import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "@/app/components/ui/navigation/IntentLink";
import { Section } from "@/app/components/layout/shared/Section";
import { HomeSearchBar } from "@/app/components/feature/home/HomeSearchBar";
import { AdSlot, adsEnabled } from "@/presentation/home/components/AdSlot";
import { Cartelera } from "@/presentation/events/components/Cartelera";
import { fetchCartelera } from "@/presentation/events/data/fetchCartelera";
import { HomeFeatured } from "@/presentation/home/components/HomeFeatured";

export const metadata: Metadata = {
  title: "Eventos en Ibagué",
  description:
    "Descubre todos los eventos en Ibagué: destacados, planes para este fin de semana y por categoría. Conciertos, cultura, gastronomía y más.",
  alternates: { canonical: "/eventos" },
};

/** La cartelera: todos los eventos que vienen, en boletas ordenadas por fecha. */
export default async function EventosIndexPage() {
  const { view, cats, jsonLd } = await fetchCartelera();

  return (
    <>
      {jsonLd.map((html, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: html }} />
      ))}
      <Section spacing="sm" className="pt-5 sm:pt-7" containerClassName="flex flex-col gap-5 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h1 className="font-heading text-[2rem] font-extrabold leading-[1.05] tracking-tight sm:text-[2.875rem]">Eventos en Ibagué</h1>
            <p className="mt-1.5 text-[0.9375rem] text-muted-foreground sm:text-base">
              {view.total ? `${view.total} por venir. ${view.nextLabel}` : "La cartelera de la ciudad, por fecha."}
            </p>
          </div>
          <div className="w-full sm:w-85"><HomeSearchBar /></div>
        </div>
        <Cartelera view={view} cats={cats} featured={<Suspense fallback={null}><HomeFeatured /></Suspense>} ad={adsEnabled() ? <AdSlot format="rectangle" /> : null} />
      </Section>

      <Section spacing="sm" className="pt-2 sm:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-3xl bg-primary-dark px-5 py-6 text-white sm:px-7">
          <div className="min-w-0 flex-[1_1_18rem]">
            <h2 className="font-heading text-[1.375rem] font-bold leading-tight sm:text-[1.625rem]">¿Tu evento no está en la cartelera?</h2>
            <p className="mt-1.5 text-sm text-white/85 sm:text-base">Publícalo gratis y sale aquí, en su día.</p>
          </div>
          <Link href="/eventos/create" className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-gold px-6 font-semibold text-wine outline-none hover:bg-brand-gold/90 focus-visible:ring-3 focus-visible:ring-white/70 sm:w-auto">Publicar un evento</Link>
        </div>
      </Section>
    </>
  );
}
