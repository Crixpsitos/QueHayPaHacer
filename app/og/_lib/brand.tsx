import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/app/lib/site"
import { OG_CACHE_CONTROL, OG_SIZE } from "./og"
import { LOGO_DATA_URI } from "./logo-data"

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
          position: "relative",
          padding: "0 90px",
          background: "linear-gradient(135deg, #E63946 0%, #B8222F 100%)",
          color: "white",
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.05 }}>{SITE_NAME}</div>
        <div style={{ marginTop: 28, fontSize: 44, opacity: 0.92 }}>Eventos y planes en Ibagué</div>
        <div
          style={{
            position: "absolute",
            right: 48,
            top: 155,
            width: 320,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse (satori) no usa next/image */}
          <img src={LOGO_DATA_URI} alt="" width={264} height={264} />
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": cacheControl } },
  )
}
