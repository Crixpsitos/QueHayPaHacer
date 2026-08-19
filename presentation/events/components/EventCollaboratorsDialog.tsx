"use client";

import { useState } from "react";
import Link from "next/link";
import { AtSign, ChevronRight, Globe, Link2, Loader2, Music2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/app/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { buildProfileHref } from "@/presentation/profile/lib/profileHref";
import { EXTERNAL_TYPE_LABEL } from "@/presentation/studio/components/collaborators/ExternalProfileForm";
import {
  getExternalProfileAction,
  type ExternalProfilePublic,
} from "@/app/actions/events/get-external-profile.action";

const initials = (name: string) => name.slice(0, 2).toUpperCase();

type CollaboratorsData = Record<
  string,
  { displayName: string; photoURL?: string; role: "editor" | "viewer" | "credit" }
>;

interface Props {
  collaborators?: { refId: string; kind: "user" | "external" }[];
  collaboratorsData?: CollaboratorsData;
  className?: string;
}

/**
 * Créditos del evento en el detalle: AvatarGroup que abre un modal con la lista.
 * Usuario → link a su perfil. Externo → Dialog con su info (bio + redes),
 * cargada bajo demanda.
 */
export function EventCollaboratorsDialog({ collaborators, collaboratorsData, className }: Props) {
  const [open, setOpen] = useState(false);
  const [external, setExternal] = useState<ExternalProfilePublic | null>(null);
  const [loadingExt, setLoadingExt] = useState(false);

  const kindByRef = new Map((collaborators ?? []).map((c) => [c.refId, c.kind]));
  const list = Object.entries(collaboratorsData ?? {}).map(([refId, d]) => ({
    refId,
    kind: kindByRef.get(refId) ?? (d.role === "credit" ? "external" : "user"),
    displayName: d.displayName,
    photoURL: d.photoURL,
    role: d.role,
  }));

  if (list.length === 0) return null;

  const openExternal = async (refId: string) => {
    setLoadingExt(true);
    setExternal(null);
    const res = await getExternalProfileAction(refId);
    setLoadingExt(false);
    if (res.success && res.profile) setExternal(res.profile);
  };

  return (
    <div className={className}>
      <p className="text-xs text-gray-500">Con la colaboración de</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
        aria-label="Ver colaboradores"
      >
        <AvatarGroup>
          {list.slice(0, 4).map((c) => (
            <Avatar key={c.refId} className="size-7">
              <AvatarImage src={c.photoURL} alt={c.displayName} />
              <AvatarFallback className="text-[10px]">{initials(c.displayName)}</AvatarFallback>
            </Avatar>
          ))}
          {list.length > 4 && (
            <AvatarGroupCount className="size-7 text-xs">+{list.length - 4}</AvatarGroupCount>
          )}
        </AvatarGroup>
        <span className="text-sm font-medium text-gray-700">
          {list.length} colaborador{list.length > 1 ? "es" : ""}
        </span>
      </button>

      {/* Modal con la lista */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              Colaboradores
            </DialogTitle>
            <DialogDescription>Personas y entidades acreditadas en este evento.</DialogDescription>
          </DialogHeader>

          <ul className="space-y-1">
            {list.map((c) => {
              const row = (
                <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-slate-50">
                  <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={c.photoURL} alt={c.displayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {c.kind === "external" ? "Perfil externo" : "Cuenta · ver perfil"}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              );

              return (
                <li key={c.refId}>
                  {c.kind === "user" ? (
                    <Link
                      href={buildProfileHref({ id: c.refId, displayName: c.displayName })}
                      onClick={() => setOpen(false)}
                    >
                      {row}
                    </Link>
                  ) : (
                    <button type="button" className="w-full text-left" onClick={() => void openExternal(c.refId)}>
                      {row}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalle del externo */}
      <Dialog
        open={loadingExt || external !== null}
        onOpenChange={(o) => {
          if (!o) {
            setExternal(null);
            setLoadingExt(false);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          {loadingExt || !external ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border border-gray-200">
                    <AvatarImage src={external.photoURL} alt={external.displayName} />
                    <AvatarFallback className="bg-slate-100 text-sm font-semibold text-slate-600">
                      {initials(external.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{external.displayName}</DialogTitle>
                    <DialogDescription>{EXTERNAL_TYPE_LABEL[external.type]}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {external.bio && <p className="text-sm text-slate-600">{external.bio}</p>}

              {external.socialLinks && (
                <div className="flex flex-wrap gap-2">
                  <SocialLink href={external.socialLinks.instagram} icon={AtSign} label="Instagram" />
                  <SocialLink href={external.socialLinks.facebook} icon={Link2} label="Facebook" />
                  <SocialLink href={external.socialLinks.tiktok} icon={Music2} label="TikTok" />
                  <SocialLink href={external.socialLinks.website} icon={Globe} label="Sitio web" />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SocialLink({
  href,
  icon: Icon,
  label,
}: {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  if (!href) return null;
  const url = href.startsWith("http") ? href : `https://${href.replace(/^@/, "")}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  );
}
