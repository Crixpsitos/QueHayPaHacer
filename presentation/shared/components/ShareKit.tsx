"use client";

import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { SITE_URL } from "@/app/lib/site";
import { AUTO_CHANNELS, autoLinkHref } from "@/domain/entities/links/autoLinks";
import { shareMessage } from "@/presentation/shared/lib/shareKit";
import { buildPoster, downloadCanvas, type PosterFormat } from "@/presentation/shared/lib/poster";
import { CopyButton } from "./CopyButton";

export interface ShareKitProps {
  open: boolean;
  onClose: () => void;
  kind: "event" | "site";
  id: string;
  title: string;
  /** Cuándo y dónde (aparece en el afiche y en el mensaje). */
  when?: string;
  where?: string;
  /** Portada de la ficha para el afiche (opcional). */
  imageUrl?: string;
  /** El sitio aún está en revisión: los enlaces funcionarán cuando lo aprueben. */
  pendingReview?: boolean;
}

/** Modal "tu kit para compartir": vista previa del afiche, enlaces por canal ya listos, QR y un mensaje escrito. */
export function ShareKit({ open, onClose, kind, id, title, when, where, imageUrl, pendingReview }: ShareKitProps) {
  // El QR vive dentro del portal del diálogo (se monta después): se guarda en estado para que los efectos esperen a que exista.
  const [qr, setQr] = useState<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<PosterFormat | null>(null);
  const link = (ch: (typeof AUTO_CHANNELS)[number]["id"]) => `${SITE_URL}${autoLinkHref(kind, id, ch)}`;
  const message = shareMessage({ title, when, where, url: link("wa") });
  const noun = kind === "event" ? "evento" : "sitio";
  const subtitle = [when, where].filter(Boolean).join(" · ");

  const make = (format: PosterFormat) =>
    buildPoster({ qr: qr!, kind, title, subtitle, url: link("qr"), imageUrl, format });

  // Vista previa: el mismo afiche, en pequeño, para que la persona vea cómo queda antes de descargarlo.
  useEffect(() => {
    if (!open || !qr) return;
    let alive = true;
    make("feed").then((c) => alive && setPreview(c.toDataURL("image/jpeg", 0.85))).catch(() => {});
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- make() solo lee estas props
  }, [open, qr, id, title, subtitle, imageUrl]);

  const download = async (format: PosterFormat) => {
    if (!qr) return;
    setBusy(format);
    try { downloadCanvas(await make(format), `afiche-${format === "story" ? "historias-" : ""}${id}.png`); } finally { setBusy(null); }
  };
  const qrOnly = () => qr && downloadCanvas(qr, `qr-${id}.png`);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-5xl overflow-y-auto rounded-3xl p-5 sm:max-w-5xl sm:p-10">
        <div className="flex items-center gap-4 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-7" aria-hidden /></span>
          <div className="min-w-0">
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {pendingReview ? `Tu ${noun} está en revisión` : `Comparte tu ${noun}`}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[15px] text-slate-600">
              {pendingReview
                ? "Estos enlaces funcionarán en cuanto lo aprueben. Ya puedes ir preparando el afiche."
                : "Cada enlace es distinto, así sabrás cuánta gente trae cada uno."}
            </DialogDescription>
          </div>
        </div>

        {/* El QR se dibuja aquí (oculto) y de él salen el afiche y la descarga "solo el QR". */}
        <div className="hidden"><QRCodeCanvas ref={setQr} value={link("qr")} size={512} marginSize={0} level="M" /></div>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa generada en el navegador (data URL)
                <img src={preview} alt={`Vista previa del afiche de tu ${noun}`} className="aspect-[4/5] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-slate-400"><Loader2 className="size-6 animate-spin" aria-label="Preparando el afiche" /></div>
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              <button type="button" onClick={() => download("feed")} disabled={busy !== null} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
                {busy === "feed" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />} Afiche para publicar
              </button>
              <div className="flex gap-2.5">
                <button type="button" onClick={() => download("story")} disabled={busy !== null} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60">
                  {busy === "story" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Para historias"}
                </button>
                <button type="button" onClick={qrOnly} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Solo el QR</button>
              </div>
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
          <p className="max-w-lg text-[13px] leading-snug text-slate-500">Los encuentras siempre en Mis eventos y Mis sitios{pendingReview ? "" : ", y en Visitas y enlaces si tienes Premium"}.</p>
          <button type="button" onClick={onClose} className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Listo</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
