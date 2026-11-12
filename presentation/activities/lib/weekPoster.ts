import type { PosterFormat } from "@/presentation/shared/lib/poster"
import type { PosterTier, WeekPosterPlan } from "@/domain/entities/activities/weekPoster"

const W = 1080
const HEAD = "Outfit, Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const BODY = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const CREAM = "#FFF8E7", GOLD = "#FFB703", WINE = "#9B0A26", DEEP = "#6E0A1D"

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const t = setTimeout(() => resolve(null), 6000)
    img.onload = () => { clearTimeout(t); resolve(img) }
    img.onerror = () => { clearTimeout(t); resolve(null) }
    img.src = src
  })
}

/** Recorta con «…» para que el texto quepa en `max` píxeles. */
function fit(g: CanvasRenderingContext2D, text: string, max: number): string {
  if (g.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}

/** Medidas por formato y por cuántos planes hay (las filas se achican para que todo quepa). */
const ROW: Record<PostersKey, { h: number; title: number; time: number; gap: number }> = {
  "feed-comfortable": { h: 118, title: 40, time: 28, gap: 12 },
  "feed-compact": { h: 82, title: 32, time: 24, gap: 8 },
  "feed-dense": { h: 96, title: 34, time: 25, gap: 10 },
  "story-comfortable": { h: 170, title: 46, time: 30, gap: 14 },
  "story-compact": { h: 122, title: 38, time: 26, gap: 10 },
  "story-dense": { h: 150, title: 42, time: 28, gap: 12 },
}
type PostersKey = `${PosterFormat}-${PosterTier}`

/**
 * Afiche «Mi semana en Ibagué» listo para compartir: 1080×1350 (feed y WhatsApp) o 1080×1920 (historias).
 * Fondo vinotinto con el sello dorado, una fila por plan (día, hora, título y precio), lo que no tiene hora en una sola línea
 * y, abajo, el QR de la semana completa. Si hay más de 8 planes, 8 filas y «+N planes más».
 */
export async function buildWeekPoster(i: { qr: HTMLCanvasElement; plan: WeekPosterPlan; url: string; format?: PosterFormat }): Promise<HTMLCanvasElement> {
  const story = i.format === "story"
  const H = story ? 1920 : 1350
  const m = ROW[`${story ? "story" : "feed"}-${i.plan.tier}` as PostersKey]
  const logo = await loadImage("/logo.png")
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const g = c.getContext("2d")!

  const bg = g.createLinearGradient(0, 0, W * 0.35, H)
  bg.addColorStop(0, WINE); bg.addColorStop(1, DEEP)
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  g.fillStyle = GOLD; g.beginPath(); g.arc(W - 40, 20, story ? 250 : 220, 0, Math.PI * 2); g.fill()

  // marca: el logo (pin vinotinto) sobre un círculo crema, con el nombre al lado
  g.textBaseline = "middle"
  g.fillStyle = CREAM; g.beginPath(); g.arc(64 + 44, 56 + 44, 44, 0, Math.PI * 2); g.fill()
  if (logo) g.drawImage(logo, 64 + 8, 56 + 6, 72, 72)
  else { g.fillStyle = WINE; g.font = `800 44px ${HEAD}`; g.textAlign = "center"; g.fillText("Q", 108, 102); g.textAlign = "left" }
  g.fillStyle = "#FFFFFF"; g.font = `700 36px ${HEAD}`; g.textAlign = "left"
  g.fillText("Qué Hay Pa Hacer", 172, 102)

  // titular y fechas
  g.textBaseline = "alphabetic"
  g.fillStyle = CREAM; g.font = `800 ${story ? 112 : 88}px ${HEAD}`
  const headY = story ? 330 : 270
  g.fillText("Mi semana", 64, headY); g.fillText("en Ibagué", 64, headY + (story ? 120 : 92))
  const pillY = headY + (story ? 120 : 92) + 30
  g.font = `700 32px ${BODY}`
  const pw = g.measureText(i.plan.rangeLabel).width + 48
  g.fillStyle = GOLD; g.beginPath(); g.roundRect(64, pillY, pw, 58, 29); g.fill()
  g.fillStyle = "#5C0011"; g.textBaseline = "middle"; g.fillText(i.plan.rangeLabel, 88, pillY + 30)

  // filas: la altura se ajusta a lo que queda entre el titular y la franja del QR (nunca se montan sobre ella)
  const top = H - (story ? 380 : 270)
  let y = pillY + 58 + (story ? 52 : 30)
  const n = Math.max(1, i.plan.rows.length)
  const extras = (i.plan.more > 0 ? 56 : 0) + (i.plan.anytime.length ? 52 : 0)
  const rh = Math.min(m.h, Math.floor((top - 20 - y - extras - m.gap * (n - 1)) / n))
  const tall = rh >= 104
  const tsz = tall ? m.title : Math.max(24, Math.min(m.title, Math.round(rh * 0.42)))
  const msz = tall ? m.time : Math.max(18, Math.round(tsz * 0.74))
  for (const r of i.plan.rows) {
    g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.roundRect(64, y, W - 128, rh, 24); g.fill()
    const mid = y + rh / 2
    g.textAlign = "left"
    if (r.showDay) {
      g.fillStyle = GOLD; g.font = `800 ${tsz - 4}px ${HEAD}`; g.fillText(r.day, 92, mid - (tall ? 12 : 0))
      if (tall) { g.fillStyle = "#FDE7EB"; g.font = `600 ${msz - 4}px ${BODY}`; g.fillText(r.dayNum, 92, mid + 24) }
    }
    g.font = `700 ${msz}px ${BODY}`
    const priceW = g.measureText(r.price).width
    const timeW = tall ? 0 : g.measureText(r.time).width + 28
    const textX = 250
    g.fillStyle = "#FFFFFF"; g.font = `700 ${tsz}px ${HEAD}`
    g.fillText(fit(g, r.title, W - 92 - textX - priceW - 24 - timeW), textX, mid - (tall ? 14 : 0))
    g.fillStyle = "#FDE7EB"; g.font = `500 ${msz}px ${BODY}`
    if (tall) g.fillText(r.time, textX, mid + 26)
    else { g.textAlign = "right"; g.fillText(r.time, W - 92 - priceW - 20, mid); g.textAlign = "left" }
    g.fillStyle = r.price === "Gratis" ? GOLD : "#FFFFFF"; g.font = `700 ${msz}px ${BODY}`; g.textAlign = "right"
    g.fillText(r.price, W - 92, tall ? mid - 14 : mid); g.textAlign = "left"
    y += rh + m.gap
  }
  g.textBaseline = "middle"
  if (i.plan.more > 0) {
    g.fillStyle = CREAM; g.font = `700 ${story ? 36 : 32}px ${BODY}`
    g.fillText(`+ ${i.plan.more} ${i.plan.more === 1 ? "plan más" : "planes más"} en el enlace`, 92, y + 24); y += 56
  }
  if (i.plan.anytime.length) {
    const names = i.plan.anytime.join(", ") + (i.plan.anytimeMore ? ` y ${i.plan.anytimeMore} más` : "")
    g.fillStyle = CREAM; g.font = `600 ${story ? 32 : 28}px ${BODY}`
    g.fillText(fit(g, `Cuando quieras: ${names}`, W - 184), 92, y + 24)
  }

  // franja inferior con el QR
  g.fillStyle = CREAM; g.fillRect(0, top, W, H - top)
  const qrSize = story ? 260 : 190
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.roundRect(W - 64 - qrSize - 28, top + (H - top - qrSize - 28) / 2, qrSize + 28, qrSize + 28, 24); g.fill()
  g.imageSmoothingEnabled = false
  g.drawImage(i.qr, W - 64 - qrSize - 14, top + (H - top - qrSize) / 2, qrSize, qrSize)
  g.textAlign = "left"; g.textBaseline = "alphabetic"
  g.fillStyle = DEEP; g.font = `800 ${story ? 52 : 46}px ${HEAD}`
  g.fillText("Escanéalo y arma", 64, top + (story ? 150 : 108)); g.fillText("la tuya", 64, top + (story ? 210 : 160))
  g.fillStyle = WINE; g.font = `700 ${story ? 30 : 28}px ${BODY}`
  g.fillText("yquehaypahacer.com/actividades", 64, top + (story ? 270 : 212))
  return c
}
