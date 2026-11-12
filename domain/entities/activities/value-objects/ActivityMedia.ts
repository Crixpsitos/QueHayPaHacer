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
export function mediaOwnershipError(activityId: string, media: ActivityMedia[], entity: "activities" | "activityReviews" = "activities"): string | null {
  if (!Array.isArray(media)) return "Fotos inválidas."
  const prefix = `public/${entity}/${activityId}/`
  for (const m of media) {
    const folder = m.type === "image" ? "images" : m.type === "video" ? "videos" : null
    if (!folder || typeof m.path !== "string" || !m.path.startsWith(`${prefix}${folder}/`) || m.path.slice(prefix.length + folder.length + 1).includes("/") || m.path.includes(".."))
      return "Una de las fotos o videos no es válida. Súbela de nuevo."
    if (typeof m.url !== "string" || !STORAGE_HOSTS.some((h) => m.url.startsWith(h))) return "Una de las fotos o videos no es válida. Súbela de nuevo."
    if (typeof m.id !== "string" || !m.id) return "Una de las fotos o videos no es válida. Súbela de nuevo."
  }
  return null
}

/** Limpia lo que envía el cliente: solo campos conocidos, nunca el `status` (lo fija el servidor). Descarta lo inválido. */
export function parseMediaInput(raw: unknown): ActivityMedia[] {
  if (!Array.isArray(raw)) return []
  const out: ActivityMedia[] = []
  for (const item of raw) {
    const r = (item && typeof item === "object" ? item : {}) as Record<string, unknown>
    if ((r.type !== "image" && r.type !== "video") || typeof r.id !== "string" || !r.id || typeof r.path !== "string" || typeof r.url !== "string") continue
    const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0)
    out.push({
      id: r.id.slice(0, 64),
      type: r.type,
      path: r.path.slice(0, 300),
      url: r.url.slice(0, 600),
      width: num(r.width),
      height: num(r.height),
      alt: typeof r.alt === "string" ? r.alt.slice(0, 200) : "",
      isCover: r.isCover === true,
    })
  }
  return out
}

/**
 * El arreglo `media[]` lo parchea también el optimizador de ../functions (url, path, tamaño, estado). Para no pisar
 * esas escrituras, el cliente solo decide QUÉ ítems quedan, su ORDEN, la PORTADA y el ALT; todo lo demás de un ítem
 * existente sale de lo guardado. Un ítem nuevo entra como `processing`.
 */
export function mergeMedia(stored: ActivityMedia[], incoming: ActivityMedia[]): ActivityMedia[] {
  const byId = new Map(stored.map((m) => [m.id, m]))
  return incoming.map((m) => {
    const s = byId.get(m.id)
    return s ? { ...s, isCover: m.isCover, alt: m.alt } : { ...m, status: "processing" as const }
  })
}
