import { Container } from "@/app/components/layout/shared/Container";
import { SettingsCenter } from "@/presentation/profile/components/SettingsCenter";
import { ProfileNavActions } from "@/presentation/profile/components/ProfileNavActions";
import { Home } from "lucide-react";
import Link from "next/link";

export default function EventDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <Container as="nav" aria-label="Profile navigation" className="text-sm font-medium">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              aria-label="Go to home page"
              className="font-semibold tracking-tight text-zinc-800 transition-colors hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
            >
              Que hay pa&apos; hacer
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                aria-label="Go to home page"
                className="inline-flex h-9 items-center gap-2 rounded-full px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-brand-violet/10 hover:text-brand-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
              >
                <Home className="size-5 shrink-0" />
                <span>Inicio</span>
              </Link>
              <ProfileNavActions />
              <SettingsCenter />
            </div>
          </div>
        </Container>
      </header>
      <main>{children}</main>
    </div>
  );
}
