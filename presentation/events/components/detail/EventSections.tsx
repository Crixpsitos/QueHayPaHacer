"use client";

import Link from "next/link";
import { ChevronLeft, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { SocialShareBar } from "@/presentation/shared/components/SocialShareBar";
import { shareEventAction } from "@/app/actions/events/share-event.action";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import { SITE_URL } from "@/app/lib/site";
import type { EventViewModel } from "../../view-models/EventViewModel";
import { EventDetailActions } from "../EventDetailActions";
import { EventCollaboratorsDialog } from "../EventCollaboratorsDialog";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex max-w-full items-center gap-1 text-sm font-medium text-[#71717A] hover:text-[#09090B]">
      <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">Volver a {label}</span>
    </Link>
  );
}

/** Título (único h1 de la página), bajada, etiquetas y like/vistas. */
export function EventIntro({
  event,
  initialLiked,
  sessionId,
}: {
  event: EventViewModel;
  initialLiked: boolean;
  sessionId?: string;
}) {
  const tags = event.categoryInfo?.tags ?? [];
  return (
    <header className="space-y-5">
      <h1 className="font-heading text-[2.5rem] font-bold leading-[1.02] tracking-[-0.03em] text-balance text-[#09090B] sm:text-5xl lg:text-[3.5rem]">
        {event.title}
      </h1>
      {event.shortDescription && (
        <p className="max-w-[60ch] text-lg leading-relaxed text-pretty text-[#52525B]">{event.shortDescription}</p>
      )}
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#71717A]" aria-label="Etiquetas">
          {tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      )}
      <EventDetailActions event={event} initialLiked={initialLiked} sessionId={sessionId} />
    </header>
  );
}

/** Organizador + colaboradores acreditados. */
export function EventOrganizer({ event }: { event: EventViewModel }) {
  const name = event.author?.displayName || "Organizador";
  const avatar = (
    <Avatar className="size-12">
      {event.author?.photoURL && <AvatarImage src={event.author.photoURL} alt="" />}
      <AvatarFallback className="bg-[#F4F4F5]">
        <User className="size-5 text-[#A1A1AA]" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <section aria-label="Organizador" className="flex flex-col gap-5 rounded-2xl border border-[#E4E4E7] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {avatar}
        <div className="min-w-0">
          <p className="text-sm text-[#71717A]">Organiza</p>
          <p className="truncate font-heading text-lg font-semibold text-[#09090B]">{name}</p>
        </div>
        {event.author?.id && (
          <Link
            href={buildProfileHref(event.author)}
            className="ml-auto shrink-0 rounded-full border border-[#E4E4E7] px-4 py-2 text-sm font-semibold text-[#09090B] transition-colors hover:border-[#09090B] sm:ml-4"
            aria-label={`Ver perfil de ${name}`}
          >
            Ver perfil
          </Link>
        )}
      </div>
      <EventCollaboratorsDialog collaborators={event.collaborators} collaboratorsData={event.collaboratorsData} />
    </section>
  );
}

/** Compartir. La URL se arma con SITE_URL (igual en servidor y cliente). */
export function EventShare({ event, path, sessionId }: { event: EventViewModel; path: string; sessionId?: string }) {
  return (
    <section aria-labelledby="compartir" className="space-y-3">
      <h2 id="compartir" className="text-sm font-medium text-[#71717A]">
        Compartir
      </h2>
      {/* El label en mayúsculas de SocialShareBar se oculta: el h2 lo reemplaza. */}
      <SocialShareBar
        url={`${SITE_URL}${path}`}
        title={event.title}
        className="[&>p]:hidden"
        onShare={() => {
          void shareEventAction(event.id, sessionId);
        }}
      />
    </section>
  );
}
