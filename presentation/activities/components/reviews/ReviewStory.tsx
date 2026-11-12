"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import type { ReviewView } from "@/presentation/activities/lib/reviewView"
import { Stars } from "./Stars"

/** Historia abierta: todas las fotos, el video, el texto completo y la respuesta de quien organiza. Foco atrapado y Esc cierran (Dialog). */
export function ReviewStory({ r, onClose, onFlag }: { r: ReviewView | null; onClose: () => void; onFlag?: (key: string) => void }) {
  return (
    <Dialog open={!!r} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {r ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold">{r.title || `Reseña de ${r.name}`}</DialogTitle>
              <DialogDescription>{r.name} · fue en {r.visitedLabel} · reseñó el {r.createdLabel}</DialogDescription>
            </DialogHeader>
            <Stars value={r.rating} className="[&_svg]:size-5" />
            {r.inVerification ? <p role="status" className="rounded-2xl border border-[#F6DDA0] bg-accent p-3 text-sm font-medium text-[#7a5200]">En verificación: esta reseña fue cuestionada y la estamos revisando. Sigue visible con este aviso.</p> : null}
            {r.verifiedByQhpa ? <p className="text-sm font-semibold text-primary-dark">Verificada por QHPA tras revisar un reporte.</p> : null}
            {r.photos.length ? <ul className="grid grid-cols-2 gap-2">{r.photos.map((p) => <li key={p.url} className="relative aspect-square overflow-hidden rounded-2xl bg-muted"><Image src={p.url} alt={p.alt || `Foto de ${r.name}`} fill sizes="16rem" className="object-cover" /></li>)}</ul> : null}
            {r.video ? <video controls preload="none" poster={r.video.thumbnailUrl ?? undefined} className="aspect-video w-full rounded-2xl bg-muted" aria-label={`Video de ${r.name}`}><source src={r.video.url} type="video/mp4" /></video> : null}
            {r.processingMedia ? <p className="text-sm text-muted-foreground">Procesando fotos o video…</p> : null}
            {r.body ? <p className="whitespace-pre-line text-base leading-relaxed">{r.body}</p> : null}
            {r.reply ? <div className="rounded-2xl border-l-4 border-[#FFB703] bg-accent p-3"><p className="text-sm font-semibold text-primary-dark">Respuesta de quien organiza</p><p className="text-sm leading-relaxed">{r.reply.text}</p></div> : null}
            {onFlag ? <button type="button" onClick={() => onFlag(r.key)} className="min-h-11 w-fit rounded-full border border-border px-4 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40">Cuestionar esta reseña</button> : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
