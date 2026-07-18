"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2, Plus, UserMinus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { notify } from "@/presentation/shared/lib/notify";
import { PROFESSIONAL_TYPE_LABEL } from "@/presentation/profile/lib/professionalType";
import type { FormEventDto } from "@/application/dto/events/EventDto";
import type { Collaborator, UserCollaboratorRole } from "@/domain/entities/studio/Studio";
import { getMyCollaboratorsAction } from "@/app/actions/events/get-my-collaborators.action";
import { ExternalProfileForm } from "@/presentation/studio/components/collaborators/ExternalProfileForm";
import type { CreatedExternal } from "@/app/actions/events/create-external-profile.action";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Colaboradores
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Acredita a colaboradores de tu red en este evento, o crea un perfil externo. Gestiona
          tu red en Estudio → Colaboradores.
        </p>
      </div>

      {/* Acreditados en este evento */}
      {creditedEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500">Acreditados en este evento</p>
          <ul className="space-y-2">
            {creditedEntries.map(([refId, c]) => (
              <li
                key={refId}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 dark:border-zinc-700"
              >
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src={c.photoURL ?? undefined} alt={c.displayName} />
                  <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                    {initials(c.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    {c.displayName}
                  </p>
                  <p className="text-xs capitalize text-slate-400">
                    {c.role === "credit" ? "Externo" : c.role}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(refId)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-zinc-600 dark:text-zinc-300"
                >
                  <UserMinus className="h-3.5 w-3.5" /> Quitar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mi red disponible */}
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Users className="h-4 w-4 text-slate-400" /> Mi red
        </p>
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : available.length === 0 ? (
          <p className="text-xs text-slate-400">
            No hay más colaboradores para acreditar. Invita gente en Estudio → Colaboradores, o crea
            un perfil externo abajo.
          </p>
        ) : (
          <ul className="space-y-2">
            {available.map((c) => (
              <li
                key={c.refId}
                className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 dark:border-zinc-700"
              >
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage src={c.photoURL} alt={c.displayName} />
                  <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                    {initials(c.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {c.displayName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.kind === "external"
                      ? "Externo"
                      : c.professionalType
                        ? PROFESSIONAL_TYPE_LABEL[c.professionalType]
                        : "Profesional"}
                  </p>
                </div>
                {c.kind === "user" && (
                  <select
                    value={roles[c.refId] ?? "viewer"}
                    onChange={(e) =>
                      setRoles((prev) => ({ ...prev, [c.refId]: e.target.value as UserCollaboratorRole }))
                    }
                    className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-indigo-400"
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => addMember(c)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" /> Acreditar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Crear externo rápido */}
      {showExternal ? (
        <ExternalProfileForm onCreated={onExternalCreated} onCancel={() => setShowExternal(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowExternal(true)}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600"
        >
          + Crear un perfil externo (sin cuenta)
        </button>
      )}
    </div>
  );
}
