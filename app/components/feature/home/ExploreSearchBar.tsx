"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/app/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils/cn";
import { CalendarIcon, Search, X, Sparkles, CalendarDays, DollarSign, Tag } from "lucide-react";

interface ExploreSearchBarProps {
  initialQuery?: string;
  initialFrom?: string;
  initialTo?: string;
  initialFree?: boolean;
  initialPromoted?: boolean;
  initialMultiDate?: boolean;
  initialMaxPrice?: number;
}

export function ExploreSearchBar({
  initialQuery = "",
  initialFrom,
  initialTo,
  initialFree = false,
  initialPromoted = false,
  initialMultiDate = false,
  initialMaxPrice,
}: ExploreSearchBarProps = {}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (!initialFrom) return undefined;
    return {
      from: new Date(initialFrom),
      to: initialTo ? new Date(initialTo) : undefined,
    };
  });
  const [calOpen, setCalOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [today, setToday] = useState<Date | undefined>(undefined);

  // Filtros de chips
  const [free, setFree] = useState(initialFree);
  const [promoted, setPromoted] = useState(initialPromoted);
  const [multiDate, setMultiDate] = useState(initialMultiDate);
  const [maxPriceInput, setMaxPriceInput] = useState(
    initialMaxPrice ? String(initialMaxPrice) : "",
  );
  const [onlyEvents, setOnlyEvents] = useState(false);
  const [onlySites, setOnlySites] = useState(false);

  useEffect(() => { setToday(new Date()); }, []);

  const clearDates = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRange(undefined);
    setCalOpen(false);
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if (free) params.set("free", "1");
    if (promoted) params.set("promoted", "1");
    if (multiDate) params.set("type", "multi-date");
    const parsed = parseInt(maxPriceInput, 10);
    if (!isNaN(parsed) && parsed > 0) params.set("maxPrice", String(parsed));
    router.push(params.toString() ? `/explorar?${params.toString()}` : "/explorar");
  }, [free, maxPriceInput, multiDate, promoted, query, router]);

  const buildParams = useCallback((overrides: {
    free?: boolean;
    promoted?: boolean;
    multiDate?: boolean;
    maxPrice?: string;
    clearRange?: boolean;
  } = {}) => {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    if (!overrides.clearRange) {
      if (range?.from) params.set("from", range.from.toISOString().split("T")[0]);
      if (range?.to && !isSameDay(range.from!, range.to))
        params.set("to", range.to.toISOString().split("T")[0]);
    }

    const newFree        = overrides.free        ?? free;
    const newPromoted    = overrides.promoted    ?? promoted;
    const newMultiDate   = overrides.multiDate   ?? multiDate;
    const newMaxPrice    = overrides.maxPrice    ?? maxPriceInput;

    if (newFree) params.set("free", "1");
    if (newPromoted) params.set("promoted", "1");
    if (newMultiDate) params.set("type", "multi-date");
    const parsed = parseInt(newMaxPrice, 10);
    if (!isNaN(parsed) && parsed > 0) params.set("maxPrice", String(parsed));
    return params;
  }, [query, range, free, promoted, multiDate, maxPriceInput]);

  const navigateWith = useCallback((overrides: Parameters<typeof buildParams>[0]) => {
    const params = buildParams(overrides);
    router.push(params.toString() ? `/explorar?${params.toString()}` : "/explorar");
  }, [buildParams, router]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      navigateWith({});
    },
    [navigateWith],
  );

  const dateLabel = (() => {
    if (!range?.from) return "Fechas";
    if (!range.to || isSameDay(range.from, range.to))
      return format(range.from, "d MMM yyyy", { locale: es });
    return `${format(range.from, "d MMM", { locale: es })} – ${format(range.to, "d MMM yyyy", { locale: es })}`;
  })();

  const hasRange = Boolean(range?.from);
  const parsedMax = parseInt(maxPriceInput, 10);
  const hasMaxPrice = !isNaN(parsedMax) && parsedMax > 0;

  const chipClass = (active: boolean) =>
    cn(
      "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer select-none",
      active
        ? "border-transparent bg-[#09090B] text-white shadow-dark-float"
        : "border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#09090B]/30 hover:text-[#09090B] hover:shadow-subtle",
    );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Card container con shadow para dar profundidad */}
      <div className="rounded-2xl bg-white shadow-card p-4 sm:p-5 space-y-4">
      {/* Título dentro del card */}
      <div>
        <h2 className="text-2xl font-bold text-[#09090B]" style={{ fontFamily: 'var(--font-heading)' }}>
          ¿Qué hay pa&apos; hacer hoy?
        </h2>
        <p className="mt-0.5 text-sm text-[#71717A]">Eventos, sitios y planes en Ibagué.</p>
      </div>
      {/* Fila principal: input + fechas + buscar */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Buscar eventos, sitios, artistas…"
            className="h-12 w-full rounded-xl border border-[#E4E4E7] bg-[#FAFAFC] pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Date range picker */}
        <div className="relative w-full sm:w-auto">
          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-12 w-full justify-start gap-2 rounded-xl px-4 text-sm bg-[#FAFAFC] border-[#E4E4E7] sm:w-auto sm:min-w-44",
                  hasRange && "border-primary text-primary pr-8",
                )}
              >
                <CalendarIcon className="size-4 shrink-0" />
                <span className="truncate">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                locale={es}
                selected={range}
                onSelect={(r) => {
                  setRange(r);
                  if (r?.from && r?.to && !isSameDay(r.from, r.to)) setCalOpen(false);
                }}
                disabled={today ? { before: today } : undefined}
              />
            </PopoverContent>
          </Popover>
          {hasRange && (
            <button
              type="button"
              onClick={clearDates}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-primary opacity-60 hover:opacity-100"
              aria-label="Limpiar fechas"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Button type="submit" className="h-12 rounded-xl px-6 font-semibold">
          <Search className="size-4" />
          <span className="ml-2">Buscar</span>
        </Button>
      </div>

      {/* Fila de filtros chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Gratis — solo visible si no estamos filtrando solo sitios */}
        {!onlySites && (
        <button
          type="button"
          onClick={() => {
            const next = !free;
            setFree(next);
            if (next) setMaxPriceInput("");
            navigateWith({ free: next, maxPrice: next ? "" : maxPriceInput });
          }}
          className={chipClass(free)}
        >
          <Tag className="size-3.5" />
          Gratis
          {free && <X className="size-3.5" />}
        </button>
        )}

        {/* Precio máximo — solo visible si no estamos filtrando solo sitios */}
        {!onlySites && (
        <Popover open={priceOpen} onOpenChange={setPriceOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={chipClass(hasMaxPrice)}>
              <DollarSign className="size-3.5" />
              {hasMaxPrice ? `Hasta $${parsedMax.toLocaleString("es-CO")}` : "Valor hasta..."}
              {hasMaxPrice && (
                <X
                  className="size-3.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMaxPriceInput("");
                    navigateWith({ maxPrice: "" });
                  }}
                />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Mostrar eventos que cuestan hasta...</p>
            <p className="mb-2 text-[11px] text-muted-foreground/70">(incluye gratuitos)</p>
            <input
              type="number"
              min={0}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPriceOpen(false);
                  navigateWith({ maxPrice: maxPriceInput });
                }
              }}
              placeholder="Ej. 50000"
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[10000, 30000, 50000, 100000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    const val = String(v);
                    setMaxPriceInput(val);
                    setPriceOpen(false);
                    navigateWith({ maxPrice: val });
                  }}
                  className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted"
                >
                  ${(v / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        )}

        {/* Destacados */}
        <button
          type="button"
          onClick={() => { const next = !promoted; setPromoted(next); navigateWith({ promoted: next }); }}
          className={chipClass(promoted)}
        >
          <Sparkles className="size-3.5" />
          Destacados
          {promoted && <X className="size-3.5" />}
        </button>

        {/* Multi-fecha */}
        {!onlySites && (
          <button
            type="button"
            onClick={() => { const next = !multiDate; setMultiDate(next); navigateWith({ multiDate: next }); }}
            className={chipClass(multiDate)}
          >
            <CalendarDays className="size-3.5" />
            Multi-fecha
            {multiDate && <X className="size-3.5" />}
          </button>
        )}

        {/* Limpiar todo */}
        {(free || hasMaxPrice || promoted || multiDate) && (
          <button
            type="button"
            onClick={() => {
              setFree(false);
              setPromoted(false);
              setMultiDate(false);
              setMaxPriceInput("");
              navigateWith({ free: false, promoted: false, multiDate: false, maxPrice: "" });
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      </div>
    </form>
  );
}

