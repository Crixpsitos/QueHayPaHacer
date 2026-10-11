"use client";

import { can, TEAM_ROLE_LABEL } from "@/domain/entities/events/teamAccess";
import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { ExternalLink, LayoutDashboard, MapPin, Pencil, Users } from "lucide-react";
import { Section } from "@/app/components/layout/shared/Section";
import { cn } from "@/app/lib/utils/cn";
import type { EventViewModel } from "../view-models/EventViewModel";
import { registerEventAction } from "@/app/actions/events/register-event.action";
import { recordExternalRegistrationClickAction } from "@/app/actions/studio/record-external-registration-click.action";
import { EventAttendeesDialog } from "./EventAttendeesDialog";
import { PastEventState } from "./PastEventState";
import { isEventPast } from "../utils/eventTemporalUtils";
import { EventHero } from "./detail/EventHero";
import { EventDescription } from "./detail/EventDescription";
import { Lightbox, MediaStrip, buildSlides } from "./detail/EventMedia";
import { EventPlace, type LinkedSiteInfo } from "./detail/EventPlace";
import { BackLink, EventIntro, EventOrganizer, EventShare } from "./detail/EventSections";
import { DateBlock, MobileCtaBar, RegisteredChip, Ticket, ctaClass } from "./detail/Ticket";
import { AttentionRing, Reveal } from "@/app/components/motion/primitives";
import { ReportButton } from "@/presentation/shared/components/ReportButton";
import { dateParts, formatPrice, formatTimeRange } from "./detail/format";

// Lazy — solo se carga si el usuario abre el modal
const EventRegistrationModal = lazy(() =>
  import("./EventRegistrationModal").then((m) => ({ default: m.EventRegistrationModal })),
);

const secondaryBtn =
  "inline-flex items-center gap-2 rounded-xl border border-[#E4E4E7] bg-white px-4 py-2.5 text-sm font-semibold text-[#09090B] transition-colors hover:border-[#09090B]";

/** Rol de equipo con acceso al Studio del evento (distinto del dueño). */
export type TeamViewerRole = "editor" | "viewer" | "checkin";

interface EventDetailClientProps {
  event: EventViewModel;
  initialLiked: boolean;
  initialRegistered: boolean;
  /** True cuando el usuario que ve el evento es su organizador. */
  isOwner?: boolean;
  /** Rol de equipo de quien ve el evento (calculado en servidor); solo muestra accesos, no autoriza. */
  teamRole?: TeamViewerRole;
  /** True cuando el organizador tiene plan Premium (acceso al Estudio). */
  isPremiumOwner?: boolean;
  /** Ruta a compartir (usada por el detalle de sesión para compartir la sesión). */
  shareUrl?: string;
  /** Enlace de regreso (p.ej. al evento padre desde una sesión). */
  backLink?: { href: string; label: string };
  /** Si se pasa, el dueño ve un botón "Editar sesión" que apunta aquí. */
  editSessionHref?: string;
  /** Si el evento tiene location.siteId, info mínima del sitio para mostrar la card. */
  linkedSite?: LinkedSiteInfo;
  /** Si se pasa, el registro y el compartir se asocian a la SESIÓN. */
  sessionId?: string;
}

