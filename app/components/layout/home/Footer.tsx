import Link from "next/link";
import { Container } from "../shared/Container";
import { FooterYear } from "./FooterYear";

const LINKS = [
  { href: "/eventos", label: "Eventos" },
  { href: "/donde-ir", label: "¿Dónde ir?" },
  { href: "/eventos/create", label: "Crear evento" },
  { href: "/premium", label: "Premium" },
  { href: "/contactanos", label: "Contáctanos" },
];

export const Footer = () => {
  return (
    <footer className="bg-[#09090B] py-10 text-sm text-white/60">
      <Container className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="text-base font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
            Que Hay Pa Hacer?
          </p>
          <p className="leading-relaxed">
            La cartelera de Ibagué: eventos, planes y sitios para salir, aportados por la comunidad.
          </p>
        </div>
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
        <span>© <FooterYear /> Que Hay Pa Hacer?</span>
        <span className="flex gap-5">
          <Link href="/terminos" className="transition-colors hover:text-white">Términos y condiciones</Link>
          <Link href="/privacidad" className="transition-colors hover:text-white">Política de privacidad</Link>
        </span>
      </Container>
    </footer>
  );
};
