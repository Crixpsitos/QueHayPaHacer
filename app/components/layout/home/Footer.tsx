import Link from "next/link";
import { Container } from "../shared/Container";

export  const Footer = async () => {


  const getCurrentYear = async () => {
    "use cache";
    return new Date().getFullYear();
  }

  const year = await getCurrentYear();

  return (
    <footer className="border-t border-zinc-200 bg-background/95 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      <Container className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>© {year} Que Hay Pa Hacer?</p>
        <nav aria-label="Footer" className="flex items-center gap-4">
          <Link href="/contact" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Contacto
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacidad
          </Link>
          <Link href="/terms" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
            Terminos
          </Link>
        </nav>
      </Container>
    </footer>
  );
};
