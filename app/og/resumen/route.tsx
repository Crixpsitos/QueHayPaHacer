import { ImageResponse } from "next/og"
import { fetchWeekendDigest } from "@/presentation/activities/data/digest"
import { OG_SIZE } from "../_lib/og"

const short = (t: string) => { return t.length > 34 ? `${t.slice(0, 33).trimEnd()}…` : t }

/** Imagen del resumen del fin de semana (1200×630): vinotinto de marca, hasta 3 días y 4 planes por día. Datos públicos, caché corta. */
export async function GET() {
  const d = await fetchWeekendDigest()
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: "48px 64px", background: "#9B0A26", color: "white" }}>
        <div style={{ display: "flex", fontSize: 54, fontWeight: 800, lineHeight: 1.05 }}>{d.title}</div>
        <div style={{ display: "flex", marginTop: 28, gap: 28, flex: 1 }}>
          {d.days.slice(0, 3).map((day) => (
            <div key={day.date} style={{ display: "flex", flexDirection: "column", flex: 1, background: "white", color: "#27272A", borderRadius: 28, padding: 24, overflow: "hidden" }}>
              <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: "#9B0A26", textTransform: "capitalize", flexShrink: 0 }}>{day.label}</div>
              {day.items.slice(0, 4).map((i) => (
                <div key={i.url} style={{ display: "flex", flexDirection: "column", marginTop: 12, flexShrink: 0 }}>
                  <div style={{ display: "flex", fontSize: 20, fontWeight: 700 }}>{i.timeLabel}</div>
                  <div style={{ display: "flex", fontSize: 21, lineHeight: 1.15 }}>{short(i.title)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "#FFB703", fontWeight: 700 }}>yquehaypahacer.com</div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  )
}
