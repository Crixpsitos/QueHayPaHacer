"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Info, LifeBuoy, Lock, Send, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/lib/utils/cn";
import { notify } from "@/presentation/shared/lib/notify";
import { uploadToGoogleStorage } from "@/presentation/events/lib/upload/uploadToGoogleStorage";
import { createSupportTicketAction } from "@/app/actions/studio/create-support-ticket.action";
import { closeSupportTicketAction } from "@/app/actions/studio/close-support-ticket.action";
import { getSupportTicketDetailAction } from "@/app/actions/studio/get-support-ticket-detail.action";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_STATUS_LABEL,
  type SupportTicketVM,
  type SupportTicketDetailVM,
} from "../../view-models/StudioSupportViewModel";
import type { SupportTicketStatus } from "@/domain/entities/studio/Studio";

interface SupportViewProps {
  /** uid del dueño de la sesión, para organizar la ruta de los adjuntos. */
  uid: string;
  tickets: SupportTicketVM[];
}

interface Attachment {
  file: File;
  url: string;
}

const DESCRIPTION_MAX = 2000;
const CACHE_IMMUTABLE = "public, max-age=31536000, immutable";

const STATUS_STYLES: Record<SupportTicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(iso));

function StatusBadge({ status }: { status: SupportTicketStatus }) {
  return (
    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLES[status])}>
      {SUPPORT_STATUS_LABEL[status]}
    </span>
  );
}

