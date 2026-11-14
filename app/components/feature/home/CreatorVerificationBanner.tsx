import Link from "@/app/components/ui/navigation/IntentLink"
import { BadgeCheck } from "lucide-react";

export function CreatorVerificationBanner() {
  return (
    <div className="flex h-full flex-col items-start rounded-3xl bg-accent p-5 text-wine sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[0.8125rem] font-semibold">
          <BadgeCheck className="size-4 text-primary-dark" aria-hidden />
          Verificación para creadores
        </span>
        <h2 className="mt-3.5 max-w-xl font-heading text-[1.3125rem] font-bold leading-tight sm:text-3xl">
          ¿Organizas experiencias que mueven la ciudad?
        </h2>
        <p className="mb-4 mt-2 max-w-xl text-sm text-amber-ink sm:mb-5 sm:text-base">
          Cuéntanos tu trayectoria y pide el sello de creador verificado.
        </p>
        <Link
          href="/contactanos"
          className="mt-auto flex min-h-12 w-full items-center justify-center rounded-full border-[1.5px] border-primary-dark bg-card px-6 font-semibold outline-none transition-colors hover:bg-primary-light focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-auto"
        >
          Quiero verificarme
        </Link>
    </div>
  );
}
