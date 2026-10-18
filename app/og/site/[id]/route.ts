import { fetchPublicSiteDetail } from "@/presentation/sites/data/siteDetailFetchers"
import { brandImage } from "../../_lib/brand"
import { OG_FALLBACK_CACHE_CONTROL, coverToJpeg, jpegResponse } from "../../_lib/og"

/** Vista previa de un sitio público: su portada como JPEG ligero. Sin portada (o no público): imagen de marca. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = await fetchPublicSiteDetail(id)
  const jpeg = site ? await coverToJpeg(site.coverUrl) : null
  return jpeg ? jpegResponse(jpeg) : brandImage(OG_FALLBACK_CACHE_CONTROL)
}
