import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "./Section";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
  /** Enlace "Ver más" opcional en la cabecera (ej. a la landing de la colección). */
  action?: { href: string; label?: string };
}

export const ContentSection = ({ title, children, action }: ContentSectionProps) => {
  return (
    <Section spacing="sm" className="mt-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {action.label ?? "Ver más"}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </Section>
  );
};
