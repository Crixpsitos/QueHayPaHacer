import Link from "next/link";
import { Container } from "../shared/Container";
import { FooterYear } from "./FooterYear";

export const Footer = () => {
  return (
    <footer className="bg-[#09090B] py-8 text-sm text-white/60">
      <Container className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-white/80 font-semibold">© <FooterYear /> Que Hay Pa Hacer?</p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link href="/contactanos" className="transition-colors hover:text-white">
            Contacto
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-white">
            Privacidad
          </Link>
          <Link href="/terms" className="transition-colors hover:text-white">
            Terminos
          </Link>
        </nav>
      </Container>
    </footer>
  );
};
