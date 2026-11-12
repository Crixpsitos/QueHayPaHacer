"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"
import { getHostIdentityForComplaintAction } from "@/app/actions/activities/host-identity.action"
import type { ComplaintView } from "@/domain/entities/activities/HostIdentity"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"

/** "Datos de quien ofrece": quien necesite presentar una queja los consulta (con sesión, con límite y con bitácora). */
export function ComplaintInfo({ activityId }: { activityId: string }) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<{ loading: boolean; error?: string; data?: ComplaintView }>({ loading: false })

  const show = async () => {
    setOpen(true)
    setState({ loading: true })
    const r = await getHostIdentityForComplaintAction(activityId)
    setState(r.success ? { loading: false, data: r.data } : { loading: false, error: r.error })
  }

  const d = state.data
  return (
    <>
      <button type="button" onClick={() => void show()} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        <ShieldCheck className="size-4" aria-hidden /> Datos de quien ofrece y presentar una queja
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quién ofrece esta actividad</DialogTitle>
            <DialogDescription>Para presentar una queja ante la autoridad competente. Quedó registrado que consultaste estos datos.</DialogDescription>
          </DialogHeader>
          {state.loading ? <p className="text-sm text-muted-foreground">Consultando…</p> : null}
          {state.error ? <p role="alert" className="text-sm font-medium text-destructive">{state.error}</p> : null}
          {d ? (
            <dl className="grid gap-2 text-sm">
              <div><dt className="text-muted-foreground">{d.kind === "person" ? "Nombre" : "Razón social"}</dt><dd className="font-medium">{d.name}</dd></div>
              {d.representative ? <div><dt className="text-muted-foreground">Representante legal</dt><dd className="font-medium">{d.representative}</dd></div> : null}
              <div><dt className="text-muted-foreground">Documento</dt><dd className="font-medium">{d.documentType} {d.documentNumber}</dd></div>
              <div><dt className="text-muted-foreground">Dirección</dt><dd className="font-medium">{d.address}</dd></div>
              <div><dt className="text-muted-foreground">Correo</dt><dd className="font-medium">{d.email}</dd></div>
              <div><dt className="text-muted-foreground">Teléfono</dt><dd className="font-medium">{d.phones.join(" · ")}</dd></div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
