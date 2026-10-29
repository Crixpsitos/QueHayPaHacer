import Link from "next/link";
import Image from "next/image";
import { Container } from "../shared/Container";
import { FooterYear } from "./FooterYear";
import { TE_PROTEJO_URL } from "../shared/LegalDocument";
import { InstallPrompt } from "@/app/components/pwa/InstallPrompt";

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
          <p className="flex items-center gap-2 text-base font-semibold text-white" style={{ fontFamily: "var(--font-heading)" }}>
            <Image src="/logo.png" alt="" width={28} height={28} className="size-7" />
            Que Hay Pa Hacer?
          </p>
          <p className="leading-relaxed">
            La cartelera de Ibagué: eventos, planes y sitios para salir, aportados por la comunidad.
          </p>
          <InstallPrompt />
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
        <span className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/terminos" className="transition-colors hover:text-white">Términos y condiciones</Link>
          <Link href="/privacidad" className="transition-colors hover:text-white">Política de privacidad</Link>
          <a href={TE_PROTEJO_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">Denunciar abuso infantil</a>
        </span>
      </Container>
    </footer>
  );
};
