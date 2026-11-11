import Link from "next/link";
import { Section } from "@/app/components/layout/shared/Section";

/** Texto propio y visible de «Qué hay hoy»: es lo que lee Google. Sin datos que cambien: se cachea con la página. */
export function TodayGuide() {
  return (
    <Section spacing="sm">
      <div className="grid gap-2 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">Cómo saber qué hacer hoy en Ibagué</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Aquí juntamos los eventos de hoy y las actividades que se repiten cada semana: caminatas, clubes, talleres y planes en sitios de la ciudad. La lista cambia cada día,
          así que lo que ves es lo que sí se puede hacer hoy. Si hoy no hay nada que te guste, mira qué hay este fin de semana.
        </p>
        <p className="text-sm text-muted-foreground">
          También: <Link href="/eventos-este-fin-de-semana-ibague" className="font-medium text-primary-dark underline-offset-2 hover:underline">este fin de semana</Link> ·{" "}
          <Link href="/actividades" className="font-medium text-primary-dark underline-offset-2 hover:underline">todas las actividades</Link> ·{" "}
          <Link href="/donde-ir" className="font-medium text-primary-dark underline-offset-2 hover:underline">dónde ir</Link>
        </p>
      </div>
    </Section>
  );
}
