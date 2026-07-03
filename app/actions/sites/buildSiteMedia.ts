import type { MediaFormItem } from "@/presentation/sites/view-models/SiteFormViewModel"

/**
 * Construye el array de media en el estándar PLANO de sites:
 * `item.path` = path del storage (el optimizer CF matchea por este campo),
 * `status: "processing"` hasta que el CF lo pase a "ready", tipo real image/video.
 */
export function buildSiteMedia(media: MediaFormItem[]) {
  const cover = media.find((m) => m.isCover && m.type === "image")
  return media
    .filter((m) => m.status === "processing" || m.status === "ready")
    .map((m) => {
      const status = m.status as "processing" | "ready"
      if (m.type === "video") {
        return {
          id: m.id,
          type: "video" as const,
          path: m.path ?? "",
          url: m.url,
          width: 0,
          height: 0,
          duration: 0,
          status,
          isCover: false,
        }
      }
      return {
        id: m.id,
        type: "image" as const,
        path: m.path ?? "",
        url: m.url,
        width: 0,
        height: 0,
        alt: m.alt,
        status,
        markerUrl: { url: cover?.url ?? m.url, path: "" },
        isCover: m.isCover,
      }
    })
}
