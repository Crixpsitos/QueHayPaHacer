import { ShieldCheck } from "lucide-react";
import { fetchEventDetailById } from "@/presentation/events/data/eventDetailFetchers";
import { permissionsFor } from "@/domain/entities/events/teamPolicy";
import type { EventAccessRole } from "@/domain/entities/events/teamAccess";
import { TEAM_ROLE_DESCRIPTION, TEAM_ROLE_LABEL } from "@/domain/entities/events/teamAccess";
import { EventTeamCard } from "./EventTeamCard";
import type { TeamMemberVM } from "../../view-models/StudioEventsViewModel";

/** Aviso compacto para quien está en el equipo sin ser dueño ni editor: qué le permite su rol. */
export function TeamRoleBanner({ role }: { role: EventAccessRole }) {
  if (role === "owner" || role === "editor" || role === "credit") return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-[#E4E4E7] bg-white px-4 py-3" role="note">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#D42F3C]" aria-hidden />
      <p className="text-sm text-[#3F3F46]">
        <span className="font-semibold text-[#09090B]">Estás en el equipo como {TEAM_ROLE_LABEL[role].toLowerCase()}.</span>{" "}
        {TEAM_ROLE_DESCRIPTION[role]}
      </p>
    </div>
  );
}

/** Equipo del evento (dueño + miembros). Lee el evento cacheado (tag `event-<id>`, lo invalida el cambio de rol). */
export async function EventTeamSection({ eventId, role }: { eventId: string; role: EventAccessRole }) {
  const event = await fetchEventDetailById(eventId);
  if (!event) return null;
  const kindByRef = new Map((event.collaborators ?? []).map((c) => [c.refId, c.kind]));
  const team: TeamMemberVM[] = [
    {
      refId: event.author.id,
      displayName: event.author.displayName ?? "Organizador",
      photoURL: event.author.photoURL ?? undefined,
      kind: "user",
      role: "owner",
    },
    ...Object.entries(event.collaboratorsData ?? {}).map(([refId, d]) => ({
      refId,
      displayName: d.displayName,
      photoURL: d.photoURL,
      kind: kindByRef.get(refId) ?? (d.role === "credit" ? "external" : "user"),
      role: d.role,
    })),
  ];
  // Solo el dueño: no hay equipo que mostrar (se arma en el paso de colaboradores del evento).
  if (team.length === 1) return null;
  return <EventTeamCard eventId={eventId} team={team} viewerRole={role} permissions={permissionsFor(role)} />;
}
