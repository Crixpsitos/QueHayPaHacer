"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  User,
  CalendarDays,
  LayoutDashboard,
  Sparkles,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { renderToHTMLString } from "@tiptap/static-renderer";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { Section } from "@/app/components/layout/shared/Section";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import type { EventViewModel } from "../view-models/EventViewModel";
import type { SessionViewModel } from "../view-models/SessionViewModel";
import { EventDetailActions } from "./EventDetailActions";
import { EventCollaboratorsDialog } from "./EventCollaboratorsDialog";
import { PublicSessionCard } from "./session/PublicSessionCard";
import { PastEventState } from "./PastEventState";
import { cn } from "@/app/lib/utils/cn";
import { isSessionPast, isMultiDateEventPast } from "../utils/eventTemporalUtils";

const extensions = [StarterKit];

// ── Expandable description ────────────────────────────────────────────────────

function ExpandableDescription({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (el.scrollHeight > 240) setOverflows(true);
    });
  }, [html]);

  return (
    <div className="space-y-3">
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          expanded ? "max-h-500" : "max-h-60",
        )}
      >
        <div
          className="tiptap prose prose-sm max-w-none text-[#52525B] focus:outline-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded && overflows && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-[#FAFAFC] to-transparent" />
        )}
      </div>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#09090B] transition-opacity hover:opacity-70"
        >
          {expanded ? (
            <>Leer menos <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>Leer más <ChevronDown className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface MultiDateEventDetailClientProps {
  event: EventViewModel;
  sessions: SessionViewModel[];
  initialLiked: boolean;
  isOwner?: boolean;
}

export function MultiDateEventDetailClient({
  event,
  sessions,
  initialLiked,
  isOwner = false,
}: MultiDateEventDetailClientProps) {
  const [descriptionHtml, setDescriptionHtml] = useState("");

  useEffect(() => {
    if (!event.description) return;
    const raw = renderToHTMLString({
      content: event.description as Parameters<typeof renderToHTMLString>[0]["content"],
      extensions,
    });
    setDescriptionHtml(
      DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: ["p","br","strong","em","u","s","h1","h2","h3","h4","h5","h6","ul","ol","li","a","span","blockquote","code","pre","img"],
        ALLOWED_ATTR: ["href","target","rel","src","alt","class","style"],
      }),
    );
  }, [event.description]);

  const parentRef = event.slug || event.id;
  const allPast = isMultiDateEventPast(sessions);

  const range =
    sessions.length > 0
      ? {
          start: new Date(sessions[0].startDate),
          end: new Date(
            Math.max(...sessions.map((s) => new Date(s.endDate).getTime())),
          ),
        }
      : null;

  const rangeLabel = range
    ? range.start.toDateString() === range.end.toDateString()
      ? format(range.start, "d 'de' MMMM", { locale: es })
      : `Del ${format(range.start, "d 'de' MMMM", { locale: es })} al ${format(range.end, "d 'de' MMMM 'de' yyyy", { locale: es })}`
    : null;

  const tags = event.categoryInfo?.tags ?? [];

  return (
    <Section spacing="md" as="article">
      <div className="mx-auto max-w-screen-2xl space-y-10 px-4 sm:px-6 lg:px-12">

        {/* ── Owner banner ─────────────────────────────────────────── */}
        {isOwner && (
          <Link
            href={`/eventos/${event.id}/edit?step=sessions`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#F4F4F5] bg-white px-4 py-3 shadow-card transition-colors hover:bg-[#FAFAFC]"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[#09090B]">
              <LayoutDashboard className="h-4 w-4 shrink-0 text-[#E63946]" />
              Administrar las sesiones de este evento
            </div>
            <span className="shrink-0 rounded-lg bg-[#FDF2F4] px-3 py-1.5 text-xs font-semibold text-[#E63946]">
              Gestionar
            </span>
          </Link>
        )}

        {/* ── Hero image ───────────────────────────────────────────── */}
        {event.mainImage?.url && (
          <div className="relative aspect-21/9 max-h-130 w-full overflow-hidden rounded-3xl shadow-card">
            <Image
              src={event.mainImage.url}
              alt={`Imagen principal de ${event.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              className="object-cover"
              priority
              fetchPriority="high"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          </div>
        )}

        {/* ── Meta header: título + acciones en una misma línea desktop */}
        <header>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-12">

            {/* Izquierda: badges + título + metadata + tags */}
            <div className="min-w-0 flex-1 space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {event.categoryInfo?.title && (
                  <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-3 py-1 text-xs font-medium text-[#52525B]">
                    {event.categoryInfo.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F4] px-3 py-1 text-xs font-semibold text-[#E63946]">
                  <CalendarDays className="size-3" />
                  Varias fechas
                </span>
                {event.metadata?.isFirstEvent && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Sparkles className="size-3" />
                    Primer evento
                  </span>
                )}
                {event.promotion?.isPromoted && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF8E7] px-3 py-1 text-xs font-semibold text-[#E09F00]">
                    <Star className="size-3 fill-current" />
                    Destacado
                  </span>
                )}
              </div>

              {/* Title */}
              <h1
                className="text-4xl font-bold leading-tight text-[#09090B] sm:text-5xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {event.title}
              </h1>

              {/* Date range + count */}
              {rangeLabel && (
                <div
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#52525B]"
                  suppressHydrationWarning
                >
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4 shrink-0 text-[#E63946]" />
                    <span className="font-medium">{rangeLabel}</span>
                  </span>
                  <span className="text-[#D4D4D8]">·</span>
                  <span className="text-[#71717A]">
                    {sessions.length}{" "}
                    {sessions.length === 1 ? "fecha disponible" : "fechas disponibles"}
                  </span>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#E4E4E7] bg-white px-2.5 py-0.5 text-xs text-[#71717A]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Derecha: like + vistas — en el mismo bloque que el título */}
            <div className="shrink-0 lg:pt-2">
              <EventDetailActions event={event} initialLiked={initialLiked} />
            </div>
          </div>
        </header>

        <Separator />

        {/* ── Descripción ──────────────────────────────────────────── */}
        {descriptionHtml && (
          <section className="space-y-5">
            <h2
              className="text-2xl font-bold text-[#09090B]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Sobre este evento
            </h2>
            <ExpandableDescription html={descriptionHtml} />
          </section>
        )}

        {/* ── Organizador + colaboradores: fila horizontal en desktop */}
        {(event.author?.id || Object.keys(event.collaboratorsData ?? {}).length > 0) && (
          <>
            {descriptionHtml && <Separator />}
            <section>
              <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
                {event.author?.id && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                      Organizado por
                    </p>
                    <Link
                      href={buildProfileHref(event.author)}
                      className="group inline-flex items-center gap-3.5 rounded-xl py-1 transition-opacity hover:opacity-75"
                      aria-label={`Ver perfil de ${event.author.displayName || "el organizador"}`}
                    >
                      <Avatar size="default">
                        {event.author.photoURL && (
                          <AvatarImage
                            src={event.author.photoURL}
                            alt={event.author.displayName}
                          />
                        )}
                        <AvatarFallback className="bg-[#F4F4F5] text-[#09090B]">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold text-[#09090B] transition-colors group-hover:text-[#E63946]">
                          {event.author.displayName || "Organizador"}
                        </p>
                        <p className="text-sm text-[#71717A]">Ver perfil →</p>
                      </div>
                    </Link>
                  </div>
                )}

                {Object.keys(event.collaboratorsData ?? {}).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                      Con la colaboración de
                    </p>
                    <EventCollaboratorsDialog
                      collaborators={event.collaborators}
                      collaboratorsData={event.collaboratorsData}
                    />
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <Separator />

        {/* ── Fechas ─────────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <h2
              className="text-2xl font-bold text-[#09090B]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {allPast ? "Fechas del evento" : "Fechas disponibles"}
            </h2>
            {sessions.length > 0 && (
              <span className="rounded-full bg-[#F4F4F5] px-3 py-0.5 text-sm font-semibold text-[#71717A]">
                {sessions.length}
              </span>
            )}
          </div>

          {allPast ? (
            <PastEventState variant="event" />
          ) : sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <PublicSessionCard
                  key={session.id}
                  session={session}
                  parentRef={parentRef}
                  isPast={isSessionPast(session.endDate)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E4E4E7] bg-[#FAFAFC] px-6 py-16 text-center">
              <CalendarDays className="mx-auto mb-4 h-10 w-10 text-[#D4D4D8]" />
              <p className="text-base font-medium text-[#71717A]">
                Este evento aún no tiene fechas publicadas
              </p>
            </div>
          )}
        </section>
      </div>
    </Section>
  );
}
