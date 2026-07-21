"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, MapPin, ChevronRight } from "lucide-react";
import type { SessionViewModel } from "../../view-models/SessionViewModel";

interface PublicSessionCardProps {
  session: SessionViewModel;
  /** slug o id del evento padre, para construir el href. */
  parentRef: string;
}

function formatPrice(price: SessionViewModel["price"]): string {
  if (price.isFree) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: price.currency || "COP",
    maximumFractionDigits: 0,
  }).format(price.amount);
}

export function PublicSessionCard({ session, parentRef }: PublicSessionCardProps) {
  const start = new Date(session.startDate);
  const end = new Date(session.endDate);

  const dayLabel = format(start, "EEE", { locale: es }); // vie
  const dayNum = format(start, "d", { locale: es }); // 7
  const monthLabel = format(start, "MMM", { locale: es }); // dic
  // Sesión que cruza la medianoche: sin el día del final, "11:00 — 10:00" parece
  // que la sesión termina antes de empezar.
  const spansDays = start.toDateString() !== end.toDateString();
  const timeRange = spansDays
    ? `${format(start, "HH:mm", { locale: es })} — ${format(end, "d MMM, HH:mm", { locale: es })}`
    : `${format(start, "HH:mm", { locale: es })} — ${format(end, "HH:mm", { locale: es })}`;

  const place = [session.location?.venue, session.location?.city?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/eventos/${parentRef}/sessions/${session.slug || session.id}`}
      className="group flex items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-3 transition-all hover:border-gray-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
      aria-label={`Ver sesión: ${session.title || "sesión"}`}
    >
      {/* Fecha en pastilla */}
      <div
        className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-gray-900 py-2 text-white"
        suppressHydrationWarning
      >
        <span className="text-[10px] font-medium uppercase leading-none opacity-70">
          {dayLabel}
        </span>
        <span className="text-xl font-bold leading-tight">{dayNum}</span>
        <span className="text-[10px] font-medium uppercase leading-none opacity-70">
          {monthLabel}
        </span>
      </div>

      {/* Portada */}
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {session.coverUrl ? (
          <Image
            src={session.coverUrl}
            alt={session.title || "Sesión"}
            fill
            sizes="96px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="truncate font-semibold text-gray-900">
          {session.title || "Sesión"}
        </p>
        <div
          className="flex items-center gap-1.5 text-xs text-gray-500"
          suppressHydrationWarning
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{timeRange}</span>
        </div>
        {place && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{place}</span>
          </div>
        )}
      </div>

      {/* Precio + chevron */}
      <div className="flex shrink-0 flex-col items-end justify-center gap-1 pr-1">
        <span
          className={`text-xs font-semibold ${
            session.price.isFree ? "text-emerald-600" : "text-gray-900"
          }`}
        >
          {formatPrice(session.price)}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
