"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Download, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog"
import { SITE_URL } from "@/app/lib/site"
import type { WeekPosterPlan } from "@/domain/entities/activities/weekPoster"
import { buildWeekPoster } from "@/presentation/activities/lib/weekPoster"
import { downloadCanvas, type PosterFormat } from "@/presentation/shared/lib/poster"

const URL_QR = `${SITE_URL}/actividades?ch=qr&utm_source=qr&utm_medium=poster&utm_campaign=mi_semana`

/** «Afiche de mi semana»: vista previa y descarga para publicar (4:5) o para historias (9:16), con el QR de la semana completa. */
export function WeekPosterDialog({ open, onClose, plan }: { open: boolean; onClose: () => void; plan: WeekPosterPlan }) {
  const [qr, setQr] = useState<HTMLCanvasElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState<PosterFormat | null>(null)
  const make = (format: PosterFormat) => buildWeekPoster({ qr: qr!, plan, url: URL_QR, format })

  useEffect(() => {
    if (!open || !qr) return
    let alive = true
    make("feed").then((c) => alive && setPreview(c.toDataURL("image/jpeg", 0.85))).catch(() => {})
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- make() solo lee qr y plan
  }, [open, qr, plan])

  const download = async (format: PosterFormat) => {
    if (!qr) return
    setBusy(format)
    try { downloadCanvas(await make(format), `mi-semana-${format === "story" ? "historias" : "feed"}.png`) } finally { setBusy(null) }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl p-5">
        <DialogTitle className="font-heading text-2xl font-bold">Afiche de mi semana</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">Compártelo en tus redes o por WhatsApp. El QR lleva a la semana completa.</DialogDescription>
        <div className="hidden"><QRCodeCanvas ref={setQr} value={URL_QR} size={512} marginSize={0} level="M" /></div>
        <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-2xl border border-border bg-muted">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa generada en el navegador (data URL)
            <img src={preview} alt="Vista previa del afiche de tu semana" className="aspect-[4/5] w-full object-cover" />
          ) : <div className="grid aspect-[4/5] place-items-center text-muted-foreground"><Loader2 className="size-6 animate-spin" aria-label="Preparando el afiche" /></div>}
        </div>
        {plan.more > 0 ? <p className="text-xs text-muted-foreground">Tienes muchos planes: en el afiche van los primeros 6 y el resto se ve en el enlace.</p> : null}
        <div className="grid gap-2">
          <Button type="button" size="lg" className="h-12" disabled={busy !== null || !qr} onClick={() => void download("feed")}>{busy === "feed" ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />} Afiche para publicar</Button>
          <Button type="button" variant="outline" size="lg" className="h-12" disabled={busy !== null || !qr} onClick={() => void download("story")}>{busy === "story" ? <Loader2 className="animate-spin" aria-hidden /> : <ImageIcon aria-hidden />} Para historias</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
