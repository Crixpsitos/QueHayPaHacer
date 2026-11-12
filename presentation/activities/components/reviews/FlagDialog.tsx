"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Textarea } from "@/app/components/ui/textarea"
import { flagReviewAction } from "@/app/actions/activities/review.action"
import { FLAG_NOTE_MAX, FLAG_NOTE_MIN } from "@/domain/entities/activities/moderation/reviewModeration"

const REASONS = [
  { v: "not_attended", l: "No fue cliente o no vino ese día" },
  { v: "false_info", l: "Información falsa" },
  { v: "offensive", l: "Lenguaje ofensivo o ataques personales" },
  { v: "personal_data", l: "Datos personales" },
  { v: "spam", l: "Spam o publicidad" },
  { v: "conflict_of_interest", l: "Conflicto de interés (competencia)" },
  { v: "other", l: "Otro" },
] as const

/** Quien organiza pide revisar una reseña. La reseña sigue visible con «En verificación»; el motivo no se publica. */
export function FlagDialog({ reviewKey, activityId, onClose, onDone }: { reviewKey: string | null; activityId: string; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const send = async () => {
    if (!reviewKey) return
    setBusy(true); setError(null)
    const r = await flagReviewAction(activityId, reviewKey, reason, note)
    setBusy(false)
    if (!r.success) return setError(r.error)
    setReason(""); setNote(""); onDone()
  }
  return (
    <Dialog open={!!reviewKey} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold">¿Por qué la cuestionas?</DialogTitle>
          <DialogDescription>QHPA la revisa. Mientras tanto sigue visible con el aviso «En verificación». Cuestionar sin motivo tiene consecuencias.</DialogDescription>
        </DialogHeader>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Motivo</legend>
          {REASONS.map((o) => (
            <label key={o.v} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 border-border px-3 has-[:checked]:border-primary-dark has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40">
              <input type="radio" name="motivo" value={o.v} checked={reason === o.v} onChange={() => setReason(o.v)} className="size-5 accent-[#9B0A26]" />{o.l}
            </label>
          ))}
        </fieldset>
        <label className="grid gap-1.5 text-sm font-semibold">Cuéntanos más ({FLAG_NOTE_MIN} a {FLAG_NOTE_MAX} caracteres)<Textarea value={note} maxLength={FLAG_NOTE_MAX} rows={3} onChange={(e) => setNote(e.target.value)} /></label>
        {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
        <Button type="button" size="lg" className="h-12" disabled={busy || !reason || note.trim().length < FLAG_NOTE_MIN} onClick={() => void send()}>{busy ? "Enviando…" : "Enviar para revisión"}</Button>
      </DialogContent>
    </Dialog>
  )
}