export function EventDetailClient({
  event,
  initialLiked,
  initialRegistered,
  isOwner = false,
  teamRole,
  isPremiumOwner = false,
  shareUrl,
  backLink,
  editSessionHref,
  sessionId,
  linkedSite,
}: EventDetailClientProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(initialRegistered);

  const isPast = isEventPast(event.endDate);
  const registrations = event.analytics?.registrations ?? 0;
  const capacity = event.capacity ?? 0;
  const isOverCapacity = capacity > 0 && registrations >= capacity;
  const usesModal = event.registrationType === "internal" || event.registrationType === "form";
  // El aviso de cupo lleno solo aplica a los flujos con modal (internal, form).
  const showCapacityWarning = isOverCapacity && usesModal;

  const slides = buildSlides(event.mainImage, event.media);
  const mediaOffset = event.mainImage?.url ? 1 : 0;
  const price = formatPrice(event.price);
  const d = dateParts(event.startDate);
  const timeRange = formatTimeRange(event.startDate, event.endDate);
  const { venue, city } = event.location;
  const place = [venue, city?.name].filter(Boolean).join(", ");

  const pastBlocked = isPast && !isOwner && !isRegistered;
  const alreadyIn = isRegistered && usesModal;
  const showCta = !pastBlocked && !isOwner && event.registrationType !== "none" && !alreadyIn;

  const register = () => {
    if (event.registrationType === "external") {
      if (event.externalUrl) {
        // Registra el click ANTES de redirigir (no bloqueante).
        void recordExternalRegistrationClickAction(event.id);
        window.open(event.externalUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      setRegistrationModalOpen(true);
    }
  };

  const ctaButton = (
    <button type="button" onClick={register} className={ctaClass}>
      Inscribirme
      {event.registrationType === "external" && <ExternalLink className="size-4" aria-hidden="true" />}
    </button>
  );

  let action: React.ReactNode;
  if (pastBlocked) {
    action = <PastEventState variant={sessionId ? "session" : "event"} parentEventHref={backLink?.href} />;
  } else if (isOwner) {
    action = (
      <div className="space-y-3 rounded-2xl bg-[#F4F4F5] p-4">
        <p className="text-sm font-semibold text-[#09090B]">{editSessionHref ? "Esta sesión es tuya" : "Este es tu evento"}</p>
        <div className="flex flex-wrap gap-2">
          {isPremiumOwner ? (
            // Plan Premium → acceso al Estudio.
            <Link href={`/studio/events/${event.id}`} className={cn(secondaryBtn, "border-[#09090B] bg-[#09090B] text-white hover:bg-[#18181B]")}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Ir a estudio
            </Link>
          ) : usesModal ? (
            // Cuenta normal → modal simple con la lista de inscritos.
            <EventAttendeesDialog
              eventId={event.id}
              eventTitle={event.title}
              trigger={
                <button type="button" className={cn(secondaryBtn, "border-[#09090B] bg-[#09090B] text-white hover:bg-[#18181B]")}>
                  <Users className="size-4" aria-hidden="true" />
                  Ver inscritos
                </button>
              }
            />
          ) : !editSessionHref ? (
            <p className="text-sm text-[#71717A]">Este evento no recolecta inscripciones en la plataforma.</p>
          ) : null}
          {editSessionHref && (
            <Link href={editSessionHref} className={secondaryBtn}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar sesión
            </Link>
          )}
        </div>
      </div>
    );
  } else if (event.registrationType === "none") {
    action = (
      <p className="rounded-2xl bg-[#F4F4F5] p-4 text-sm text-[#3F3F46]">
        <span className="font-semibold text-[#09090B]">Entrada libre.</span> No necesitas inscribirte: llega el día del evento.
      </p>
    );
  } else if (alreadyIn) {
    action = (
      <RegisteredChip animateIn={!initialRegistered}>
        Ya estás registrado {sessionId ? "en esta fecha" : "en este evento"}
      </RegisteredChip>
    );
  } else {
    action = (
      <div className="space-y-2">
        <AttentionRing>{ctaButton}</AttentionRing>
        {event.registrationType === "external" && event.externalUrl && (
          <p className="text-center text-xs text-[#71717A]">Te llevamos al sitio del organizador para completar la inscripción.</p>
        )}
      </div>
    );
  }

  if (teamRole && !isOwner) {
    action = (
      <div className="space-y-4">
        <div className="space-y-3 rounded-2xl bg-[#F4F4F5] p-4">
          <p className="text-sm font-semibold text-[#09090B]">Estás en el equipo como {TEAM_ROLE_LABEL[teamRole].toLowerCase()}</p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/studio/events/${event.id}`} className={cn(secondaryBtn, "border-[#09090B] bg-[#09090B] text-white hover:bg-[#18181B]")}>
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Abrir en Studio
            </Link>
            {can(teamRole, "edit_event") && (
              <Link href={editSessionHref ?? `/eventos/${event.id}/edit`} className={secondaryBtn}>
                <Pencil className="size-4" aria-hidden="true" />
                {editSessionHref ? "Editar sesión" : "Editar evento"}
              </Link>
            )}
          </div>
        </div>
        {action}
      </div>
    );
  }

  return (
    <>
      {lightboxIndex !== null && <Lightbox slides={slides} initial={lightboxIndex} onClose={() => setLightboxIndex(null)} />}

      {registrationModalOpen && (
        <Suspense fallback={null}>
          <EventRegistrationModal
            event={event}
            price={price}
            isFree={event.price.isFree}
            capacity={capacity > 0 ? capacity : undefined}
            registrations={registrations}
            isOverCapacity={showCapacityWarning}
            onConfirm={async (formData) => {
              if (!event.id) return;
              const result = await registerEventAction({
                eventId: event.id,
                ...(sessionId ? { sessionId } : {}),
                registrationType: event.registrationType as "internal" | "form",
                ...(formData ? { formData: formData as Record<string, string | string[] | number | boolean | null | Record<string, unknown>> } : {}),
              });
              if (result.success || result.alreadyRegistered) setIsRegistered(true);
              return result;
            }}
            onClose={() => setRegistrationModalOpen(false)}
          />
        </Suspense>
      )}

      <Section spacing="md" as="article" className={cn("pt-4 sm:pt-8", showCta && "pb-28 lg:pb-14")} containerClassName="max-w-7xl">
        {backLink && (
          <div className="mb-4">
            <BackLink href={backLink.href} label={backLink.label} />
          </div>
        )}

        <EventHero
          event={event}
          dateLabel={`${d.weekdayShort} ${d.day} ${d.monthShort}`}
          onOpen={slides.length > 0 ? () => setLightboxIndex(0) : undefined}
        />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-14">
          <div className="lg:col-span-8">
            <EventIntro event={event} initialLiked={initialLiked} sessionId={sessionId} />
          </div>

          <aside aria-label="Entrada" className="lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
            <div className="lg:sticky lg:top-24">
              <Ticket
                stub={
                  <div className="space-y-4">
                    <DateBlock date={event.startDate} />
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium tabular-nums">{timeRange}</p>
                      {place && (
                        <p className="flex items-start gap-1.5 text-white/70">
                          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                          {place}
                        </p>
                      )}
                    </div>
                  </div>
                }
              >
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#71717A]">Entrada</p>
                    <p className="font-heading text-3xl font-bold tracking-tight text-[#09090B] tabular-nums">{price}</p>
                  </div>
                  {capacity > 0 && (
                    <p className={cn("text-right text-sm tabular-nums", isOverCapacity ? "font-semibold text-amber-700" : "text-[#71717A]")}>
                      {isOverCapacity ? "Cupo lleno" : `${(capacity - registrations).toLocaleString("es-CO")} cupos libres`}
                    </p>
                  )}
                </div>
                {capacity > 0 && (
                  <div className="space-y-1.5">
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-[#F4F4F5]"
                      role="progressbar"
                      aria-label="Cupos ocupados"
                      aria-valuemin={0}
                      aria-valuemax={capacity}
                      aria-valuenow={Math.min(registrations, capacity)}
                    >
                      <div
                        className={cn("h-full rounded-full", isOverCapacity ? "bg-amber-500" : "bg-[#09090B]")}
                        style={{ width: `${Math.min((registrations / capacity) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#71717A] tabular-nums">
                      {registrations.toLocaleString("es-CO")} de {capacity.toLocaleString("es-CO")} inscritos
                    </p>
                  </div>
                )}
                <div id="ticket-cta" aria-live="polite">
                  {action}
                </div>
              </Ticket>
            </div>
          </aside>

          <div className="min-w-0 space-y-14 lg:col-span-8">
            <EventDescription doc={event.description} />
            <MediaStrip slides={slides} offset={mediaOffset} onOpen={setLightboxIndex} />
            <Reveal><EventPlace event={event} linkedSite={linkedSite} /></Reveal>
            <Reveal><EventOrganizer event={event} /></Reveal>
            <Reveal><EventShare event={event} path={shareUrl ?? `/eventos/${event.slug || event.id}`} sessionId={sessionId} /></Reveal>
            <ReportButton targetType="event" targetId={event.id} sessionId={sessionId} isOwner={isOwner} className="-mt-10" />
          </div>
        </div>
      </Section>

      {showCta && (
        <MobileCtaBar price={price} sub={`${d.day} ${d.monthShort}, ${timeRange}`}>
          {ctaButton}
        </MobileCtaBar>
      )}
    </>
  );
}
