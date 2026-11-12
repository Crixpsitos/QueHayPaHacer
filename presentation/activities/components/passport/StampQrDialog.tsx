"use client"

import { useEffect, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/app/components/ui/button/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { getStampQrAction } from "@/app/actions/activities/stamp.action"
import { SITE_URL } from "@/app/lib/site"

/** QR de sello para imprimir y poner en el local: quien lo escanea (con cuenta) recibe el sello de esta actividad en su pasaporte. */
export function StampQrDialog({ activityId, title, onClose }: { activityId: string; title: string; onClose: () => void }) {
  const [path, setPath] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  useEffect(() => { let on = true; void getStampQrAction(activityId).then((r) => { if (!on) return; if (r.success) setPath(r.path); else setError(r.error) }); return () => { on = false } }, [activityId])
  const download = () => { if (!canvas) return; const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `sello-${activityId}.png`; a.click() }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">QR de sello</DialogTitle>
          <DialogDescription>Imprímelo y ponlo en el local de «{title}». Quien lo escanee con su cuenta recibe un sello de «Pasaporte de Ibagué» y queda marcado como visita verificada. No lo publiques en redes: es para quien está en el lugar.</DialogDescription>
        </DialogHeader>
        {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : path ? (
          <div className="grid justify-items-center gap-3">
            <div className="rounded-2xl border border-border bg-white p-4"><QRCodeCanvas ref={setCanvas} value={`${SITE_URL}${path}`} size={240} marginSize={0} level="M" /></div>
            <Button type="button" className="h-12" onClick={download}>Descargar el QR</Button>
          </div>
        ) : <div className="mx-auto size-60 animate-pulse rounded-2xl bg-muted" aria-busy="true" />}
      </DialogContent>
    </Dialog>
  )
}
