"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button/button"
import { Textarea } from "@/app/components/ui/textarea"
import { appealReviewAction, getMyRemovedReviewsAction, type RemovedReview } from "@/app/actions/activities/review.action"
import { APPEAL_MIN_CHARS } from "@/application/services/activities/ActivityAppealService"

/** «Reseñas retiradas»: aparece solo si hay alguna. Una apelación por reseña; QHPA responde. */
export function RemovedReviews() {
  const [items, setItems] = useState<RemovedReview[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  useEffect(() => { let on = true; void getMyRemovedReviewsAction().then((r) => { if (on) setItems(r) }); return () => { on = false } }, [])
  if (!items.length) return null
  const send = async (activityId: string) => {
    const r = await appealReviewAction(activityId, text)
    setMsg(r.success ? { ok: true, text: "Recibimos tu apelación. QHPA la revisará y te avisará." } : { ok: false, text: r.error })
    if (r.success) { setItems((x) => x.map((i) => (i.activityId === activityId ? { ...i, appealed: true } : i))); setOpen(null); setText("") }
  }
  return (
    <section aria-labelledby="retiradas" className="grid gap-3 rounded-3xl border border-[#F6DDA0] bg-accent p-4">
      <h2 id="retiradas" className="font-heading text-lg font-bold text-[#7a5200]">Reseñas retiradas</h2>
      <ul className="grid gap-3">
        {items.map((i) => (
          <li key={i.activityId} className="grid gap-2 rounded-2xl bg-card p-3">
            <p className="text-sm">Retiramos tu reseña de <strong>{i.title}</strong> por incumplir las reglas.</p>
            {i.appealed ? <p className="text-sm font-semibold text-primary-dark">Ya apelaste: solo se puede una vez.</p> : open === i.activityId ? (
              <>
                <label className="grid gap-1.5 text-sm font-semibold">Explica por qué crees que fue un error (mínimo {APPEAL_MIN_CHARS} caracteres)<Textarea value={text} rows={3} maxLength={1000} onChange={(e) => setText(e.target.value)} /></label>
                <div className="flex gap-2"><Button type="button" className="h-11" disabled={text.trim().length < APPEAL_MIN_CHARS} onClick={() => void send(i.activityId)}>Enviar apelación</Button><Button type="button" variant="outline" className="h-11" onClick={() => setOpen(null)}>Cancelar</Button></div>
              </>
            ) : <Button type="button" variant="outline" className="h-11 w-fit" onClick={() => { setOpen(i.activityId); setMsg(null) }}>Apelar (una sola vez)</Button>}
          </li>
        ))}
      </ul>
      {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm font-semibold text-[#14532D]" : "text-sm font-medium text-destructive"}>{msg.text}</p> : null}
    </section>
  )
}
