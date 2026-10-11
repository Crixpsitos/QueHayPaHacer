"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { cn } from "@/app/lib/utils/cn";
import type { EventViewModel } from "../view-models/EventViewModel";
import type { SessionViewModel } from "../view-models/SessionViewModel";
import { PublicSessionCard } from "./session/PublicSessionCard";
import { PastEventState } from "./PastEventState";
import { isSessionPast, isMultiDateEventPast } from "../utils/eventTemporalUtils";
import { EventHero } from "./detail/EventHero";
import { EventDescription } from "./detail/EventDescription";
import { EventIntro, EventOrganizer, EventShare } from "./detail/EventSections";
import { DateBlock, MobileCtaBar, Ticket, ctaClass } from "./detail/Ticket";
import { formatDateRange, formatPriceSummary } from "./detail/format";

interface MultiDateEventDetailClientProps {
  event: EventViewModel;
  sessions: SessionViewModel[];
  initialLiked: boolean;
  isOwner?: boolean;
}

export function MultiDateEventDetailClient({ event, sessions, initialLiked, isOwner = false }: MultiDateEventDetailClientProps) {
  const parentRef = event.slug || event.id;
  const allPast = isMultiDateEventPast(sessions);
  const upcoming = sessions.filter((s) => !isSessionPast(s.endDate));
  // La boleta muestra la próxima fecha; si todas pasaron, la primera.
  const next = upcoming[0] ?? sessions[0];
  const lastEnd = sessions.reduce((max, s) => (s.endDate > max ? s.endDate : max), sessions[0]?.endDate ?? "");
  const count = sessions.length;
  const countLabel = `${count} ${count === 1 ? "fecha" : "fechas"}`;
  const priceLabel = count > 0 ? formatPriceSummary(sessions.map((s) => s.price)) : null;
  const showCta = upcoming.length > 0;

  const chooseCta = (
    <a href="#fechas" className={ctaClass}>
      Elegir fecha
    </a>
  );

  return (
    <>
      <Section spacing="md" as="article" className={cn("pt-4 sm:pt-8", showCta && "pb-28 lg:pb-14")} containerClassName="max-w-7xl">
        {isOwner && (
          <Link
            href={`/eventos/${event.id}/edit?step=sessions`}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E4E4E7] bg-white px-4 py-3 text-sm transition-colors hover:border-[#09090B]"
          >
            <span className="flex items-center gap-2 font-medium text-[#09090B]">
              <LayoutDashboard className="size-4 shrink-0 text-[#71717A]" aria-hidden="true" />
              Este es tu evento
            </span>
            <span className="shrink-0 font-semibold text-[#E63946]">Administrar sesiones</span>
          </Link>
        )}

        <EventHero event={event} dateLabel="Varias fechas" />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-14">
          <div className="lg:col-span-8">
            <EventIntro event={event} initialLiked={initialLiked} />
          </div>

          <aside aria-label="Entrada" className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              {next ? (
                <Ticket
                  stub={
                    <div className="space-y-4">
                      <p className="text-sm text-white/60">{upcoming.length > 0 ? "Próxima fecha" : "Primera fecha"}</p>
                      <DateBlock date={next.startDate} />
                      <p className="text-sm font-medium">
                        {countLabel}
                        <span className="block font-normal text-white/70">{formatDateRange(sessions[0].startDate, lastEnd)}</span>
                      </p>
                    </div>
                  }
                >
                  <div>
                    <p className="text-sm text-[#71717A]">Entrada</p>
                    <p className="font-heading text-3xl font-bold tracking-tight text-[#09090B] tabular-nums">{priceLabel}</p>
                  </div>
                  {allPast ? <PastEventState variant="event" /> : chooseCta}
                </Ticket>
              ) : (
                <p className="rounded-3xl border border-dashed border-[#E4E4E7] bg-white p-6 text-sm text-[#71717A]">
                  Este evento aún no tiene fechas publicadas.
                </p>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-14 lg:col-span-8">
            <EventDescription doc={event.description} />

            <section id="fechas" aria-labelledby="fechas-titulo" className="scroll-mt-24 space-y-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="fechas-titulo" className="font-heading text-2xl font-semibold tracking-tight text-[#09090B]">
                  {allPast ? "Fechas del evento" : "Elige una fecha"}
                </h2>
                {count > 0 && <p className="text-sm text-[#71717A] tabular-nums">{countLabel}</p>}
              </div>

              {count > 0 ? (
                <ul className="space-y-3">
                  {sessions.map((session) => (
                    <li key={session.id}>
                      <PublicSessionCard session={session} parentRef={parentRef} isPast={isSessionPast(session.endDate)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[#E4E4E7] px-6 py-12 text-center text-[#71717A]">
                  Este evento aún no tiene fechas publicadas.
                </p>
              )}
            </section>

            <EventOrganizer event={event} />
            <EventShare event={event} path={`/eventos/${parentRef}`} />
          </div>
        </div>
      </Section>

      {showCta && priceLabel && (
        <MobileCtaBar price={priceLabel} sub={countLabel}>
          {chooseCta}
        </MobileCtaBar>
      )}
    </>
  );
}
