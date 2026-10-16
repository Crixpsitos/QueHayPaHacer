import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/app/lib/site"
import { OG_CACHE_CONTROL, OG_SIZE } from "./og"

/** Imagen de marca (rojo QHPA): para páginas sin portada propia y de respaldo si una portada falla. PNG pequeño. */
export function brandImage(cacheControl: string = OG_CACHE_CONTROL): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 90px",
          background: "linear-gradient(135deg, #E63946 0%, #B8222F 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 28, fontSize: 44, opacity: 0.92 }}>Eventos y planes en Ibagué</div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": cacheControl } },
  )
}
