"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button/button"
import { Input } from "@/app/components/ui/input"
import type { ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { MEDIA_ALT_MAX } from "@/domain/entities/activities/value-objects/ActivityMedia"
import { addMedia, fileLimitError, removeMedia, setAlt, setCover } from "@/presentation/activities/lib/mediaOps"
import { prepareUpload, putToStorage, type PreparedUpload } from "@/presentation/events/lib/upload/uploadToGoogleStorage"
import { uploadMediaPersistFirst } from "@/presentation/events/lib/upload/uploadMediaPersistFirst"
import { getImageData } from "@/presentation/events/lib/image/getImageData"
import { getVideoData } from "@/presentation/events/lib/video/getVideoData"
import { cn } from "@/app/lib/utils/cn"

interface Props {
  activityId: string
  media: ActivityMedia[]
  setMedia: (m: ActivityMedia[]) => void
  /** Guarda la actividad con esta lista de medios. Devuelve true si se guardó. */
  persist: (media: ActivityMedia[]) => Promise<boolean>
  onError: (message: string) => void
}

const STATUS_LABEL = { processing: "Procesando…", ready: "Lista", error: "Error" } as const

/** Paso 6: portada, galería y video. Orden obligatorio: preparar → guardar el medio como "procesando" → subir. */
export function StepMedia({ activityId, media, setMedia, persist, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  // Copia vigente de la lista para los callbacks asíncronos de la subida (se actualiza tras cada render).
  const mediaRef = useRef(media)
  useEffect(() => {
    mediaRef.current = media
  }, [media])

  const upload = async (files: File[]) => {
    // Se descartan de a uno con su motivo, contando lo que ya está y lo que se va aceptando.
    const accepted: File[] = []
    let simulated = mediaRef.current
    for (const f of files) {
      const err = fileLimitError(f, simulated)
      if (err) {
        onError(err)
        continue
      }
      accepted.push(f)
      simulated = [...simulated, { type: f.type.startsWith("video/") ? "video" : "image" } as ActivityMedia]
    }
    if (!accepted.length) return
    setBusy(true)
    const before = mediaRef.current
    try {
      const options = (f: File) => ({ fileName: f.name, contentType: f.type, isPublic: true })
      const { items, failedIds } = await uploadMediaPersistFirst<File, PreparedUpload, ActivityMedia>(accepted, {
        prepare: (f) => prepareUpload(f, "activities", activityId, options(f)),
        buildItem: async (f, prepared) => {
          if (f.type.startsWith("video/")) {
            const v = await getVideoData(f)
            return { id: crypto.randomUUID(), type: "video", path: prepared.path, url: prepared.publicUrl, width: v.width, height: v.height, alt: "", isCover: false, status: "processing", duration: v.duration }
          }
          const im = await getImageData(f)
          return { id: crypto.randomUUID(), type: "image", path: prepared.path, url: prepared.publicUrl, width: im.width, height: im.height, alt: "", isCover: false, status: "processing" }
        },
        persist: async (newItems) => {
          const next = addMedia(before, newItems)
          setMedia(next)
          if (!(await persist(next))) {
            setMedia(before) // nada se subió: no dejar "procesando" huérfanos
            throw new Error("No se pudo guardar")
          }
        },
        put: (f, prepared) => putToStorage(f, prepared, options(f)),
        // El estado lo fija el servidor; un medio que no se pudo subir se quita para poder reintentarlo.
        markError: async (ids) => {
          const cleaned = ids.reduce((m, id) => removeMedia(m, id), mediaRef.current)
          setMedia(cleaned)
          await persist(cleaned)
        },
      })
      if (failedIds.length) onError(`No se pudo subir ${failedIds.length === 1 ? "un archivo" : `${failedIds.length} archivos`}. Inténtalo de nuevo.`)
      void items
    } catch {
      onError("No se pudieron subir los archivos. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const change = async (next: ActivityMedia[]) => {
    const before = mediaRef.current
    setMedia(next)
    if (!(await persist(next))) setMedia(before)
  }

  const images = media.filter((m) => m.type === "image")
  return (
    <div className="grid gap-5">
      <div className="grid gap-2 rounded-2xl border border-dashed border-border bg-card p-5 text-center">
        <ImagePlus className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">JPG, PNG o WebP hasta 10 MB, y un video de hasta 200 MB. La primera foto es la portada.</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/*" multiple hidden onChange={(e) => void upload(Array.from(e.target.files ?? []))} />
        <Button type="button" size="lg" className="mx-auto h-12" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? "Subiendo…" : "Elegir fotos o video"}</Button>
      </div>

      {media.length ? (
        <ul className="grid gap-3">
          {media.map((m) => (
            <li key={m.id} className="grid gap-3 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[7rem_1fr]">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-muted sm:aspect-square">
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- miniatura del archivo recién subido (URL pública de Storage)
                  <img src={m.thumbnailUrl ?? m.url} alt={m.alt || "Foto de la actividad"} className="size-full object-cover" />
                ) : (
                  <div className="grid size-full place-items-center text-xs font-semibold text-muted-foreground">VIDEO</div>
                )}
              </div>
              <div className="grid content-start gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={cn("rounded-full px-2.5 py-1 font-semibold", m.status === "error" ? "bg-destructive/10 text-destructive" : m.status === "ready" ? "bg-[#E4F5E8] text-[#14532D]" : "bg-accent text-[#7a5200]")}>{STATUS_LABEL[m.status ?? "processing"]}</span>
                  {m.isCover ? <span className="rounded-full bg-primary-dark px-2.5 py-1 font-semibold text-white">Portada</span> : null}
                </div>
                {m.type === "image" ? (
                  <Input value={m.alt} maxLength={MEDIA_ALT_MAX} placeholder="Describe la foto (opcional)" aria-label="Descripción de la foto" onChange={(e) => setMedia(setAlt(media, m.id, e.target.value))} onBlur={() => void persist(mediaRef.current)} />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {m.type === "image" && !m.isCover && images.length > 1 ? <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => void change(setCover(media, m.id))}>Hacer portada</Button> : null}
                  <Button type="button" variant="ghost" size="lg" className="h-11" aria-label={`Quitar ${m.type === "image" ? "la foto" : "el video"}`} onClick={() => void change(removeMedia(media, m.id))}><Trash2 aria-hidden /> Quitar</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Aún no hay fotos. Necesitas al menos una para publicar.</p>
      )}
    </div>
  )
}
