import { Crown, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { PROFESSIONAL_TYPE_LABEL } from "@/presentation/profile/lib/professionalType";
import type { TeamMemberVM } from "../../view-models/StudioEventsViewModel";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

interface EventTeamCardProps {
  team: TeamMemberVM[];
}

export function EventTeamCard({ team }: EventTeamCardProps) {
  const owner = team.find((m) => m.role === "owner");
  const collaborators = team.filter((m) => m.role === "collaborator");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <header className="mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="h-4 w-4 text-slate-400" />
          Equipo del evento
        </h3>
        <p className="mt-0.5 text-xs text-slate-400">Dueño y colaboradores de este evento.</p>
      </header>

      <div className="space-y-2">
        {owner && <Member member={owner} />}
        {collaborators.map((m) => (
          <Member key={m.uid} member={m} />
        ))}
      </div>
    </div>
  );
}

function Member({ member }: { member: TeamMemberVM }) {
  const isOwner = member.role === "owner";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5">
      <Avatar className="h-9 w-9 border border-gray-200">
        <AvatarImage src={member.photoURL} alt={member.displayName} />
        <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
          {initials(member.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{member.displayName}</p>
          {isOwner ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Crown className="h-3 w-3" />
              Dueño
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              Colaborador
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-400">
          {member.brandName ? `${member.brandName} · ` : ""}
          {PROFESSIONAL_TYPE_LABEL[member.professionalType]}
        </p>
      </div>
    </div>
  );
}
