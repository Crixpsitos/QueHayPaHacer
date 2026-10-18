"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Loader2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { changeCollaboratorRoleAction } from "@/app/actions/studio/change-collaborator-role.action";
import {
  TEAM_ROLE_DESCRIPTION,
  TEAM_ROLE_LABEL,
  type EventAccessRole,
  type TeamAction,
  type TeamRole,
} from "@/domain/entities/events/teamAccess";
import { notify } from "@/presentation/shared/lib/notify";
import type { TeamMemberVM } from "../../view-models/StudioEventsViewModel";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

// Orden en el que se ofrecen los roles a una persona con cuenta.
const ROLE_OPTIONS: TeamRole[] = ["editor", "viewer", "checkin", "credit"];

interface EventTeamCardProps {
  eventId: string;
  team: TeamMemberVM[];
  viewerRole: EventAccessRole;
  permissions: Record<TeamAction, boolean>;
}

/** Equipo del evento. Solo el dueño (`manage_team`) ve el selector de rol; el servidor autoriza el cambio. */
export function EventTeamCard({ eventId, team, viewerRole, permissions }: EventTeamCardProps) {
  const owner = team.find((m) => m.role === "owner");
  const members = team.filter((m) => m.role !== "owner");
  const myRole = viewerRole !== "owner" ? TEAM_ROLE_LABEL[viewerRole] : null;

  return (
    <section aria-labelledby="equipo-evento" className="rounded-xl border border-[#E4E4E7] bg-white p-4 sm:p-5">
      <header className="mb-3">
        <h3 id="equipo-evento" className="flex items-center gap-2 font-heading text-base font-semibold text-[#09090B]">
          <Users className="size-4 text-[#71717A]" aria-hidden />
          Equipo del evento
        </h3>
        {myRole ? (
          <p className="mt-0.5 text-xs text-[#71717A]">Tu rol: {myRole}</p>
        ) : (
          <p className="mt-0.5 text-xs text-[#71717A]">
            Elige qué puede hacer cada persona. Los cambios se aplican al instante.
          </p>
        )}
      </header>

      <ul className="space-y-2">
        {owner && <MemberRow eventId={eventId} member={owner} editable={false} />}
        {members.map((m) => (
          <MemberRow key={m.refId} eventId={eventId} member={m} editable={permissions.manage_team} />
        ))}
      </ul>
    </section>
  );
}

function MemberRow({ eventId, member, editable }: { eventId: string; member: TeamMemberVM; editable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(member.role);
  const isOwner = member.role === "owner";
  const external = member.kind === "external";

  const onChange = (next: string) => {
    const prev = role;
    setRole(next as TeamRole);
    startTransition(async () => {
      const res = await changeCollaboratorRoleAction({ eventId, refId: member.refId, role: next });
      if (res.success) {
        notify.success("Rol actualizado.");
        router.refresh();
      } else {
        setRole(prev);
        notify.error(res.error ?? "No se pudo cambiar el rol.");
      }
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-[#F4F4F5] p-2.5">
      <Avatar className="size-9 border border-[#E4E4E7]">
        <AvatarImage src={member.photoURL} alt="" />
        <AvatarFallback className="bg-[#F4F4F5] text-xs font-semibold text-[#71717A]">
          {initials(member.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#09090B]">{member.displayName}</p>
        {!isOwner && role !== "owner" && (
          <p className="text-xs text-[#71717A]">{external ? "Perfil externo" : TEAM_ROLE_DESCRIPTION[role]}</p>
        )}
      </div>

      {isOwner ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          <Crown className="size-3" aria-hidden />
          Dueño
        </span>
      ) : editable && !external ? (
        <div className="flex items-center gap-2">
          {pending && <Loader2 className="size-4 animate-spin text-[#71717A]" aria-hidden />}
          <Select value={role} onValueChange={onChange} disabled={pending}>
            <SelectTrigger size="sm" aria-label={`Rol de ${member.displayName}`} className="min-w-40 bg-white border-[#E4E4E7]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {TEAM_ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span className="inline-flex items-center rounded-full bg-[#F4F4F5] px-2 py-0.5 text-[11px] font-semibold text-[#3F3F46]">
          {role === "owner" ? "Dueño" : TEAM_ROLE_LABEL[role]}
        </span>
      )}
    </li>
  );
}
