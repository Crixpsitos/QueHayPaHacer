"use client";

import { useState } from "react";
import { Building2, Check, LogOut, Mail, UserMinus, UserPlus, Users, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { notify } from "@/presentation/shared/lib/notify";
import { PROFESSIONAL_TYPE_LABEL } from "@/presentation/profile/lib/professionalType";
import { inviteCollaboratorAction } from "@/app/actions/studio/invite-collaborator.action";
import { respondCollaboratorInvitationAction } from "@/app/actions/studio/respond-collaborator-invitation.action";
import { removeCollaboratorAction } from "@/app/actions/studio/remove-collaborator.action";
import { leaveEntityAction } from "@/app/actions/studio/leave-entity.action";
import type {
  CollaboratorVM,
  InvitationVM,
  StudioCollaboratorsViewModel,
} from "../../view-models/StudioCollaboratorsViewModel";

const initials = (name: string) => name.slice(0, 2).toUpperCase();
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

function TypeBadge({ type }: { type: CollaboratorVM["professionalType"] }) {
  const styles = {
    organizer: "bg-purple-50 text-purple-700",
    business: "bg-amber-50 text-amber-700",
    government: "bg-blue-50 text-blue-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[type]}`}>
      {PROFESSIONAL_TYPE_LABEL[type]}
    </span>
  );
}

export function CollaboratorsView({ data }: { data: StudioCollaboratorsViewModel }) {
  const [collaborators, setCollaborators] = useState<CollaboratorVM[]>(data.collaborators);
  const [entities, setEntities] = useState<CollaboratorVM[]>(data.entities);
  const [invitations, setInvitations] = useState<InvitationVM[]>(data.invitations);
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    const res = await inviteCollaboratorAction(email);
    setIsInviting(false);
    if (res.success) {
      notify.success(`Invitación enviada en nombre de ${data.myEntityName}.`);
      setEmail("");
    } else {
      notify.error(res.error ?? "No se pudo enviar la invitación.");
    }
  };

  const handleRespond = async (invitation: InvitationVM, accept: boolean) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
    if (accept) {
      // Me uno a SU entidad → aparezco como colaborador de esa entidad.
      setEntities((prev) => [
        {
          uid: invitation.id,
          displayName: invitation.fromDisplayName,
          brandName: invitation.fromBrandName,
          photoURL: invitation.fromPhotoURL,
          professionalType: invitation.professionalType,
        },
        ...prev,
      ]);
    }
    const res = await respondCollaboratorInvitationAction(invitation.id, accept);
    if (res.success) {
      notify.success(
        accept ? `Ahora colaboras con ${invitation.fromDisplayName}.` : "Invitación rechazada.",
      );
    } else {
      notify.error(res.error ?? "No se pudo procesar la invitación.");
    }
  };

  const handleRemoveCollaborator = async (c: CollaboratorVM) => {
    setCollaborators((prev) => prev.filter((x) => x.uid !== c.uid));
    const res = await removeCollaboratorAction(c.uid);
    if (res.success) notify.success(`${c.displayName} fue quitado de tu entidad.`);
    else notify.error(res.error ?? "No se pudo quitar al colaborador.");
  };

  const handleLeaveEntity = async (entity: CollaboratorVM) => {
    setEntities((prev) => prev.filter((x) => x.uid !== entity.uid));
    const res = await leaveEntityAction(entity.uid);
    if (res.success) notify.success(`Saliste de ${entity.displayName}.`);
    else notify.error(res.error ?? "No se pudo salir de la entidad.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Colaboradores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestiona quién colabora con tu entidad y en qué entidades colaboras tú. Un evento con
          colaboradores aparece en ambos perfiles profesionales.
        </p>
      </div>

      {/* Invitar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-sm font-semibold text-slate-900">Invitar colaborador</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Invitas en nombre de <span className="font-semibold text-indigo-700">{data.myEntityName}</span>.
          Solo puedes agregar cuentas que también sean profesionales.
        </p>
        <form onSubmit={handleInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@profesional.com"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />
          </div>
          <button
            type="submit"
            disabled={isInviting || !email.trim()}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {isInviting ? "Enviando…" : "Invitar"}
          </button>
        </form>
      </div>

      {/* Invitaciones recibidas */}
      {invitations.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Invitaciones recibidas{" "}
            <span className="font-normal text-slate-400">({invitations.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Entidades que te invitaron a colaborar. Si aceptas, te unes a su entidad.
          </p>

          <ul className="mt-3 space-y-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src={inv.fromPhotoURL} alt={inv.fromDisplayName} />
                  <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
                    {initials(inv.fromDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {inv.fromDisplayName}
                    </p>
                    <TypeBadge type={inv.professionalType} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {inv.fromBrandName ? `${inv.fromBrandName} · ` : ""}Te invitó a su entidad el{" "}
                    {formatDate(inv.invitedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRespond(inv, true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRespond(inv, false)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Denegar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Colaboradores de mi entidad */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Users className="h-4 w-4 text-slate-400" />
            Colaboradores de {data.myEntityName}{" "}
            <span className="font-normal text-slate-400">({collaborators.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Personas que invitaste a tu entidad.</p>

          {collaborators.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Aún no tienes colaboradores.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {collaborators.map((c) => (
                <li key={c.uid} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={c.photoURL} alt={c.displayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.displayName}</p>
                      <TypeBadge type={c.professionalType} />
                    </div>
                    {c.brandName && <p className="truncate text-xs text-slate-400">{c.brandName}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveCollaborator(c)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Entidades en las que colaboro */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Building2 className="h-4 w-4 text-slate-400" />
            Entidades en las que colaboro{" "}
            <span className="font-normal text-slate-400">({entities.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">Entidades que te invitaron y aceptaste.</p>

          {entities.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No colaboras con ninguna entidad.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {entities.map((entity) => (
                <li key={entity.uid} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={entity.photoURL} alt={entity.displayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(entity.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{entity.displayName}</p>
                      <TypeBadge type={entity.professionalType} />
                    </div>
                    {entity.brandName && <p className="truncate text-xs text-slate-400">{entity.brandName}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleLeaveEntity(entity)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Salir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
