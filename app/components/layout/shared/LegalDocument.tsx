import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "./Section";

// ponytail: datos del responsable en un solo lugar. Completar razón social, NIT
// y correo de habeas data antes del lanzamiento (Ley 1581 de 2012, art. 13 Decreto 1377).
export const LEGAL_ENTITY = {
  name: "Que Hay Pa Hacer?",
  city: "Ibagué, Tolima, Colombia",
  contactHref: "/contactanos",
  updatedAt: "10 de octubre de 2026",
};

export function LegalDocument({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <Section spacing="md">
      <article className="mx-auto max-w-2xl px-4 sm:px-6">
        <header className="mb-10 border-b border-[#E4E4E7] pb-8">
          <h1 className="text-3xl font-bold text-[#09090B] sm:text-4xl" style={{ fontFamily: "var(--font-heading)" }}>
            {title}
          </h1>
          <p className="mt-3 text-sm text-[#71717A]">Última actualización: {LEGAL_ENTITY.updatedAt}</p>
          <p className="mt-5 text-base leading-relaxed text-[#3F3F46]">{intro}</p>
        </header>
        <div className="space-y-8 text-[15px] leading-relaxed text-[#3F3F46] [&_a]:font-medium [&_a]:text-[#E63946] [&_a:hover]:underline [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[#09090B] [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-12 border-t border-[#E4E4E7] pt-6 text-sm text-[#71717A]">
          ¿Preguntas sobre este documento? <Link href={LEGAL_ENTITY.contactHref} className="font-medium text-[#E63946] hover:underline">Escríbenos</Link>.
        </p>
      </article>
    </Section>
  );
}
