import type { MediaItem } from "@/application/dto/events/EventDto"
import type { RetryEventMediaResult } from "@/app/actions/events/lib/applyRetry"

/** Qué hace el formulario con la respuesta de "Reintentar" (eventos y sesiones lo comparten). */
export function applyRetryResult(o: {
  result: RetryEventMediaResult
  mediaId: string
  media: MediaItem[]
  setMedia: (media: MediaItem[]) => void
  notify: { success: (msg: string) => void; error: (msg: string) => void }
}) {
  const { result, mediaId, media, setMedia, notify } = o

  if (result.success) {
    if (result.status === "already-ready") {
      // Firestore ya lo tenía listo: reflejarlo en el formulario.
      setMedia(media.map((m) => (m.id === mediaId ? result.item : m)))
      notify.success("El archivo ya estaba listo.")
    } else {
      notify.success("Reintentando. Puede tardar unos segundos.")
    }
    return
  }

  if (result.code === "missing-original") {
    // No hay nada que reprocesar: dejarlo en error para que el usuario lo elimine y lo vuelva a subir.
    setMedia(media.map((m) => (m.id === mediaId ? ({ ...m, data: { ...m.data, status: "error" } } as MediaItem) : m)))
  }
  notify.error(result.error)
}
