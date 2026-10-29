import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "./Section";
import { LEGAL_VERSION } from "@/app/lib/legal/version";

// Identificación del responsable del tratamiento: la Ley 1581 de 2012 y su decreto piden que la
// política identifique a quien trata los datos y cómo contactarlo. Se muestra en /terminos y /privacidad.
// Si algún día se constituye empresa, cambiar `owner` por la razón social (y agregar el NIT).
export const LEGAL_ENTITY: {
  name: string;
  city: string;
  contactHref: string;
  updatedAt: string;
  /** Nombre completo del responsable (persona natural) o razón social. */
  owner?: string;
  /** Correo dedicado para datos personales y avisos de contenido (ej. legal@tudominio.co). */
  email?: string;
  phone?: string;
} = {
  name: "Que Hay Pa Hacer?",
  city: "Ibagué, Tolima, Colombia",
  contactHref: "/contactanos",
  // Fecha legible derivada de la versión (única fuente de verdad).
  updatedAt: new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(
    new Date(`${LEGAL_VERSION}T12:00:00-05:00`),
  ),
  owner: "Cristian Andres Peña Montealegre",
  email: "quehaypahacer6@gmail.com",
};

/** Línea de denuncia de explotación sexual infantil (Ley 679/2001 y Decreto 1524/2002 piden un enlace visible). */
export const TE_PROTEJO_URL = "https://www.teprotejo.org";

/** "Nombre, ciudad, correo, teléfono" con lo que esté definido. */
export function responsibleLine() {
  const { owner, name, city, email, phone } = LEGAL_ENTITY;
  return [owner ?? name, city, email, phone].filter(Boolean).join(", ");
}

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
        <div className="space-y-8 text-[15px] leading-relaxed text-[#3F3F46] [&_a]:font-medium [&_a]:text-[#D42F3C] [&_a:hover]:underline [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[#09090B] [&_li]:mt-1.5 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
        <p className="mt-12 border-t border-[#E4E4E7] pt-6 text-sm text-[#71717A]">
          ¿Preguntas sobre este documento? <Link href={LEGAL_ENTITY.contactHref} className="font-medium text-[#D42F3C] hover:underline">Escríbenos</Link>.
        </p>
      </article>
    </Section>
  );
}