/** Descripción que se recorta si es larga, con "Ver más / Ver menos". */
function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 320 || text.split("\n").length > 6;
  return (
    <div className="rounded-lg border border-gray-100 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Descripción
      </p>
      <p
        className={cn(
          "mt-1 whitespace-pre-line break-words text-sm text-slate-700",
          !expanded && isLong && "line-clamp-6",
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}

export function SupportView({ uid, tickets: initialTickets }: SupportViewProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(SUPPORT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketVM[]>(initialTickets);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Detalle / cierre
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupportTicketDetailVM | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setAttachments((prev) => [...prev, ...images.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const openDetail = async (ticket: SupportTicketVM) => {
    setDetailId(ticket.id);
    setDetail(null);
    setShowCloseForm(false);
    setCloseReason("");
    setDetailLoading(true);
    const res = await getSupportTicketDetailAction(ticket.id);
    setDetailLoading(false);
    if (!res.success || !res.detail) {
      notify.error(res.error ?? "No se pudo cargar el detalle.");
      setDetailId(null);
      return;
    }
    setDetail(res.detail);
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetail(null);
    setShowCloseForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Los adjuntos suben directo a Storage (fuera del action, que tiene límite de peso).
    let attachmentUrls: string[] = [];
    try {
      attachmentUrls = await Promise.all(
        attachments.map(async (a) => {
          const { publicUrl } = await uploadToGoogleStorage(a.file, "support", uid || "anon", {
            fileName: "attachment",
            contentType: a.file.type,
            isPublic: true,
            subFolder: "attachments",
            cacheControl: CACHE_IMMUTABLE,
          });
          return publicUrl;
        }),
      );
    } catch {
      setIsSubmitting(false);
      notify.error("No se pudieron subir las evidencias. Intenta de nuevo.");
      return;
    }

    const res = await createSupportTicketAction({
      subject,
      category,
      description,
      attachments: attachmentUrls,
    });
    setIsSubmitting(false);
    if (!res.success || !res.ticket) {
      notify.error(res.error ?? "No se pudo enviar el ticket.");
      return;
    }
    setTickets((prev) => [
      {
        id: res.ticket!.id,
        subject: subject.trim(),
        category,
        status: "open",
        createdAt: res.ticket!.createdAt,
      },
      ...prev,
    ]);
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setSubject("");
    setCategory(SUPPORT_CATEGORIES[0]);
    setDescription("");
    setAttachments([]);
    notify.success("Ticket enviado. Te contactaremos con prioridad.");
  };

  const handleClose = async () => {
    if (!detail) return;
    setIsClosing(true);
    const res = await closeSupportTicketAction(detail.id, closeReason);
    setIsClosing(false);
    if (!res.success) {
      notify.error(res.error ?? "No se pudo cerrar el ticket.");
      return;
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === detail.id ? { ...t, status: "resolved" } : t)),
    );
    setDetail({ ...detail, status: "resolved", closeReason: closeReason.trim() });
    setShowCloseForm(false);
    notify.success("Ticket cerrado.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Soporte prioritario</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cuéntanos qué necesitas. Tu cuenta profesional recibe atención preferente.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Atención prioritaria activa</p>
          <p className="text-xs text-indigo-700/80">
            Creas el ticket y nuestro equipo te contacta por correo en menos de 24 horas. No es un chat en vivo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <LifeBuoy className="h-4 w-4 text-indigo-600" />
            Nuevo ticket
          </h2>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Asunto</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder="Resume tu problema en una línea"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"
            >
              {SUPPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-600">Descripción</label>
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  description.length >= DESCRIPTION_MAX ? "text-red-500" : "text-slate-400",
                )}
              >
                {description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={DESCRIPTION_MAX}
              placeholder="Describe con detalle qué ocurre, qué esperabas y qué pasos seguiste."
              className="max-h-64 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Adjuntar evidencias (capturas)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                  <Image src={a.url} alt={a.file.name} fill sizes="64px" className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Quitar adjunto"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-slate-400 transition-colors hover:border-indigo-300 hover:text-indigo-500"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="text-[10px]">Subir</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !subject.trim() || !description.trim()}
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Enviando…" : "Enviar ticket"}
          </button>
        </form>

        {/* Historial */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Historial de tickets{" "}
            <span className="font-normal text-slate-400">({tickets.length})</span>
          </h2>

          {tickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Aún no has enviado tickets.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void openDetail(t)}
                    className="w-full rounded-lg border border-gray-100 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-slate-800">{t.subject}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {t.category} · {formatDate(t.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de detalle del ticket */}
      <Dialog open={detailId !== null} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {detailLoading || !detail ? (
            <>
              <DialogTitle className="sr-only">Cargando ticket</DialogTitle>
              <div className="py-10 text-center text-sm text-slate-400">Cargando ticket…</div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-base">{detail.subject}</DialogTitle>
                <DialogDescription>
                  {detail.category} · {formatDate(detail.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status} />
                </div>

                {/* Lo que escribió el usuario (recortado si es largo) */}
                <ExpandableDescription text={detail.description} />

                {/* Evidencias */}
                {detail.attachments.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Evidencias
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {detail.attachments.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200"
                        >
                          <Image
                            src={url}
                            alt={`Evidencia ${i + 1}`}
                            fill
                            sizes="80px"
                            className="object-cover"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estado del seguimiento — no es chat: el equipo contacta por fuera */}
                {detail.status !== "resolved" ? (
                  <div className="flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                    <p className="text-sm text-indigo-900">
                      Recibimos tu solicitud. Nuestro equipo te contactará por correo. No hace
                      falta que respondas aquí.
                    </p>
                  </div>
                ) : (
                  detail.closeReason && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        <Lock className="h-3 w-3" />
                        Motivo del cierre
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words text-sm text-emerald-900">
                        {detail.closeReason}
                      </p>
                    </div>
                  )
                )}

                {/* Cerrar ticket */}
                {detail.status !== "resolved" && (
                  <div className="border-t border-gray-100 pt-3">
                    {!showCloseForm ? (
                      <button
                        type="button"
                        onClick={() => setShowCloseForm(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-600 hover:bg-gray-50"
                      >
                        <Lock className="h-4 w-4" />
                        Cerrar ticket
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-600">
                          ¿Por qué cierras este ticket?
                        </label>
                        <textarea
                          value={closeReason}
                          onChange={(e) => setCloseReason(e.target.value)}
                          rows={3}
                          maxLength={500}
                          placeholder="Ej. El problema se resolvió tras verificar el correo."
                          className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleClose()}
                            disabled={isClosing || !closeReason.trim()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isClosing ? "Cerrando…" : "Confirmar cierre"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCloseForm(false)}
                            className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-600 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
