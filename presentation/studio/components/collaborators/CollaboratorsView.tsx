"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Inbox,
  Loader2,
  Search,
  Send,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { notify } from "@/presentation/shared/lib/notify";
import { PROFESSIONAL_TYPE_LABEL } from "@/presentation/profile/lib/professionalType";
import type { UserSearchItem } from "@/domain/entities/studio/Studio";
import { searchCollaboratorsAction } from "@/app/actions/studio/search-collaborators.action";
import { inviteCollaboratorsAction } from "@/app/actions/studio/invite-collaborators.action";
import { respondCollaboratorInvitationAction } from "@/app/actions/studio/respond-collaborator-invitation.action";
import { cancelInvitationAction } from "@/app/actions/studio/cancel-invitation.action";
import { removeCollaboratorAction } from "@/app/actions/studio/remove-collaborator.action";
import { ExternalProfileForm } from "./ExternalProfileForm";
import type {
  CollaboratorVM,
  InvitationVM,
  SentInvitationVM,
  StudioCollaboratorsViewModel,
} from "../../view-models/StudioCollaboratorsViewModel";

const initials = (name: string) => name.slice(0, 2).toUpperCase();
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(iso));

export function CollaboratorsView({ data }: { data: StudioCollaboratorsViewModel }) {
  const [received, setReceived] = useState<InvitationVM[]>(data.received);
  const [sent, setSent] = useState<SentInvitationVM[]>(data.sent);
  const [network, setNetwork] = useState<CollaboratorVM[]>(data.network);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserSearchItem[]>([]);
  const [showExternal, setShowExternal] = useState(false);
  const [sending, setSending] = useState(false);

  // Búsqueda con debounce (350ms). Todo el setState va dentro del timeout para no
  // llamar setState sincrónicamente en el cuerpo del efecto.
  useEffect(() => {
    const query = q.trim();
    const t = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const res = await searchCollaboratorsAction(query);
      setSearching(false);
      if (res.success) setResults(res.results ?? []);
      else notify.error(res.error ?? "No se pudo buscar.");
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const isSelected = (uid: string) => selected.some((s) => s.uid === uid);
  const toggleSelect = (u: UserSearchItem) =>
    setSelected((prev) =>
      prev.some((s) => s.uid === u.uid) ? prev.filter((s) => s.uid !== u.uid) : [...prev, u],
    );

  const handleSend = async () => {
    if (selected.length === 0) return;
    setSending(true);
    const res = await inviteCollaboratorsAction(
      selected.map((u) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        professionalType: u.professionalType,
      })),
    );
    setSending(false);
    if (!res.success) {
      notify.error(res.error ?? "No se pudieron enviar las invitaciones.");
      return;
    }
    setSent((prev) => [
      ...selected.map((u) => ({
        id: `tmp-${u.uid}`,
        toDisplayName: u.displayName,
        toPhotoURL: u.photoURL,
        toEmail: u.email,
        invitedAt: new Date().toISOString(),
      })),
      ...prev,
    ]);
    notify.success(`${selected.length} invitación(es) enviada(s).`);
    setSelected([]);
    setResults([]);
    setQ("");
  };

  const handleRespond = async (inv: InvitationVM, accept: boolean) => {
    setReceived((prev) => prev.filter((i) => i.id !== inv.id));
    const res = await respondCollaboratorInvitationAction(inv.id, accept);
    if (res.success) {
      if (accept) {
        // Relación bidireccional: quien me invitó entra a MI red también.
        setNetwork((prev) =>
          prev.some((c) => c.refId === inv.fromUid)
            ? prev
            : [
                {
                  refId: inv.fromUid,
                  kind: "user",
                  displayName: inv.fromDisplayName,
                  photoURL: inv.fromPhotoURL,
                  professionalType: inv.fromProfessionalType,
                },
                ...prev,
              ],
        );
      }
      notify.success(accept ? `Ahora colaboras con ${inv.fromDisplayName}.` : "Invitación rechazada.");
    } else {
      setReceived((prev) => [inv, ...prev]);
      notify.error(res.error ?? "No se pudo procesar la invitación.");
    }
  };

  const handleCancel = async (inv: SentInvitationVM) => {
    setSent((prev) => prev.filter((i) => i.id !== inv.id));
    const res = await cancelInvitationAction(inv.id);
    if (res.success) notify.success("Invitación cancelada.");
    else {
      setSent((prev) => [inv, ...prev]);
      notify.error(res.error ?? "No se pudo cancelar.");
    }
  };

  const handleRemove = async (c: CollaboratorVM) => {
    setNetwork((prev) => prev.filter((x) => x.refId !== c.refId));
    const res = await removeCollaboratorAction(c.refId, c.kind);
    if (res.success) notify.success(`${c.displayName} quitado de tu red.`);
    else {
      setNetwork((prev) => [c, ...prev]);
      notify.error(res.error ?? "No se pudo quitar.");
    }
  };

  const onExternalCreated = (ext: { refId: string; displayName: string; photoURL?: string }) => {
    setNetwork((prev) => [{ refId: ext.refId, kind: "external", displayName: ext.displayName, photoURL: ext.photoURL }, ...prev]);
    setShowExternal(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Colaboradores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Invita usuarios a tu red, gestiona invitaciones y perfiles externos. A quienes acepten (y
          a tus externos) podrás acreditarlos al crear o editar eventos.
        </p>
      </div>

      {/* Invitar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <UserPlus className="h-4 w-4 text-slate-400" />
          Invitar colaboradores
        </h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Busca por nombre o correo, selecciona una o varias personas y envía las invitaciones.
        </p>

        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o correo…"
            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-9 text-sm outline-none focus:border-indigo-400"
          />
          {searching && (
            <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100">
            {results.map((u) => (
              <li key={u.uid}>
                <button
                  type="button"
                  onClick={() => toggleSelect(u)}
                  className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-slate-50"
                >
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={u.photoURL} alt={u.displayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(u.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{u.displayName}</p>
                    <p className="truncate text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      isSelected(u.uid)
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected(u.uid) && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {q.trim().length >= 2 && !searching && results.length === 0 && (
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            No encontré a nadie con “{q}”.{" "}
            <button
              type="button"
              onClick={() => setShowExternal(true)}
              className="font-semibold text-indigo-600 hover:underline"
            >
              Crear perfil externo
            </button>
          </div>
        )}

        {/* Chips seleccionados + enviar */}
        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {selected.map((u) => (
              <span
                key={u.uid}
                className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-1 pr-2 text-xs font-medium text-indigo-700"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={u.photoURL} alt={u.displayName} />
                  <AvatarFallback className="text-[9px]">{initials(u.displayName)}</AvatarFallback>
                </Avatar>
                {u.displayName}
                <button type="button" onClick={() => toggleSelect(u)} aria-label="Quitar">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={sending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar {selected.length}
            </button>
          </div>
        )}

        <div className="mt-3">
          {showExternal ? (
            <ExternalProfileForm
              onCreated={onExternalCreated}
              onCancel={() => setShowExternal(false)}
              defaultName={q.trim()}
            />
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
      </div>

      {/* Invitaciones recibidas */}
      {received.length > 0 && (
        <Section title="Invitaciones recibidas" count={received.length} icon={Inbox}>
          <ul className="space-y-2">
            {received.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 p-3">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src={inv.fromPhotoURL} alt={inv.fromDisplayName} />
                  <AvatarFallback className="bg-indigo-50 text-xs font-semibold text-indigo-700">
                    {initials(inv.fromDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{inv.fromDisplayName}</p>
                  <p className="text-xs text-slate-400">Te invitó a su red · {formatDate(inv.invitedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRespond(inv, true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Check className="h-3.5 w-3.5" /> Aceptar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRespond(inv, false)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3.5 w-3.5" /> Denegar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Invitaciones enviadas */}
        <Section title="Invitaciones enviadas" count={sent.length} icon={Send}>
          {sent.length === 0 ? (
            <Empty text="No tienes invitaciones pendientes." />
          ) : (
            <ul className="space-y-2">
              {sent.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={inv.toPhotoURL} alt={inv.toDisplayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(inv.toDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{inv.toDisplayName}</p>
                    <p className="truncate text-xs text-slate-400">Pendiente · {inv.toEmail}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCancel(inv)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Mi red */}
        <Section title="Mi red" count={network.length} icon={Users}>
          {network.length === 0 ? (
            <Empty text="Aún no tienes colaboradores." />
          ) : (
            <ul className="space-y-2">
              {network.map((c) => (
                <li key={c.refId} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Avatar className="h-9 w-9 border border-gray-200">
                    <AvatarImage src={c.photoURL} alt={c.displayName} />
                    <AvatarFallback className="bg-slate-100 text-xs font-semibold text-slate-600">
                      {initials(c.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.displayName}</p>
                    <p className="text-xs text-slate-400">
                      {c.kind === "external"
                        ? "Externo"
                        : c.professionalType
                          ? PROFESSIONAL_TYPE_LABEL[c.professionalType]
                          : "Profesional"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(c)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-slate-400" />
        {title} <span className="font-normal text-slate-400">({count})</span>
      </h2>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
}
