import sharp from "sharp"

/**
 * Imágenes de vista previa (og:image) para WhatsApp, Facebook, X. Reglas que hacen que se vean:
 * JPEG (WebP falla en WhatsApp), ≤ ~100 KB (WhatsApp descarta las pesadas), 1200×630, respuesta rápida y
 * cacheable por el CDN. Antes el evento servía un PNG de 1,3 MB generado en cada petición (`no-store`).
 */
export const OG_SIZE = { width: 1200, height: 630 } as const

// Solo se descargan portadas de nuestro almacenamiento (y los dominios de imágenes de la app): la URL sale de la
// base de datos y el servidor la descarga, así que no se sigue cualquier host.
const ALLOWED_HOSTS = new Set([
  "storage.googleapis.com",
  "firebasestorage.googleapis.com",
  "images.unsplash.com",
  "picsum.photos",
  "lh3.googleusercontent.com",
])
const MAX_INPUT_BYTES = 12 * 1024 * 1024
const FETCH_TIMEOUT_MS = 6000

/** Cacheable: 1 h en el navegador, 7 días en el CDN y se sirve vieja mientras revalida. */
export const OG_CACHE_CONTROL = "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400"
/**
 * Para la imagen de respaldo cuando la portada no se pudo leer (error pasajero, sin portada aún): caché corta, así
 * un fallo momentáneo no deja la imagen de marca pegada una semana en el CDN y WhatsApp.
 */
export const OG_FALLBACK_CACHE_CONTROL = "public, max-age=60, s-maxage=300"

/** ¿Se puede descargar esta portada? Solo https y hosts de nuestro almacenamiento / imágenes de la app. */
export function isAllowedCoverUrl(rawUrl: string | null | undefined): URL | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname) ? url : null
  } catch {
    return null
  }
}

/** Portada → JPEG 1200×630. `null` si no hay portada, el host no está permitido o algo falla. */
export async function coverToJpeg(rawUrl: string | null | undefined): Promise<Buffer | null> {
  const url = isAllowedCoverUrl(rawUrl)
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > MAX_INPUT_BYTES) return null
    const input = Buffer.from(await res.arrayBuffer())
    if (input.length > MAX_INPUT_BYTES) return null
    return await sharp(input)
      .rotate()
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover", position: "attention" })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer()
  } catch {
    return null
  }
}

export function jpegResponse(jpeg: Buffer): Response {
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": OG_CACHE_CONTROL },
  })
}
