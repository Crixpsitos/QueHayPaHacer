"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { SITE_URL } from "@/app/lib/site";
import { AUTO_CHANNELS, autoLinkHref } from "@/domain/entities/links/autoLinks";
import { shareMessage } from "@/presentation/shared/lib/shareKit";
import { buildPosterCanvas, downloadCanvas } from "@/presentation/shared/lib/poster";
import { CopyButton } from "./CopyButton";

export interface ShareKitProps {
  open: boolean;
  onClose: () => void;
  kind: "event" | "site";
  id: string;
  title: string;
  /** Cuándo y dónde, en una línea (aparece en el afiche y en el mensaje). */
  when?: string;
  where?: string;
  /** El sitio aún está en revisión: los enlaces funcionarán cuando lo aprueben. */
  pendingReview?: boolean;
}

/** Modal "tu kit para compartir": enlaces por canal ya listos, QR, afiche descargable y un mensaje escrito. */
export function ShareKit({ open, onClose, kind, id, title, when, where, pendingReview }: ShareKitProps) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const link = (ch: (typeof AUTO_CHANNELS)[number]["id"]) => `${SITE_URL}${autoLinkHref(kind, id, ch)}`;
  const message = shareMessage({ title, when, where, url: link("wa") });
  const noun = kind === "event" ? "evento" : "sitio";

  const poster = () => {
    if (!qrRef.current) return;
    downloadCanvas(buildPosterCanvas({ qr: qrRef.current, title, subtitle: [when, where].filter(Boolean).join(" · "), url: link("qr") }), `afiche-${id}.png`);
  };
  const qrOnly = () => qrRef.current && downloadCanvas(qrRef.current, `qr-${id}.png`);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto rounded-3xl p-5 sm:max-w-5xl sm:p-10">
        <div className="flex items-center gap-4 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-7" aria-hidden /></span>
          <div className="min-w-0">
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {pendingReview ? `Tu ${noun} está en revisión` : `Tu ${noun} ya está publicado`}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[15px] text-slate-600">
              {pendingReview
                ? "Estos enlaces funcionarán en cuanto lo aprueben. Ya puedes ir preparando el afiche."
                : "Compártelo ahora. Cada enlace es distinto, así sabrás cuánta gente trae cada uno."}
            </DialogDescription>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5 sm:p-6">
              <div className="shrink-0 rounded-xl bg-white p-3">
                <QRCodeCanvas ref={qrRef} value={link("qr")} size={512} marginSize={2} level="M" style={{ width: 168, height: 168 }} aria-label={`Código QR de tu ${noun}`} role="img" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-slate-900">Afiche con QR</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">Con el título y los datos. Listo para imprimir o subir a historias.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button type="button" onClick={poster} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <Download className="size-4" aria-hidden /> Descargar afiche (PNG)
              </button>
              <button type="button" onClick={qrOnly} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Solo el QR</button>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3.5">
            <p className="text-xl font-semibold text-slate-900">Un enlace por canal</p>
            <ul className="flex flex-col gap-2.5">
              {AUTO_CHANNELS.filter((c) => c.id !== "qr").map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 py-3 pl-4 pr-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-slate-900">{c.label}</p>
                    <p className="truncate font-mono text-xs text-slate-500">{link(c.id).replace(/^https?:\/\//, "")}</p>
                  </div>
                  <CopyButton text={link(c.id)} ariaLabel={`Copiar enlace de ${c.label}`} />
                </li>
              ))}
            </ul>
            <div className="mt-1">
              <p className="mb-2 text-[13px] font-semibold text-slate-600">Mensaje listo para WhatsApp</p>
              <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-relaxed text-green-950">{message}</p>
              <CopyButton text={message} label="Copiar mensaje" className="mt-2.5" />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <p className="max-w-lg text-[13px] leading-snug text-slate-500">Siempre los encuentras en Visitas y enlaces, junto a cuánta gente trae cada uno.</p>
          <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Listo</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
