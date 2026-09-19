import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Section } from "@/app/components/layout/shared/Section";

const VERIFICATION_IMAGE = "/banners/creator-verification.jpg";

export function CreatorVerificationBanner() {
  return (
    <Section spacing="sm">
      <div className="relative isolate min-h-72 overflow-hidden rounded-2xl bg-zinc-950 shadow-card sm:min-h-80">
        <Image
          src={VERIFICATION_IMAGE}
          alt="Creador presentando una actividad ante su comunidad"
          fill
          sizes="(max-width: 1536px) 100vw, 1536px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/65 to-black/20" aria-hidden />

        <div className="relative flex min-h-72 max-w-2xl flex-col justify-center px-6 py-9 text-white sm:min-h-80 sm:px-10 lg:px-12">
          <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verificación para creadores
          </span>
          <h2 className="max-w-xl text-2xl font-bold sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
            ¿Organizas experiencias que mueven la ciudad?
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            Cuéntanos sobre tu trayectoria y solicita el reconocimiento como creador verificado por QHPA.
          </p>
          <Button asChild size="lg" className="mt-6 w-fit bg-white text-foreground shadow-none hover:bg-white/90">
            <Link href="/contactanos">
              Quiero verificarme
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}