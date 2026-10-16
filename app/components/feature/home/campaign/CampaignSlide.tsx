import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ResponsivePicture } from "@/app/components/ui/ResponsivePicture";
import { Button } from "@/app/components/ui/button/button";
import { cn } from "@/app/lib/utils/cn";
import { ctaHref } from "@/application/cta/ctaHref";
import type { CampaignViewModel } from "@/presentation/campaing/view-models/CampaingViewModel";

// Animación de entrada del texto: el carrusel marca el slide activo con data-active (grupo "slide").
const reveal = (delay: string) =>
  cn(
    "transition-all duration-500 opacity-0 translate-y-4 group-data-[active=true]/slide:translate-y-0 group-data-[active=true]/slide:opacity-100",
    delay,
  );

/** Contenido de un slide. Componente de servidor: el cliente solo recibe el carrusel. */
export function CampaignSlide({
  campaign,
  priority,
  endsLabel,
}: {
  campaign: CampaignViewModel;
  priority: boolean;
  /** Ej. "Hasta el 20 de oct" cuando la campaña termina pronto. */
  endsLabel?: string;
}) {
  const { images } = campaign;
  // El alt describe la campaña, no la foto genérica.
  const withAlt = (img: typeof images.desktop) => ({ ...img, alt: campaign.title });

  return (
    <>
      <div className="absolute inset-0">
        <ResponsivePicture
          desktop={withAlt(images.desktop)}
          tablet={withAlt(images.tablet)}
          mobile={withAlt(images.mobile)}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          aspectRatio="auto"
          pictureClassName="h-full"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-linear-to-t from-black/95 via-black/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-20 p-6 pb-6 pr-10 sm:p-5 sm:pb-6 sm:pr-6 lg:p-6 lg:pb-7 lg:pr-8">
        <div className="flex flex-col justify-end gap-3 sm:min-h-[240px] lg:min-h-0 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl">
            {(campaign.isSponsored || endsLabel) && (
              <div className={cn("mb-3 flex flex-wrap gap-2 delay-75", reveal(""))}>
                {campaign.isSponsored && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-linear-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    Promocionado
                  </span>
                )}
                {endsLabel && (
                  <span className="inline-flex items-center rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {endsLabel}
                  </span>
                )}
              </div>
            )}
            <h2 className={cn("text-lg leading-tight font-bold text-white sm:text-2xl lg:text-3xl xl:text-4xl delay-100", reveal(""))}>
              {campaign.title}
            </h2>
            {campaign.description && (
              <p className={cn("mt-1.5 line-clamp-1 text-sm leading-relaxed text-white/70 sm:mt-2 sm:line-clamp-none sm:text-base lg:max-w-xl delay-150", reveal(""))}>
                {campaign.description}
              </p>
            )}
          </div>
          {campaign.cta && campaign.cta.length > 0 && (
            <div className={cn("flex flex-row gap-3 lg:gap-4 lg:mt-4 delay-200", reveal(""))}>
              {campaign.cta.map((cta, i) => {
                const href = ctaHref(cta);
                if (!href) return null;
                const external = /^https?:\/\//.test(href);
                return (
                  <Button
                    key={`${cta.label}-${i}`}
                    asChild
                    variant={i === 0 ? "default" : "outline"}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold sm:px-6 lg:px-7 lg:py-3 lg:text-base"
                  >
                    <Link
                      href={href}
                      data-campaign-id={campaign.id}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {cta.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
