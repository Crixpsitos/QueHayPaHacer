import { ImageResponse } from "next/og"
import { createServerContainer } from "@/infraestructure/di/container"
import { fetchReviews } from "@/presentation/activities/data/reviews"
import { brandImage } from "../../../_lib/brand"
import { OG_FALLBACK_CACHE_CONTROL, OG_SIZE } from "../../../_lib/og"

const clip = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t)

/**
 * Tarjeta para compartir una reseña: estrellas, frase, nombre público y la actividad. Solo datos ya públicos (nunca uid, correo ni fotos de terceros).
 * Una reseña «En verificación» no se comparte. Sin reseña válida: imagen de marca.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; key: string }> }) {
  const { id, key } = await params
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id) || !/^[a-f0-9]{20}$/.test(key)) return brandImage(OG_FALLBACK_CACHE_CONTROL)
  const [data, a] = await Promise.all([fetchReviews(id), createServerContainer().activityService.getPublicById(id).catch(() => null)])
  const r = data.reviews.find((x) => x.key === key)
  if (!r || r.inVerification) return brandImage(OG_FALLBACK_CACHE_CONTROL)
  const quote = clip(r.body || r.title || `Fue en ${r.visitedLabel}`, 190)
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 72px", background: "#9B0A26", color: "white" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <svg key={n} width="44" height="44" viewBox="0 0 24 24"><polygon points="12,2 15,9 22,9.5 16.5,14 18.5,21.5 12,17.5 5.5,21.5 7.5,14 2,9.5 9,9" fill={n <= r.rating ? "#FFB703" : "none"} stroke="#FFB703" strokeWidth="1.5" /></svg>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: quote.length > 120 ? 40 : 50, fontWeight: 700, lineHeight: 1.2 }}>{`«${quote}»`}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{`${r.name} · ${r.visitedLabel}`}</div>
          <div style={{ display: "flex", fontSize: 26, opacity: 0.9 }}>{clip(a?.title ?? "Una actividad en Ibagué", 60)}</div>
          <div style={{ display: "flex", fontSize: 24, color: "#FFB703", fontWeight: 700, marginTop: 8 }}>yquehaypahacer.com</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
  )
}
