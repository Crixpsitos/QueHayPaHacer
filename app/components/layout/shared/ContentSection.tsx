import { ReactNode } from "react";
import { Section } from "./Section";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
}

export const ContentSection = ({ title, children }: ContentSectionProps) => {
  return (
    <Section spacing="sm" className="mt-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {children}
    </Section>
  );
};
