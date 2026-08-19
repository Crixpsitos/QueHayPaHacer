"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Check, Loader2, Plus, UserMinus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { notify } from "@/presentation/shared/lib/notify";
import { PROFESSIONAL_TYPE_LABEL } from "@/presentation/profile/lib/professionalType";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { Collaborator, UserCollaboratorRole } from "@/domain/entities/studio/Studio";
import { getMyCollaboratorsAction } from "@/app/actions/events/get-my-collaborators.action";
import { ExternalProfileForm } from "@/presentation/studio/components/collaborators/ExternalProfileForm";
import type { CreatedExternal } from "@/app/actions/events/create-external-profile.action";
import { cn } from "@/app/lib/utils/cn";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

const ROLE_LABEL: Record<string, string> = {
  viewer: "Visualizador",
  editor: "Editor",
};

/**
 * Step del wizard (solo cuentas profesionales) para acreditar colaboradores de
 * MI red en el evento. Todo vive en el estado del form (collaborators /
 * collaboratorsData) y se persiste con el save del evento — no requiere borrador.
 */
export function StepCollaborators({ form }: { form: UseFormReturn<FormEventDto> }) {
  const collaboratorsData = form.watch("collaboratorsData") ?? {};
  const collaborators = form.watch("collaborators") ?? [];

  const [roster, setRoster] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Record<string, UserCollaboratorRole>>({});
  const [showExternal, setShowExternal] = useState(false);

  useEffect(() => {
    getMyCollaboratorsAction().then((res) => {
      setLoading(false);
      if (res.success) setRoster(res.collaborators ?? []);
      else notify.error(res.error ?? "No se pudo cargar tu red.");
    });
  }, []);

  const creditedIds = new Set(Object.keys(collaboratorsData));
  const available = roster.filter((c) => !creditedIds.has(c.refId));

  const credit = (
    refId: string,
    kind: "user" | "external",
    displayName: string,
    photoURL: string | undefined,
    role: "editor" | "viewer" | "credit",
  ) => {
    form.setValue("collaborators", [...collaborators, { refId, kind }], { shouldDirty: true });
    form.setValue(
      "collaboratorsData",
      { ...collaboratorsData, [refId]: { displayName, photoURL, role } },
      { shouldDirty: true },
    );
  };

  const addMember = (member: Collaborator) => {
    const role = member.kind === "external" ? "credit" : roles[member.refId] ?? "viewer";
    credit(member.refId, member.kind, member.displayName, member.photoURL, role);
  };

  const removeMember = (refId: string) => {
    form.setValue(
      "collaborators",
      collaborators.filter((c) => c.refId !== refId),
      { shouldDirty: true },
    );
    const next = { ...collaboratorsData };
    delete next[refId];
    form.setValue("collaboratorsData", next, { shouldDirty: true });
  };

  const onExternalCreated = (ext: CreatedExternal) => {
    credit(ext.refId, "external", ext.displayName, ext.photoURL, "credit");
    setRoster((prev) => [
      { refId: ext.refId, kind: "external", displayName: ext.displayName, photoURL: ext.photoURL },
      ...prev,
    ]);
    setShowExternal(false);
  };

  const creditedEntries = Object.entries(collaboratorsData);

  return (
    <div className="space-y-4">

      {/* Acreditados en este evento */}
      {creditedEntries.length > 0 && (
        <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#71717A]">
            Acreditados en este evento
          </p>
          <ul className="space-y-2">
            {creditedEntries.map(([refId, c]) => (
              <li
                key={refId}
                className="flex items-center gap-3 rounded-xl border border-[#F4F4F5] px-3 py-2.5"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={c.photoURL ?? undefined} alt={c.displayName} />
                  <AvatarFallback className="bg-[#F4F4F5] text-xs font-semibold text-[#71717A]">
                    {initials(c.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#09090B]">{c.displayName}</p>
                  <p className="text-xs text-[#71717A]">
                    {c.role === "credit" ? "Perfil externo" : (ROLE_LABEL[c.role] ?? c.role)}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Check className="size-3" /> Acreditado
                </span>
                <button
                  type="button"
                  onClick={() => removeMember(refId)}
                  aria-label="Quitar colaborador"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#71717A] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <UserMinus className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mi red */}
      <div className="rounded-2xl border border-[#F4F4F5] bg-white p-5 shadow-card">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#71717A]">
          <Users className="size-3.5" /> Mi red
        </p>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-[#71717A]">
            <Loader2 className="size-4 animate-spin" /> Cargando tu red…
          </p>
        ) : available.length === 0 ? (
          <p className="text-sm text-[#A1A1AA]">
            No hay más colaboradores para acreditar. Invita personas en{" "}
            <span className="font-medium text-[#71717A]">Estudio → Colaboradores</span>, o crea un
            perfil externo abajo.
          </p>
        ) : (
          <ul className="space-y-2">
            {available.map((c) => (
              <li
                key={c.refId}
                className="flex items-center gap-3 rounded-xl border border-[#F4F4F5] px-3 py-2.5"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={c.photoURL} alt={c.displayName} />
                  <AvatarFallback className="bg-[#F4F4F5] text-xs font-semibold text-[#71717A]">
                    {initials(c.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#09090B]">{c.displayName}</p>
                  <p className="text-xs text-[#71717A]">
                    {c.kind === "external"
                      ? "Perfil externo"
                      : c.professionalType
                        ? PROFESSIONAL_TYPE_LABEL[c.professionalType]
                        : "Profesional"}
                  </p>
                </div>
                {c.kind === "user" && (
                  <select
                    value={roles[c.refId] ?? "viewer"}
                    onChange={(e) =>
                      setRoles((prev) => ({
                        ...prev,
                        [c.refId]: e.target.value as UserCollaboratorRole,
                      }))
                    }
                    className="h-8 rounded-lg border border-[#E4E4E7] bg-white px-2.5 text-xs text-[#09090B] outline-none transition-colors focus:border-[#E63946]"
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => addMember(c)}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors",
                    "bg-[#E63946] text-white hover:bg-[#9B0A26]",
                  )}
                >
                  <Plus className="size-3.5" /> Acreditar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Crear perfil externo */}
      {showExternal ? (
        <ExternalProfileForm onCreated={onExternalCreated} onCancel={() => setShowExternal(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowExternal(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E4E4E7] bg-white px-4 py-3 text-sm font-medium text-[#71717A] transition-colors hover:border-[#A1A1AA] hover:text-[#09090B]"
        >
          <Plus className="size-4" />
          Crear perfil externo (sin cuenta)
        </button>
      )}
    </div>
  );
}
