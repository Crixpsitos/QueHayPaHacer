import { MEDIA_ALT_MAX, MEDIA_IMAGES_MAX, MEDIA_VIDEOS_MAX, type ActivityMedia } from "@/domain/entities/activities/value-objects/ActivityMedia"

/** Operaciones puras sobre la lista de medios del asistente. La portada es siempre una imagen y solo hay una. */
const firstImageIndex = (m: ActivityMedia[]) => m.findIndex((x) => x.type === "image")
const ensureCover = (m: ActivityMedia[]): ActivityMedia[] => {
  if (m.some((x) => x.type === "image" && x.isCover)) return m
  const i = firstImageIndex(m)
  return i < 0 ? m : m.map((x, j) => (j === i ? { ...x, isCover: true } : x))
}

export const addMedia = (media: ActivityMedia[], items: ActivityMedia[]): ActivityMedia[] =>
  ensureCover([...media, ...items.map((x) => (x.type === "video" ? { ...x, isCover: false } : x))])

export const setCover = (media: ActivityMedia[], id: string): ActivityMedia[] =>
  media.find((x) => x.id === id)?.type === "image" ? media.map((x) => ({ ...x, isCover: x.id === id })) : media

export const removeMedia = (media: ActivityMedia[], id: string): ActivityMedia[] =>
  ensureCover(media.filter((x) => x.id !== id))

export const setAlt = (media: ActivityMedia[], id: string, alt: string): ActivityMedia[] => media.map((x) => (x.id === id ? { ...x, alt: alt.slice(0, MEDIA_ALT_MAX) } : x))

const IMAGE_MAX_BYTES = 10 * 1024 * 1024
const VIDEO_MAX_BYTES = 200 * 1024 * 1024 // el mismo tope del procesador de ../functions

export function fileLimitError(file: { type: string; size: number }, media: ActivityMedia[]): string | null {
  if (file.type.startsWith("image/") && !file.type.includes("svg")) {
    if (file.size > IMAGE_MAX_BYTES) return "La foto pesa más de 10 MB. Elige una más liviana."
    return media.filter((m) => m.type === "image").length >= MEDIA_IMAGES_MAX ? `Máximo ${MEDIA_IMAGES_MAX} fotos (la portada y 8 más).` : null
  }
  if (file.type.startsWith("video/")) {
    if (file.size > VIDEO_MAX_BYTES) return "El video pesa más de 200 MB."
    return media.filter((m) => m.type === "video").length >= MEDIA_VIDEOS_MAX ? "Solo se admite un video." : null
  }
  return "Ese tipo de archivo no se admite: sube fotos (JPG, PNG, WebP) o un video."
}
