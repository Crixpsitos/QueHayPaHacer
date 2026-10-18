import { fetchEventDetailById, fetchEventDetailBySlug } from "@/presentation/events/data/eventDetailFetchers"
import { brandImage } from "../../_lib/brand"
import { OG_FALLBACK_CACHE_CONTROL, coverToJpeg, jpegResponse } from "../../_lib/og"

/** Vista previa de un evento publicado: su imagen principal como JPEG ligero. Si no hay: imagen de marca. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const found = (await fetchEventDetailBySlug(id)) ?? (await fetchEventDetailById(id))
  // Borradores, en revisión o rechazados: nunca se filtra su portada.
  const event = found?.status === "published" ? found : null
  const jpeg = event ? await coverToJpeg(event.mainImage?.url) : null
  return jpeg ? jpegResponse(jpeg) : brandImage(OG_FALLBACK_CACHE_CONTROL)
}
