import type { PosterFormat } from "@/presentation/shared/lib/poster"
import type { PosterTier, WeekPosterPlan } from "@/domain/entities/activities/weekPoster"

const W = 1080
const HEAD = "Outfit, Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const BODY = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const CREAM = "#FFF8E7", GOLD = "#FFB703", WINE = "#9B0A26", DEEP = "#6E0A1D", INK = "#27272A"

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const t = setTimeout(() => resolve(null), 6000)
    img.onload = () => { clearTimeout(t); resolve(img) }
    img.onerror = () => { clearTimeout(t); resolve(null) }
    img.src = src
  })
}
/** Las fotos se piden por la ruta de imágenes de la propia web (mismo origen: el canvas no se «mancha» y se puede descargar). */
const photo = (u: string | null) => (u ? loadImage(/^https?:/.test(u) ? `/_next/image?url=${encodeURIComponent(u)}&w=256&q=70` : u) : Promise.resolve(null))

function fit(g: CanvasRenderingContext2D, text: string, max: number): string {
  if (g.measureText(text).width <= max) return text
  let t = text
  while (t.length > 1 && g.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t.trimEnd()}…`
}
function cover(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, s: number) {
  const k = Math.max(s / img.width, s / img.height), sw = s / k, sh = s / k
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, s, s)
}

const ROW_H: Record<`${PosterFormat}-${PosterTier}`, number> = {
  "feed-comfortable": 190, "feed-compact": 118, "feed-dense": 118,
  "story-comfortable": 280, "story-compact": 190, "story-dense": 190,
}

/**
 * Afiche «Mi semana en Ibagué» (1080×1350 para feed y WhatsApp, 1080×1920 para historias): fondo vinotinto con el logo grande
 * asomando por la derecha, y cada plan en una tarjeta crema con su foto, el día y la hora, y el precio. Las tarjetas se achican
 * según cuántos planes haya (máx. 8; con más, 6 y «+N planes más»). Abajo, el QR de la semana completa.
 */
export async function buildWeekPoster(i: { qr: HTMLCanvasElement; plan: WeekPosterPlan; url: string; format?: PosterFormat }): Promise<HTMLCanvasElement> {
  const story = i.format === "story"
  const H = story ? 1920 : 1350
  const [logo, ...pics] = await Promise.all([loadImage("/logo.png"), ...i.plan.rows.map((r) => photo(r.imageUrl))])
  const c = document.createElement("canvas")
  c.width = W; c.height = H
  const g = c.getContext("2d")!

  const bg = g.createLinearGradient(0, 0, W * 0.4, H)
  bg.addColorStop(0, WINE); bg.addColorStop(1, DEEP)
  g.fillStyle = bg; g.fillRect(0, 0, W, H)
  g.save(); g.globalAlpha = 0.1
  if (logo) g.drawImage(logo, W - 330, H * 0.3, 660, 660)
  g.restore()
  g.fillStyle = GOLD; g.beginPath(); g.arc(W - 40, 20, story ? 250 : 215, 0, Math.PI * 2); g.fill()

  // marca
  g.textBaseline = "middle"; g.textAlign = "left"
  g.fillStyle = CREAM; g.beginPath(); g.arc(108, 100, 44, 0, Math.PI * 2); g.fill()
  if (logo) g.drawImage(logo, 72, 62, 72, 72)
  g.fillStyle = "#FFFFFF"; g.font = `700 36px ${HEAD}`
  g.fillText("Qué Hay Pa Hacer", 172, 102)

  // titular y fechas
  g.textBaseline = "alphabetic"
  const headY = story ? 330 : 262
  g.fillStyle = CREAM; g.font = `800 ${story ? 112 : 92}px ${HEAD}`
  g.fillText("Mi semana", 64, headY); g.fillText("en Ibagué", 64, headY + (story ? 120 : 98))
  const pillY = headY + (story ? 120 : 98) + 30
  g.font = `700 32px ${BODY}`
  const pw = g.measureText(i.plan.rangeLabel).width + 52
  g.fillStyle = GOLD; g.beginPath(); g.roundRect(64, pillY, pw, 60, 30); g.fill()
  g.fillStyle = "#5C0011"; g.textBaseline = "middle"; g.fillText(i.plan.rangeLabel, 90, pillY + 31)

  // tarjetas: la altura se ajusta a lo que queda entre el titular y la franja del QR
  const top = H - (story ? 380 : 270)
  let y = pillY + 60 + (story ? 50 : 30)
  const n = Math.max(1, i.plan.rows.length)
  const gap = story ? 16 : 12
  const more = i.plan.more > 0 ? 58 : 0
  const rh = Math.min(ROW_H[`${story ? "story" : "feed"}-${i.plan.tier}`], Math.floor((top - 16 - y - more - gap * (n - 1)) / n))
  const th = Math.round((rh - 20) * 0.78)
  y += Math.max(0, Math.floor((top - 16 - y - (rh * n + gap * (n - 1) + more)) / 2) * 0.6)
  const tsz = Math.max(24, Math.min(story ? 46 : 40, Math.round(rh * 0.23)))
  const msz = Math.max(20, Math.round(tsz * 0.68))
  i.plan.rows.forEach((r, k) => {
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(64, y, W - 128, rh, 30); g.fill()
    // foto (o bloque dorado con la inicial)
    const tx = 74, ty = y + 10
    g.save(); g.beginPath(); g.roundRect(tx, ty, th, th, 22); g.clip()
    const pic = pics[k]
    if (pic) cover(g, pic, tx, ty, th)
    else { const gg = g.createLinearGradient(tx, ty, tx + th, ty + th); gg.addColorStop(0, GOLD); gg.addColorStop(1, "#F08A00"); g.fillStyle = gg; g.fillRect(tx, ty, th, th); g.fillStyle = "#5C0011"; g.textAlign = "center"; g.font = `800 ${Math.round(th * 0.5)}px ${HEAD}`; g.fillText(r.title.charAt(0).toUpperCase(), tx + th / 2, ty + th / 2 + 2); g.textAlign = "left" }
    g.restore()
    // precio (píldora a la derecha, chica: lo importante es QUÉ es el plan)
    const psz = Math.max(18, Math.round(msz * 0.85))
    g.font = `700 ${psz}px ${BODY}`
    const priceW = g.measureText(r.price).width + 28
    const free = r.price === "Gratis"
    g.fillStyle = free ? "#E4F5E8" : WINE; g.beginPath(); g.roundRect(W - 64 - 20 - priceW, y + 18, priceW, psz * 1.9, psz); g.fill()
    g.fillStyle = free ? "#14532D" : "#FFFFFF"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(r.price, W - 64 - 20 - priceW / 2, y + 18 + psz * 0.95 + 1); g.textAlign = "left"
    // título (hasta 2 líneas: se lee completo) y cuándo
    const x = tx + th + 22
    const maxW = W - 64 - 20 - x - 20
    g.font = `800 ${tsz}px ${HEAD}`
    const words = r.title.split(" "), lines: string[] = [""]
    for (const w of words) { const t = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${w}` : w; if (g.measureText(t).width <= maxW || !lines[lines.length - 1]) lines[lines.length - 1] = t; else lines.push(w) }
    const shown = lines.slice(0, 2).map((l, n, all) => (n === 1 && lines.length > 2 ? fit(g, `${l} …`, maxW) : fit(g, l, maxW)))
    const block = shown.length * tsz * 1.12 + msz * 1.5
    let ty0 = y + (rh - block) / 2 + tsz * 0.9
    g.textBaseline = "alphabetic"; g.fillStyle = INK
    shown.forEach((l, n) => g.fillText(l, x, ty0 + n * tsz * 1.12))
    g.fillStyle = WINE; g.font = `700 ${msz}px ${BODY}`
    g.fillText(fit(g, `${r.day} · ${r.time}`, maxW), x, ty0 + shown.length * tsz * 1.12 + msz * 0.2)
    y += rh + gap
  })
  g.textBaseline = "middle"
  if (i.plan.more > 0) {
    g.fillStyle = CREAM; g.font = `700 ${story ? 36 : 32}px ${BODY}`
    g.fillText(`+ ${i.plan.more} ${i.plan.more === 1 ? "plan más" : "planes más"} en el enlace`, 72, y + 22)
  }

  // franja inferior con el QR
  g.fillStyle = CREAM; g.fillRect(0, top, W, H - top)
  const qrSize = story ? 260 : 190
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.roundRect(W - 64 - qrSize - 28, top + (H - top - qrSize - 28) / 2, qrSize + 28, qrSize + 28, 24); g.fill()
  g.imageSmoothingEnabled = false
  g.drawImage(i.qr, W - 64 - qrSize - 14, top + (H - top - qrSize) / 2, qrSize, qrSize)
  g.textBaseline = "alphabetic"
  g.fillStyle = DEEP; g.font = `800 ${story ? 52 : 46}px ${HEAD}`
  g.fillText("Escanéalo y arma", 64, top + (story ? 150 : 108)); g.fillText("la tuya", 64, top + (story ? 210 : 160))
  g.fillStyle = WINE; g.font = `700 ${story ? 30 : 28}px ${BODY}`
  g.fillText("yquehaypahacer.com/actividades", 64, top + (story ? 270 : 212))
  return c
}
