"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, Clock, ChevronRight } from "lucide-react";
import type { SessionViewModel } from "../../view-models/SessionViewModel";
import { cn } from "@/app/lib/utils/cn";
import { isSessionInProgress } from "../../utils/eventTemporalUtils";

interface PublicSessionCardProps {
  session: SessionViewModel;
  /** slug o id del evento padre, para construir el href. */
  parentRef: string;
  /** True si la sesión ya finalizó — activa el estado visual vencido. */
  isPast?: boolean;
}

function formatPrice(price: SessionViewModel["price"]): string {
  if (price.isFree) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: price.currency || "COP",
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export function PublicSessionCard({ session, parentRef, isPast = false }: PublicSessionCardProps) {
  const start = new Date(session.startDate);
  const end = new Date(session.endDate);
  const inProgress = !isPast && isSessionInProgress(session.startDate, session.endDate);

  const dayLabel = format(start, "EEE", { locale: es });
  const dayNum = format(start, "d", { locale: es });
  const monthLabel = format(start, "MMM", { locale: es });
  const spansDays = start.toDateString() !== end.toDateString();
  const timeRange = spansDays
    ? `${format(start, "HH:mm", { locale: es })} \u2014 ${format(end, "d MMM, HH:mm", { locale: es })}`
    : `${format(start, "HH:mm", { locale: es })} \u2014 ${format(end, "HH:mm", { locale: es })}`;

  const place = [session.location?.venue, session.location?.city?.name]
    .filter(Boolean)
    .join(", ");

  const priceLabel = formatPrice(session.price);
  const isFree = session.price.isFree;

  return (
    <Link
      href={`/eventos/${parentRef}/sessions/${session.slug || session.id}`}
      className={cn(
        "group flex overflow-hidden rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946]",
        isPast
          ? "border-[#E4E4E7] bg-[#F4F4F5] opacity-75 hover:opacity-90"
          : "border-[#F4F4F5] bg-white shadow-card hover:border-[#E4E4E7] hover:shadow-hover",
      )}
      aria-label={`Ver sesi\u00f3n: ${session.title || "sesi\u00f3n"}${isPast ? " (finalizada)" : inProgress ? " (en curso)" : ""}`}
    >
      {/* Date pill */}
      <div
        className={cn(
          "flex w-16 shrink-0 flex-col items-center justify-center py-4 text-white",
          isPast ? "bg-[#A1A1AA]" : "bg-[#E63946]",
        )}
        suppressHydrationWarning
      >
        <span className="text-[10px] font-semibold uppercase leading-none tracking-wide opacity-80">
          {dayLabel}
        </span>
        <span className="mt-1 text-2xl font-black leading-none">{dayNum}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide opacity-80">
          {monthLabel}
        </span>
      </div>

      {/* Cover */}
      <div className={cn("relative w-28 shrink-0 overflow-hidden bg-[#F4F4F5]", isPast && "grayscale")}>
        {session.coverUrl ? (
          <Image
            src={session.coverUrl}
            alt={session.title || "Sesi\u00f3n"}
            fill
            sizes="112px"
            className={cn(
              "object-cover",
              !isPast && "transition-transform duration-300 group-hover:scale-105",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="h-7 w-7 text-[#D4D4D8]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-4 py-3">
        <div className="flex items-center gap-2">
          <p className={cn("line-clamp-1 text-sm font-semibold", isPast ? "text-[#71717A]" : "text-[#09090B]")}>
            {session.title || "Sesi\u00f3n del evento"}
          </p>
          {isPast && (
            <span className="shrink-0 rounded-full bg-[#E4E4E7] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#71717A]">
              Finalizada
            </span>
          )}
          {inProgress && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
              En curso
            </span>
          )}
        </div>
        <div
          className="flex items-center gap-1.5 text-xs text-[#A1A1AA]"
          suppressHydrationWarning
        >
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{timeRange}</span>
        </div>
        {place && (
          <div className="flex items-center gap-1.5 text-xs text-[#A1A1AA]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{place}</span>
          </div>
        )}
      </div>

      {/* Price + arrow */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 px-4 py-3">
        {!isPast && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              isFree
                ? "bg-emerald-50 text-emerald-700"
                : "bg-[#F4F4F5] text-[#09090B]",
            )}
          >
            {priceLabel}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-all duration-200",
            isPast
              ? "text-[#D4D4D8]"
              : "text-[#A1A1AA] group-hover:translate-x-0.5 group-hover:text-[#E63946]",
          )}
        />
      </div>
    </Link>
  );
}
