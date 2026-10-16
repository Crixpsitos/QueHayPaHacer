"use client";
import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Hand } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/app/components/ui/carousel";
import { cn } from "@/app/lib/utils/cn";
import { trackCampaign } from "@/app/lib/campaignTrack";
import { CampaignDots } from "./CampaignDots";
import { useCampaignCarousel } from "./useCampaignCarousel";

interface CampaignCarouselProps {
  /** Slides ya renderizados en el servidor (ver CampaignSlide). */
  slides: { id: string; node: ReactNode }[];
}

const arrow =
  "group hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-white/40 hover:bg-black/50 active:scale-95 sm:flex lg:h-12 lg:w-12";

const CampaignCarouselComponent = ({ slides }: CampaignCarouselProps) => {
  const { setApi, currentIndex, totalItems, showSwipeHint, scrollTo, scrollPrev, scrollNext } = useCampaignCarousel();
  const ids = slides.map((s) => s.id);
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Analítica: una vista por campaña y sesión, solo cuando el banner se ve (≥50%) y la pestaña está activa.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const id = ids[currentIndex];
    if (!visible || !id) return;
    const key = `qhpa:banner-view:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    trackCampaign(id, "view");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, currentIndex]);

  // Clics en los botones del slide (enlaces con data-campaign-id).
  const onClickCapture = (e: React.MouseEvent) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>("[data-campaign-id]")?.dataset.campaignId;
    if (id) trackCampaign(id, "click");
  };

  return (
    <div ref={rootRef} onClickCapture={onClickCapture} className="relative h-full w-full">
      {/* Vertical en todos los tamaños; sin gutter (mt-0/pt-0) para que no se asome el slide siguiente. */}
      <Carousel orientation="vertical" opts={{ loop: true, align: "start" }} setApi={setApi} className="h-full w-full">
        <CarouselContent className="mt-0 h-full">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id}
              data-active={currentIndex === index}
              className="group/slide relative h-full overflow-hidden isolate pt-0"
            >
              {slide.node}
              {/* Indicador numérico — solo en sm+ */}
              <div
                className={cn(
                  "absolute left-4 top-4 z-20 hidden transition-all duration-500 sm:block sm:left-6 sm:top-6 lg:left-8 lg:top-8",
                  currentIndex === index ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
                )}
              >
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 backdrop-blur-md">
                  <span className="text-sm font-medium text-white">{String(currentIndex + 1).padStart(2, "0")}</span>
                  <span className="h-px w-3 bg-white/40" />
                  <span className="text-sm text-white/60">{String(totalItems).padStart(2, "0")}</span>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div
        className={cn(
          "absolute inset-x-0 bottom-1/2 z-20 flex translate-y-1/2 items-center justify-center transition-all duration-500 sm:hidden",
          showSwipeHint ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/50 px-6 py-4 backdrop-blur-md">
          <div className="animate-bounce-y">
            <Hand className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs font-medium text-white/80">Desliza hacia arriba</span>
        </div>
      </div>

      {/* Celular: puntos a la derecha */}
      <CampaignDots
        ids={ids}
        current={currentIndex}
        total={totalItems}
        onSelect={scrollTo}
        className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1.5 sm:hidden"
      />

      {/* Escritorio: puntos con flechas */}
      <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2 sm:flex sm:right-6 sm:gap-3 lg:right-8">
        <button onClick={scrollPrev} className={arrow} aria-label="Slide anterior">
          <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 lg:h-6 lg:w-6" />
        </button>
        <CampaignDots
          ids={ids}
          current={currentIndex}
          total={totalItems}
          onSelect={scrollTo}
          progressive
          className="flex flex-col items-center gap-2 rounded-full bg-black/25 px-2 py-2.5 backdrop-blur-sm sm:px-2.5 sm:py-3"
        />
        <button onClick={scrollNext} className={arrow} aria-label="Siguiente slide">
          <ChevronDown className="h-5 w-5 transition-transform group-hover:translate-y-0.5 lg:h-6 lg:w-6" />
        </button>
      </div>
    </div>
  );
};

CampaignCarouselComponent.displayName = "CampaignCarousel";

export const CampaignCarousel = memo(CampaignCarouselComponent);
