import type { Metadata } from "next";
import Link from "@/app/components/ui/navigation/IntentLink";
import { Section } from "@/app/components/layout/shared/Section";
import { AdRow, AdSlot } from "@/presentation/home/components/AdSlot";
import { Guia } from "@/presentation/sites/components/guia/Guia";
import { fetchGuia, guiaJsonLdHtml } from "@/presentation/sites/data/fetchGuia";

export const metadata: Metadata = {
  title: "¿Dónde ir en Ibagué?",
  description:
    "Descubre los mejores lugares en Ibagué: cafeterías, bares, restaurantes, parques, museos y más. Encuentra dónde ir.",
  alternates: { canonical: "/donde-ir" },
};

/** La guía de sitios: entrada por plan, mapa con pines numerados, lo que pasa esta semana en cada sitio y todos en lista compacta. */
export default async function DondeIrIndexPage() {
  const { view } = await fetchGuia();
  return (
    <>
      {view.sites.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: guiaJsonLdHtml(view) }} /> : null}
      <Section spacing="sm" className="pt-5 sm:pt-7">
        <Guia view={view} variant="index" adTop={<AdRow />} adMid={<AdSlot format="rectangle" className="lg:hidden" />} />
      </Section>

      <Section spacing="sm" className="pt-2 sm:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-4 rounded-3xl bg-primary-dark px-5 py-6 text-white sm:px-7">
          <div className="min-w-0 flex-[1_1_18rem]">
            <h2 className="font-heading text-[1.375rem] font-bold leading-tight sm:text-[1.625rem]">¿Tu sitio no está en la guía?</h2>
            <p className="mt-1.5 text-sm text-white/85 sm:text-base">Agrégalo gratis: sale en el mapa y en su plan.</p>
          </div>
          <Link href="/sites/create" className="flex min-h-12 w-full items-center justify-center rounded-full bg-brand-gold px-6 font-semibold text-wine outline-none hover:bg-brand-gold/90 focus-visible:ring-3 focus-visible:ring-white/70 sm:w-auto">Agregar un sitio</Link>
        </div>
      </Section>
    </>
  );
}
