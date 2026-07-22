import { ImageResponse } from "next/og";
import {
  fetchEventDetailBySlug,
  fetchEventDetailById,
} from "@/presentation/events/data/eventDetailFetchers";
import { SITE_NAME } from "@/app/lib/site";

export const alt = "Evento en Ibagué";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG dinámica del detalle: el `mainImage` del evento de fondo + overlay de marca
 * (título, categoría · ciudad). Route Handler en runtime Node (usa Firebase admin
 * vía los fetchers cacheados). Cacheada por evento.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = (await fetchEventDetailBySlug(id)) ?? (await fetchEventDetailById(id));

  const title = event?.title ?? "Evento en Ibagué";
  const category = event?.categoryInfo?.title;
  const city = event?.location?.city?.name ?? "Ibagué";
  const subtitle = [category, city].filter(Boolean).join(" · ");

  // Fetch server-side + data URI: el fetch interno de Satori para imágenes
  // remotas es poco fiable. Si falla, cae al fondo de marca (fallback digno).
  let imageSrc: string | undefined;
  const rawImage = event?.mainImage?.url;
  if (rawImage) {
    try {
      const res = await fetch(rawImage);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") ?? "image/jpeg";
        imageSrc = `data:${ct};base64,${buf.toString("base64")}`;
      }
    } catch {
      // sin imagen → fondo de marca
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b0b0f",
        }}
      >
        {imageSrc && (
          <img
            src={imageSrc}
            width={1200}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 1200,
              height: 630,
              objectFit: "cover",
            }}
          />
        )}

        {/* Degradado para legibilidad del texto */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(11,11,15,0.15) 0%, rgba(11,11,15,0.9) 100%)",
          }}
        />

        {/* Contenido */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
          }}
        >
          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#7c3aed",
                color: "white",
                padding: "10px 22px",
                borderRadius: 999,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {SITE_NAME}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 66,
                fontWeight: 800,
                color: "white",
                lineHeight: 1.1,
                maxWidth: 1040,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ display: "flex", marginTop: 20, fontSize: 34, color: "#e5e7eb" }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
