"use client"

import { useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { GoogleAuthButton } from "@/app/components/feature/auth/GoogleAuthButton"
import { deleteReviewAction, submitReviewAction, type MyReview } from "@/app/actions/activities/review.action"
import { REVIEW_BODY_MAX, REVIEW_PHOTOS_MAX, REVIEW_TITLE_MAX } from "@/domain/entities/activities/review/ActivityReview"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { prepareUpload, putToStorage, type PreparedUpload } from "@/presentation/events/lib/upload/uploadToGoogleStorage"
import { uploadMediaPersistFirst } from "@/presentation/events/lib/upload/uploadMediaPersistFirst"
import { getImageData } from "@/presentation/events/lib/image/getImageData"
import { getVideoData } from "@/presentation/events/lib/video/getVideoData"
import { StarInput } from "./Stars"

interface Props { open: boolean; onClose: () => void; activityId: string; docId: string | null; loggedIn: boolean; mine: MyReview | null; blocked: string | null; onDone: () => void }

const month = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
const field = "grid gap-1.5 text-sm font-semibold"

/** Formulario de reseña: Google para entrar, estrellas, mes, texto, fotos (≤3), un video y la autorización por separado. */
export function ReviewForm({ open, onClose, activityId, docId, loggedIn, mine, blocked, onDone }: Props) {
  const now = new Date()
  const min = month(new Date(now.getFullYear(), now.getMonth() - 24, 1))
  const [rating, setRating] = useState(mine?.rating ?? 0)
  const [title, setTitle] = useState(mine?.title ?? "")
  const [body, setBody] = useState(mine?.body ?? "")
  const [visitedAt, setVisitedAt] = useState(mine?.visitedAt ?? month(now))
  const [media, setMedia] = useState<ActivityMedia[]>(mine?.media ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [authorized, setAuthorized] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (list: File[]) => {
    const photos = media.filter((m) => m.type === "image").length + files.filter((f) => f.type.startsWith("image/")).length
    const videos = media.filter((m) => m.type === "video").length + files.filter((f) => f.type.startsWith("video/")).length
    let p = photos, v = videos
    const ok: File[] = []
    for (const f of list) {
      if (f.type.startsWith("image/") && !f.type.includes("svg") && f.size <= 10 * 1024 * 1024 && p < REVIEW_PHOTOS_MAX) { ok.push(f); p++ }
      else if (f.type.startsWith("video/") && f.size <= 200 * 1024 * 1024 && v < 1) { ok.push(f); v++ }
      else setError(`Máximo ${REVIEW_PHOTOS_MAX} fotos (hasta 10 MB) y un video (hasta 200 MB).`)
    }
    setFiles((x) => [...x, ...ok])
  }

  const payload = (m: ActivityMedia[]) => ({ rating, title, body, visitedAt, media: m, coverIndex: 0, authorized })

  const submit = async () => {
    setError(null)
    if (!rating) return setError("Elige de 1 a 5 estrellas.")
    if (!authorized) return setError("Marca la casilla de autorización para publicar tu reseña.")
    setBusy(true)
    try {
      if (!files.length) {
        const r = await submitReviewAction(activityId, payload(media))
        if (!r.success) return setError(r.error)
      } else {
        if (!docId) return setError("No pudimos preparar la subida. Recarga la página.")
        const opts = (f: File) => ({ fileName: f.name, contentType: f.type, isPublic: true })
        let persistError: string | null = null
        const { failedIds } = await uploadMediaPersistFirst<File, PreparedUpload, ActivityMedia>(files, {
          prepare: (f) => prepareUpload(f, "activityReviews", docId, opts(f)),
          buildItem: async (f, pr) => {
            if (f.type.startsWith("video/")) { const v = await getVideoData(f); return { id: crypto.randomUUID(), type: "video", path: pr.path, url: pr.publicUrl, width: v.width, height: v.height, alt: "", isCover: false, status: "processing", duration: v.duration } }
            const im = await getImageData(f)
            return { id: crypto.randomUUID(), type: "image", path: pr.path, url: pr.publicUrl, width: im.width, height: im.height, alt: "", isCover: media.length === 0, status: "processing" }
          },
          persist: async (items) => { const r = await submitReviewAction(activityId, payload([...media, ...items])); if (!r.success) { persistError = r.error; throw new Error(r.error) } },
          put: (f, pr) => putToStorage(f, pr, opts(f)),
          markError: async () => undefined,
        }).catch(() => ({ failedIds: [] as string[] }))
        if (persistError) return setError(persistError)
        if (failedIds.length) setError("Tu reseña se publicó, pero no se pudieron subir algunos archivos. Edítala para reintentar.")
      }
      onDone()
    } finally { setBusy(false) }
  }

  const remove = async () => {
    setBusy(true); setError(null)
    const r = await deleteReviewAction(activityId)
    setBusy(false)
    if (!r.success) return setError(r.error)
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-extrabold">{mine ? "Edita tu reseña" : "Cuenta cómo te fue"}</DialogTitle>
          <DialogDescription>Tu nombre público será solo tu primer nombre y la inicial del apellido. Tu correo nunca se muestra.</DialogDescription>
        </DialogHeader>
        {!loggedIn ? (
          <div className="grid gap-3"><p className="text-sm text-muted-foreground">Reseñar pide cuenta con Google para evitar reseñas falsas.</p><GoogleAuthButton label="Continuar con Google" redirectTo={`${typeof window !== "undefined" ? window.location.pathname : ""}?resena=1`} /></div>
        ) : blocked ? <p role="alert" className="rounded-2xl border border-border bg-muted p-4 text-sm">{blocked}</p> : mine?.inVerification ? <p role="status" className="rounded-2xl border border-[#F6DDA0] bg-accent p-4 text-sm text-[#7a5200]">Tu reseña está en verificación: no se puede editar ni borrar mientras la revisamos.</p> : (
          <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
            <div className={field}>Tu calificación<StarInput value={rating} onChange={setRating} /></div>
            <label className={field}>¿Cuándo fuiste?<Input type="month" required min={min} max={month(now)} value={visitedAt} onChange={(e) => setVisitedAt(e.target.value)} /></label>
            <label className={field}>Título (opcional)<Input value={title} maxLength={REVIEW_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="Una de las mejores salidas" /></label>
            <label className={field}>Tu historia (opcional, mínimo 10 caracteres)<Textarea value={body} maxLength={REVIEW_BODY_MAX} rows={4} onChange={(e) => setBody(e.target.value)} placeholder="Qué hiciste, qué te gustó y qué mejorarías. Sin enlaces, correos ni teléfonos." /></label>
            <div className={field}>Fotos (hasta {REVIEW_PHOTOS_MAX}) y un video
              <ul className="flex flex-wrap gap-2">
                {media.map((m) => <li key={m.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium">{m.type === "image" ? "Foto" : "Video"}<button type="button" aria-label={`Quitar ${m.type === "image" ? "la foto" : "el video"} ya subido`} onClick={() => setMedia((x) => x.filter((y) => y.id !== m.id))} className="grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-3.5" aria-hidden /></button></li>)}
                {files.map((f, i) => <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium">{f.name.slice(0, 18)}<button type="button" aria-label={`Quitar ${f.name}`} onClick={() => setFiles((x) => x.filter((_, j) => j !== i))} className="grid size-6 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"><Trash2 className="size-3.5" aria-hidden /></button></li>)}
              </ul>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/*" multiple hidden onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = "" }} />
              <Button type="button" variant="outline" className="h-11 w-fit" onClick={() => inputRef.current?.click()}><ImagePlus aria-hidden /> Agregar fotos o video</Button>
            </div>
            <label className="flex items-start gap-3 text-[0.8125rem] leading-snug"><input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[#9B0A26]" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} />Autorizo a Qué Hay Pa Hacer a publicar mi nombre público, mi foto de perfil y esta reseña, según la <a href="/privacidad#resenas" className="font-semibold text-primary-dark underline">Política de privacidad</a> y los <a href="/terminos#resenas" className="font-semibold text-primary-dark underline">Términos</a>.</label>
            {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="lg" className="h-12 flex-1" disabled={busy}>{busy ? "Publicando…" : mine ? "Guardar cambios" : "Publicar mi reseña"}</Button>
              {mine ? <Button type="button" variant="outline" size="lg" className="h-12" disabled={busy} onClick={() => void remove()}>Borrar</Button> : null}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
