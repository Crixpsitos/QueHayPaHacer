"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { User, CalendarDays, LayoutDashboard } from "lucide-react";
import { renderToHTMLString } from "@tiptap/static-renderer";
import DOMPurify from "dompurify";
import StarterKit from "@tiptap/starter-kit";
import { Badge } from "@/app/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { Separator } from "@/app/components/ui/separator";
import { Section } from "@/app/components/layout/shared/Section";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import type { EventViewModel } from "../view-models/EventViewModel";
import type { SessionViewModel } from "../view-models/SessionViewModel";
import { EventDetailActions } from "./EventDetailActions";
import { EventCollaboratorsDialog } from "./EventCollaboratorsDialog";
import { PublicSessionCard } from "./session/PublicSessionCard";

const extensions = [StarterKit];

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

  // Rango que cubren las sesiones visibles (vienen ordenadas por startDate asc,
  // pero el último endDate no tiene por qué ser el de la última sesión).
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
      : `Del ${format(range.start, "d 'de' MMMM", { locale: es })} al ${format(range.end, "d 'de' MMMM", { locale: es })}`
    : null;

  return (
    <Section spacing="md" as="article">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Banner del dueño */}
        {isOwner && (
          <Link
            href={`/events/${event.id}/edit?step=sessions`}
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100"
          >
            <span className="text-sm font-medium text-gray-800">
              Este es tu evento con múltiples fechas
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <LayoutDashboard className="h-4 w-4" />
              Gestionar sesiones
            </span>
          </Link>
        )}

        {/* Hero — imagen principal. max-h: a 16/9 puro mide ~650px en desktop y se
            come la primera pantalla; capado deja ver título, fechas y autor de una. */}
        {event.mainImage?.url && (
          <div className="relative aspect-[16/9] max-h-[420px] w-full overflow-hidden rounded-2xl">
            <Image
              src={event.mainImage.url}
              alt={`Imagen principal de ${event.title}`}
              fill
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-cover"
              priority
              fetchPriority="high"
            />
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {event.categoryInfo?.title && (
            <Badge variant="secondary" className="text-xs">
              {event.categoryInfo.title}
            </Badge>
          )}
          <Badge className="border-0 bg-violet-100 text-xs text-violet-700">
            <CalendarDays className="mr-1 size-3" />
            Varias fechas
          </Badge>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 break-words sm:text-3xl">
          {event.title}
        </h1>

        {/* Resumen del rango: responde "¿cuándo?" sin tener que bajar a la lista. */}
        {rangeLabel && (
          <p
            className="flex items-center gap-2 text-sm font-medium text-gray-700"
            suppressHydrationWarning
          >
            <CalendarDays className="size-4 shrink-0 text-gray-400" />
            {rangeLabel}
            <span className="text-gray-400">
              · {sessions.length} {sessions.length === 1 ? "fecha" : "fechas"}
            </span>
          </p>
        )}

        {/* Tags */}
        {event.categoryInfo?.tags && event.categoryInfo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.categoryInfo.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="border-gray-200 text-xs text-gray-500">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Autor */}
        {event.author?.id ? (
          <Link
            href={buildProfileHref(event.author)}
            className="flex items-center gap-3 hover:underline"
            aria-label={`Ver perfil de ${event.author.displayName || "el organizador"}`}
          >
            <Avatar size="sm">
              {event.author?.photoURL && (
                <AvatarImage src={event.author.photoURL} alt={event.author.displayName} />
              )}
              <AvatarFallback>
                <User className="h-4 w-4 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs text-gray-500">Organizado por</p>
              <p className="text-sm font-semibold text-gray-900">
                {event.author?.displayName || "Organizador"}
              </p>
            </div>
          </Link>
        ) : null}

        {/* Colaboradores acreditados */}
        <EventCollaboratorsDialog
          collaborators={event.collaborators}
          collaboratorsData={event.collaboratorsData}
        />

        {/* Like / Share / Analytics */}
        <EventDetailActions event={event} initialLiked={initialLiked} />

        {/* Descripción */}
        {descriptionHtml && (
          <>
            <Separator />
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-900">Descripción</h2>
              <div
                className="tiptap prose prose-sm max-w-none break-words text-gray-700 focus:outline-none"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
          </>
        )}

        {/* Sesiones / fechas — a ancho completo: PublicSessionCard es horizontal
            (pastilla + portada + info + precio) y trunca en una columna estrecha. */}
        <Separator />
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Fechas del evento{" "}
            <span className="text-gray-400">({sessions.length})</span>
          </h2>
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <PublicSessionCard
                  key={session.id}
                  session={session}
                  parentRef={parentRef}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              Este evento aún no tiene fechas publicadas.
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
