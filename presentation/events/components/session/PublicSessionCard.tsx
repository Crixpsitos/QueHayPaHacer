import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SessionViewModel } from "../../view-models/SessionViewModel";
import { cn } from "@/app/lib/utils/cn";
import { isSessionInProgress } from "../../utils/eventTemporalUtils";
import { dateParts, formatPrice, formatTimeRange } from "../detail/format";

interface PublicSessionCardProps {
  session: SessionViewModel;
  /** slug o id del evento padre, para construir el href. */
  parentRef: string;
  /** True si la sesión ya finalizó — activa el estado visual vencido. */
  isPast?: boolean;
}

const notch = "absolute left-0 size-4 -translate-x-1/2 rounded-full border border-[#E4E4E7] bg-[#FAFAFC]";

/** Fecha de un evento multi-fecha como talón de boleta compacto. */
export function PublicSessionCard({ session, parentRef, isPast = false }: PublicSessionCardProps) {
  const inProgress = !isPast && isSessionInProgress(session.startDate, session.endDate);
  const d = dateParts(session.startDate);
  const timeRange = formatTimeRange(session.startDate, session.endDate);
  const place = [session.location?.venue, session.location?.city?.name].filter(Boolean).join(", ");
  const title = session.title || "Sesión del evento";
  const price = formatPrice(session.price);

  return (
    <Link
      href={`/eventos/${parentRef}/sessions/${session.slug || session.id}`}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42F3C] focus-visible:ring-offset-2",
        isPast ? "border-[#F4F4F5] text-[#A1A1AA]" : "border-[#E4E4E7] hover:border-[#09090B]",
      )}
      aria-label={`${title}, ${d.weekday} ${d.day} de ${d.month}, ${timeRange}${isPast ? " (finalizada)" : inProgress ? " (en curso)" : ""}`}
    >
      {/* Talón: fecha */}
      <div
        className={cn(
          "flex w-20 shrink-0 flex-col items-center justify-center py-4 sm:w-24",
          isPast ? "bg-[#F4F4F5] text-[#A1A1AA]" : "bg-[#09090B] text-white",
        )}
      >
        <span className={cn("text-xs capitalize", !isPast && "text-white/60")}>{d.weekdayShort}</span>
        <span className="font-heading text-3xl font-bold leading-none tracking-tight tabular-nums">{d.day}</span>
        <span className="mt-0.5 text-xs font-medium">{d.monthShort}</span>
      </div>

      {/* Perforación vertical */}
      <div aria-hidden="true" className="relative w-0">
        <span className={cn(notch, "-top-2")} />
        <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-[#E4E4E7]" />
        <span className={cn(notch, "-bottom-2")} />
      </div>

      {/* Cuerpo */}
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-5 pr-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className={cn("truncate font-semibold", !isPast && "text-[#09090B]")}>{title}</p>
            {isPast && <span className="shrink-0 rounded-full bg-[#F4F4F5] px-2 py-0.5 text-xs font-medium text-[#71717A]">Finalizada</span>}
            {inProgress && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
                En curso
              </span>
            )}
          </div>
          <p className={cn("text-sm tabular-nums", !isPast && "text-[#52525B]")}>{timeRange}</p>
          {place && <p className={cn("truncate text-sm", !isPast && "text-[#71717A]")}>{place}</p>}
          {!isPast && <p className="text-sm font-semibold text-[#09090B] tabular-nums sm:hidden">{price}</p>}
        </div>
        {!isPast && (
          <span className="hidden shrink-0 font-heading text-base font-semibold text-[#09090B] tabular-nums sm:block">
            {price}
          </span>
        )}
        <ChevronRight
          className={cn("size-5 shrink-0", isPast ? "text-[#D4D4D8]" : "text-[#A1A1AA] transition-transform group-hover:translate-x-0.5 group-hover:text-[#09090B]")}
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}
