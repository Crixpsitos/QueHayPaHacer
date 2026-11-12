"use client"

import Image from "next/image"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { ReportButton } from "@/presentation/shared/components/ReportButton"
import { replyReviewAction } from "@/app/actions/activities/review.action"
import { Textarea } from "@/app/components/ui/textarea"
import type { ReviewView } from "@/presentation/activities/lib/reviewView"
import { Stars } from "./Stars"

/** Historia abierta: todas las fotos, el video, el texto completo y la respuesta de quien organiza. Foco atrapado y Esc cierran (Dialog). */
export function ReviewStory({ r, activityId, isHost, onClose, onFlag, onChanged }: { r: ReviewView | null; activityId: string; isHost: boolean; onClose: () => void; onFlag: (key: string) => void; onChanged: () => void }) {
  const [reply, setReply] = useState("")
  const [replying, setReplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const sendReply = async () => {
    if (!r) return
    setBusy(true); setError(null)
    const res = await replyReviewAction(r.subjectId, r.key, reply)
    setBusy(false)
    if (!res.success) return setError(res.error)
    setReplying(false); onChanged()
  }
  return (
    <Dialog open={!!r} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {r ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold">{r.title || `Reseña de ${r.name}`}</DialogTitle>
              <DialogDescription>{r.name} · fue en {r.visitedLabel} · reseñó el {r.createdLabel}</DialogDescription>
            </DialogHeader>
            {r.about ? <p className="text-sm text-muted-foreground">{r.about.kind === "site" ? "Reseña del sitio" : <>Reseña de la actividad <strong className="font-semibold text-foreground">{r.about.title}</strong></>}</p> : null}
            <Stars value={r.rating} className="[&_svg]:size-5" />
            {r.inVerification ? <p role="status" className="rounded-2xl border border-[#F6DDA0] bg-accent p-3 text-sm font-medium text-[#7a5200]">En verificación: esta reseña fue cuestionada y la estamos revisando. Sigue visible con este aviso.</p> : null}
            {r.verifiedByQhpa ? <p className="text-sm font-semibold text-primary-dark">Verificada por QHPA tras revisar un reporte.</p> : null}
            {r.photos.length ? <ul className="grid grid-cols-2 gap-2">{r.photos.map((p) => <li key={p.url} className="relative aspect-square overflow-hidden rounded-2xl bg-muted"><Image src={p.url} alt={p.alt || `Foto de ${r.name}`} fill sizes="16rem" className="object-cover" /></li>)}</ul> : null}
            {r.video ? <video controls preload="none" poster={r.video.thumbnailUrl ?? undefined} className="aspect-video w-full rounded-2xl bg-muted" aria-label={`Video de ${r.name}`}><source src={r.video.url} type="video/mp4" /></video> : null}
            {r.processingMedia ? <p className="text-sm text-muted-foreground">Procesando fotos o video…</p> : null}
            {r.body ? <p className="whitespace-pre-line text-base leading-relaxed">{r.body}</p> : null}
            {r.reply ? <div className="rounded-2xl border-l-4 border-[#FFB703] bg-accent p-3"><p className="text-sm font-semibold text-primary-dark">Respuesta de quien organiza</p><p className="text-sm leading-relaxed">{r.reply.text}</p></div> : null}
            {!r.inVerification && !r.subjectId.startsWith("site_") ? (
              <div className="flex flex-wrap gap-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`${r.name} (${r.rating}★): «${(r.body || r.title).slice(0, 140)}» ${typeof window !== "undefined" ? window.location.origin : ""}/r/a/${r.subjectId}/wa`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">Compartir por WhatsApp</a>
                <a href={`/og/resena/${r.subjectId}/${r.key}`} download="resena.png" className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">Descargar tarjeta</a>
              </div>
            ) : null}
            {isHost ? (
              <div className="grid gap-2">
                {replying ? (
                  <>
                    <label className="grid gap-1.5 text-sm font-semibold">Tu respuesta (máx. 600 caracteres)<Textarea value={reply} maxLength={600} rows={3} onChange={(e) => setReply(e.target.value)} /></label>
                    {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
                    <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void sendReply()} className="min-h-11 rounded-full bg-primary-dark px-5 text-sm font-semibold text-white outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60">{busy ? "Guardando…" : "Guardar respuesta"}</button><button type="button" onClick={() => setReplying(false)} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/40">Cancelar</button></div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setReply(r.reply?.text ?? ""); setReplying(true) }} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">{r.reply ? "Editar mi respuesta" : "Responder"}</button>
                    {!r.inVerification ? <button type="button" onClick={() => onFlag(r.key)} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">Cuestionar esta reseña</button> : null}
                  </div>
                )}
              </div>
            ) : <ReportButton targetType="review" targetId={`${r.subjectId}_${r.key}`} />}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
