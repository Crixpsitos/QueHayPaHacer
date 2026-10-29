import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarRange, ClipboardList, LifeBuoy, ListChecks, Users } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { Ticket, ctaClass } from "@/presentation/events/components/detail/Ticket";
import {
  ComparisonTable,
  CopCountUp,
  Cta,
  FaqList,
  FeatureItem,
  Orbs,
  Reveal,
  StepsTimeline,
  TiltCard,
} from "@/app/components/feature/premium/motion";
import {
  FOUNDER_LIMIT,
  FOUNDER_MONTHS,
  PREMIUM_PRICE_COP,
  formatCOP,
} from "@/presentation/profile/lib/membership";

export const metadata: Metadata = {
  title: "Premium para creadores",
  description: `Eventos de varias fechas, control de asistencia, formularios y estadísticas para creadores de Ibagué. ${formatCOP(PREMIUM_PRICE_COP)} al mes; los primeros ${FOUNDER_LIMIT} creadores tienen ${FOUNDER_MONTHS} meses gratis.`,
  alternates: { canonical: "/premium" },
};

const CONTACT_HREF = "/contactanos?motivo=premium";

const FEATURES = [
  { Icon: CalendarRange, title: "Eventos de varias fechas", body: "Temporadas, ciclos o talleres con varias funciones en una sola página, cada una con su cupo e inscripciones." },
  { Icon: ListChecks, title: "Control de asistencia", body: "Marca quién llegó y quién no desde la lista de inscritos y sabe cuánta gente de verdad asistió." },
  { Icon: ClipboardList, title: "Formularios personalizados", body: "Pide los datos que necesitas al inscribirse: talla, empresa o nivel. Pide solo lo necesario." },
  { Icon: BarChart3, title: "Estudio con estadísticas", body: "Vistas, inscripciones y conversión de cada evento, con exportación a CSV de tus inscritos." },
  { Icon: Users, title: "Colaboradores", body: "Acredita a artistas, aliados y organizaciones en tus eventos y arma tu red." },
  { Icon: LifeBuoy, title: "Soporte prioritario", body: "Tus solicitudes se atienden primero, por correo." },
];

const COMPARISON: [string, boolean, boolean][] = [
  ["Publicar eventos", true, true],
  ["Publicar sitios (siempre gratis)", true, true],
  ["Inscripción en QHPA y lista de inscritos", true, true],
  ["Enlace a inscripción externa", true, true],
  ["Eventos de varias fechas", false, true],
  ["Control de asistencia", false, true],
  ["Formularios personalizados", false, true],
  ["Estudio con estadísticas", false, true],
  ["Colaboradores", false, true],
  ["Soporte prioritario", false, true],
];

const STEPS = [
  { title: "Escríbenos", body: "Cuéntanos quién eres y qué organizas desde el formulario de contacto." },
  { title: "Confirmamos", body: `Si estás entre los primeros ${FOUNDER_LIMIT} creadores, entras como fundador. Si no, te enviamos los datos para pagar por transferencia o Nequi.` },
  { title: "Activamos tu plan", body: `Lo activamos en tu cuenta: ${FOUNDER_MONTHS} meses si eres fundador, un mes por cada pago. Te confirmamos por correo.` },
];

const FAQ = [
  { q: "¿Cómo pago?", a: "Por ahora no hay pago en línea. Cuando nos escribas te enviamos los datos para pagar por transferencia bancaria o Nequi, y activamos tu plan cuando confirmamos el pago." },
  { q: "¿Se renueva solo?", a: "No. Premium dura el tiempo que pagaste y no hay cobros automáticos. Para seguir, nos escribes y renuevas; el tiempo nuevo se suma al que te quede." },
  { q: "¿Qué pasa cuando vence?", a: "Tu cuenta vuelve a Básico. Tus eventos y sitios siguen publicados y la inscripción sigue funcionando; las herramientas Premium se pausan hasta que renueves." },
  { q: "¿Premium me da la verificación?", a: "No. La verificación de creadores es un reconocimiento aparte y gratuito, según tu trayectoria. Premium son herramientas." },
  { q: "¿Qué es el plan fundador?", a: `Los primeros ${FOUNDER_LIMIT} creadores que lo pidan tienen ${FOUNDER_MONTHS} meses de Premium gratis para ayudarnos a llenar la cartelera de Ibagué. Al terminar decides si continúas.` },
];

export default function PremiumPage() {
  return (
    <>
      <div className="relative isolate overflow-hidden">
        <Orbs variant="hero" />
        <Section spacing="md">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div>
              <p className="text-sm font-medium text-[#D42F3C]">Para creadores de Ibagué</p>
              <h1 className="mt-3 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-[#09090B] sm:text-5xl lg:text-6xl">
                Llena tus eventos y sabe quién llegó.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#52525B]">
                Premium suma las herramientas para organizar en serio: funciones en varias fechas, formularios,
                control de asistencia y estadísticas de cada evento.
              </p>
              <p className="mt-6 text-sm text-[#71717A]">
                ¿Solo quieres publicar? Básico es gratis y alcanza para empezar.
              </p>
            </div>

            <TiltCard className="mx-auto w-full max-w-sm">
              <Ticket
                stub={
                  <div>
                    <p className="text-sm text-white/60">Pase Premium</p>
                    <p className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap font-heading text-5xl font-bold leading-[0.85] tracking-tighter tabular-nums sm:text-6xl">
                        <CopCountUp value={PREMIUM_PRICE_COP} />
                      </span>
                      <span className="pb-1 text-sm text-white/70">al mes</span>
                    </p>
                  </div>
                }
              >
                <div className="rounded-xl bg-[#FFF8E6] px-4 py-3">
                  <p className="text-sm font-semibold text-[#09090B]">Plan fundador: {FOUNDER_MONTHS} meses gratis</p>
                  <p className="mt-0.5 text-sm text-[#71717A]">Para los primeros {FOUNDER_LIMIT} creadores que lo pidan.</p>
                </div>
                <Cta href={CONTACT_HREF} className={ctaClass} pulse>
                  Quiero Premium
                </Cta>
                <p className="text-center text-xs leading-relaxed text-[#71717A]">
                  Sin tarjeta ni cobros automáticos. Te respondemos por correo.
                </p>
              </Ticket>
            </TiltCard>
          </div>
        </Section>
      </div>

      <Section spacing="md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#09090B] sm:text-3xl">Qué incluye</h2>
          </Reveal>
          <ul className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ Icon, title, body }, i) => (
              <FeatureItem key={title} index={i} icon={<Icon className="size-5" aria-hidden />} title={title} body={body} />
            ))}
          </ul>
        </div>
      </Section>

      <Section spacing="md">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <Reveal>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">Básico y Premium</h2>
            </Reveal>
            <ComparisonTable rows={COMPARISON} priceCop={PREMIUM_PRICE_COP} />
          </div>

          <div>
            <Reveal>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">Cómo se activa</h2>
            </Reveal>
            <StepsTimeline steps={STEPS} />
          </div>
        </div>
      </Section>

      <div className="relative isolate overflow-hidden">
        <Orbs variant="cta" />
        <Section spacing="md">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">Preguntas frecuentes</h2>
            </Reveal>
            <FaqList items={FAQ} />
            <Reveal className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Cta href={CONTACT_HREF} className={`${ctaClass} sm:w-auto`}>
                Quiero Premium
              </Cta>
              <p className="text-sm text-[#71717A]">
                Al activarlo aceptas los{" "}
                <Link href="/terminos" className="font-medium text-[#D42F3C] hover:underline">
                  términos
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </Section>
      </div>
    </>
  );
}
