import { fetchPublicActivity } from "@/presentation/activities/data/fetchers"
import { brandImage } from "../../_lib/brand"
import { OG_FALLBACK_CACHE_CONTROL, coverToJpeg, jpegResponse } from "../../_lib/og"

/** Vista previa de una actividad pública: su portada como JPEG ligero. Sin portada (o no pública): imagen de marca. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = await fetchPublicActivity(slug)
  const jpeg = a?.cover ? await coverToJpeg(a.cover.url) : null
  return jpeg ? jpegResponse(jpeg) : brandImage(OG_FALLBACK_CACHE_CONTROL)
}
