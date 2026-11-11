/**
 * Foto o video de una actividad. Datos planos (no clases): son los mismos objetos que el optimizador de
 * `../functions` parchea en el arreglo `media[]` del documento, buscando por `path` (estado processing → ready|error).
 */
export type MediaStatus = "processing" | "ready" | "error"

export interface ActivityMedia {
  id: string
  type: "image" | "video"
  /** Ruta en Storage; el optimizador la usa para encontrar el ítem. */
  path: string
  url: string
  width: number
  height: number
  alt: string
  isCover: boolean
  status?: MediaStatus
  /** Solo video, en segundos. */
  duration?: number
  thumbnailUrl?: string
  thumbnailPath?: string
}

export const MEDIA_IMAGES_MAX = 9 // portada + 8 de galería
export const MEDIA_VIDEOS_MAX = 1
export const MEDIA_ALT_MAX = 125

export function mediaError(media: ActivityMedia[]): string | null {
  if (!Array.isArray(media)) return "Fotos inválidas."
  const images = media.filter((m) => m.type === "image")
  if (images.length > MEDIA_IMAGES_MAX) return `Máximo ${MEDIA_IMAGES_MAX} fotos (la portada y 8 más).`
  if (media.filter((m) => m.type === "video").length > MEDIA_VIDEOS_MAX) return "Solo se admite un video."
  if (media.some((m) => m.alt.length > MEDIA_ALT_MAX)) return `El texto alternativo admite máximo ${MEDIA_ALT_MAX} caracteres.`
  const covers = images.filter((m) => m.isCover)
  if (covers.length !== 1) return "Debe haber exactamente una imagen de portada."
  if (covers[0].status === "error") return "La portada no se pudo procesar: sube otra imagen."
  return null
}

const STORAGE_HOSTS = ["https://storage.googleapis.com/", "https://firebasestorage.googleapis.com/"]

/**
 * Los medios llegan del cliente: solo valen los que viven bajo `public/activities/{id}/{images|videos}/` y
 * se sirven desde Storage. Evita que alguien cuelgue medios de otro recurso o enlaces externos.
 */
export function mediaOwnershipError(activityId: string, media: ActivityMedia[]): string | null {
  if (!Array.isArray(media)) return "Fotos inválidas."
  const prefix = `public/activities/${activityId}/`
  for (const m of media) {
    const folder = m.type === "image" ? "images" : m.type === "video" ? "videos" : null
    if (!folder || typeof m.path !== "string" || !m.path.startsWith(`${prefix}${folder}/`) || m.path.slice(prefix.length + folder.length + 1).includes("/") || m.path.includes(".."))
      return "Una de las fotos o videos no es válida. Súbela de nuevo."
    if (typeof m.url !== "string" || !STORAGE_HOSTS.some((h) => m.url.startsWith(h))) return "Una de las fotos o videos no es válida. Súbela de nuevo."
    if (typeof m.id !== "string" || !m.id) return "Una de las fotos o videos no es válida. Súbela de nuevo."
  }
  return null
}
