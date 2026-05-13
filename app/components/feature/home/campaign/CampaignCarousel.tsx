"use client";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/app/components/ui/carousel";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { ResponsivePicture } from "@/app/components/ui/ResponsivePicture";
import { Button } from "@/app/components/ui/button/button";
import { ChevronDown, ChevronUp, Hand, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils/cn";
import { ctaRegistry } from "@/application/cta/cta-registry";
import { CTA } from "@/application/cta/types";
import { useRouter } from "next/navigation";
import { CampaignViewModel } from "@/presentation/campaing/view-models/CampaingViewModel";

interface CampaignCarouselContainerProps {
  campaings: CampaignViewModel[];
}

const CampaignCarouselComponent = ({
  campaings,
}: CampaignCarouselContainerProps) => {
  const carouselData = campaings;
  const DOTS_GROUP_SIZE = 4;

  console.log("esto esta cacheado?")

  const router = useRouter();

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);


  useEffect(() => {
    if (!carouselApi) return;

    const updateCarouselState = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
      setTotalItems(carouselApi.scrollSnapList().length);
    };
    updateCarouselState();

    carouselApi.on("select", updateCarouselState);

    return () => {
      carouselApi.off("select", updateCarouselState);
    };
  }, [carouselApi]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const handleViewportChange = () => {
      setIsMobile(mediaQuery.matches);
      setShowSwipeHint(mediaQuery.matches);
    };

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);

    return () => {
      mediaQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    if (!carouselApi || !isMobile || !showSwipeHint) return;

    const hideHint = () => setShowSwipeHint(false);
    const hintTimeout = setTimeout(hideHint, 3000);

    carouselApi.on("select", hideHint);
    carouselApi.on("pointerDown", hideHint);

    return () => {
      clearTimeout(hintTimeout);
      carouselApi.off("select", hideHint);
      carouselApi.off("pointerDown", hideHint);
    };
  }, [carouselApi, isMobile, showSwipeHint]);

  const scrollToIndex = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index);
      setShowSwipeHint(false);
    },
    [carouselApi],
  );

  const scrollPrev = useCallback(() => {
    carouselApi?.scrollPrev();
    setShowSwipeHint(false);
  }, [carouselApi]);

  const scrollNext = useCallback(() => {
    carouselApi?.scrollNext();
    setShowSwipeHint(false);
  }, [carouselApi]);

  const getProgressiveDotStyle = useCallback(
    (index: number) => {
      if (totalItems <= 1) {
        return "h-2 w-2 opacity-100";
      }

      const rawDistance = Math.abs(currentIndex - index);
      const loopDistance = Math.min(rawDistance, totalItems - rawDistance);

      if (loopDistance === 0) {
        return "h-5 w-2.5 opacity-100";
      }

      if (loopDistance === 1) {
        return "h-3.5 w-2 opacity-80";
      }

      if (loopDistance === 2) {
        return "h-2.5 w-2 opacity-55";
      }

      return "h-2 w-2 opacity-35";
    },
    [currentIndex, totalItems],
  );

  const visibleDots = useMemo(() => {
    const groupStart = Math.floor(currentIndex / DOTS_GROUP_SIZE) * DOTS_GROUP_SIZE;
    const groupEnd = Math.min(groupStart + DOTS_GROUP_SIZE, carouselData.length);

    return carouselData.slice(groupStart, groupEnd).map((campaign, offset) => ({
      campaign,
      index: groupStart + offset,
    }));
  }, [carouselData, currentIndex, DOTS_GROUP_SIZE]);

  const handleExecuteCta = useCallback(
    (cta: CTA) => {
      const registry = ctaRegistry({ router });

      switch (cta.type) {
        case "navigate":
          registry.navigate(cta.entity);
          return;
        case "external_link":
          registry.external_link(cta.entity);
          return;
        default:
          return;
      }
    },
    [router],
  );

  return (
    <div className="relative h-full w-full">
      <Carousel
        orientation="vertical"
        opts={{ loop: true, align: "start" }}
        setApi={setCarouselApi}
        className="h-full w-full"
      >
        <CarouselContent className="h-full">
          {carouselData.map((campaign, index) => {
            const isActive = currentIndex === index;
            return (
              <CarouselItem
                key={campaign.id}
                className="relative h-full overflow-hidden isolate"
              >
                <ResponsivePicture
                  desktop={campaign.images.desktop}
                  tablet={campaign.images.tablet}
                  mobile={campaign.images.mobile}
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 z-10 bg-linear-to-t from-black/95 via-black/50 to-transparent" />
                <div
                  className={cn(
                    "absolute left-4 top-4 z-20 transition-all duration-500 sm:left-6 sm:top-6 lg:left-8 lg:top-8",
                    isActive
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 -translate-y-4",
                  )}
                >
                  <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
                    <span className="text-sm font-medium text-white">
                      {String(currentIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px w-3 bg-white/40" />
                    <span className="text-sm text-white/60">
                      {String(totalItems).padStart(2, "0")}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 z-20 p-3 pb-5 pr-3 sm:p-5 sm:pb-6 sm:pr-6 lg:p-6 lg:pb-7 lg:pr-8">
                  <div className="flex min-h-[210px] flex-col justify-end gap-4 sm:min-h-[240px] lg:min-h-0 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                    <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl">
                      {campaign.isSponsored && (
                        <div
                          className={cn(
                            "mb-3 transition-all duration-500 delay-75",
                            isActive
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-4",
                          )}
                        >
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-linear-to-r from-amber-500/20 to-orange-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-sm">
                            <Sparkles className="h-3 w-3" />
                            Promocionado
                          </span>
                        </div>
                      )}

                      <h2
                        className={cn(
                          "text-lg leading-tight font-bold text-white transition-all duration-500 delay-100 sm:text-2xl lg:text-3xl xl:text-4xl",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4",
                        )}
                      >
                        {campaign.title}
                      </h2>

                      {campaign.description && (
                        <p
                          className={cn(
                            "mt-2 text-sm leading-relaxed text-white/70 transition-all duration-500 delay-150 sm:text-base lg:max-w-xl",
                            isActive
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-4",
                          )}
                        >
                          {campaign.description}
                        </p>
                      )}
                    </div>

                    {campaign?.cta && campaign.cta?.length > 0 && (
                      <div
                        className={cn(
                          "hidden flex-row gap-3 transition-all duration-500 delay-200 sm:flex lg:gap-4 lg:mt-4",
                          isActive
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4",
                        )}
                      >
                        {campaign.cta.map((cta, ctaIndex) => (
                          <Button
                            key={`${cta.id}-${ctaIndex}`}
                            variant={cta.variant ?? "outline"}
                            onClick={() => handleExecuteCta(cta)}
                            className="px-4 py-2 text-sm font-semibold sm:px-5 sm:py-2.5 lg:px-6 lg:py-3 lg:text-base"
                          >
                            {cta.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      <div
        className={cn(
          "absolute inset-x-0 bottom-1/2 z-20 flex translate-y-1/2 items-center justify-center transition-all duration-500 sm:hidden",
          isMobile && showSwipeHint
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/50 px-6 py-4 backdrop-blur-md">
          <div className="animate-bounce">
            <Hand className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium text-white/80">
            Desliza hacia arriba
          </span>
        </div>
      </div>

      <div className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 sm:right-6 sm:gap-3 lg:right-8">
        {/* Up Arrow */}
        <button
          onClick={scrollPrev}
          className="group hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-black/50 active:scale-95 sm:flex lg:h-12 lg:w-12"
          aria-label="Slide anterior"
        >
          <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 lg:h-6 lg:w-6" />
        </button>

        <div className="flex flex-col items-center gap-2 rounded-full bg-black/25 px-2 py-2.5 backdrop-blur-sm sm:px-2.5 sm:py-3">
          {visibleDots.map(({ campaign, index }) => (
            <button
              key={`dot-${campaign.id}-${index}`}
              type="button"
              onClick={() => scrollToIndex(index)}
              className={cn(
                "rounded-full bg-white transition-all duration-300 hover:bg-white/90",
                getProgressiveDotStyle(index),
              )}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Down Arrow */}
        <button
          onClick={scrollNext}
          className="group hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-black/50 active:scale-95 sm:flex lg:h-12 lg:w-12"
          aria-label="Siguiente slide"
        >
          <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5 lg:h-6 lg:w-6" />
        </button>
      </div>
    </div>
  );
};

CampaignCarouselComponent.displayName = "CampaignCarousel";

export const CampaignCarousel = memo(CampaignCarouselComponent);
