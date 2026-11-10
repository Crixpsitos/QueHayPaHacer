import { posterHooks, wrapLines } from "./shareKit"

const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
const W = 1080
export type PosterFormat = "feed" | "story"
export interface PosterInput {
  qr: HTMLCanvasElement
  kind: "event" | "site"
  title: string
  subtitle?: string
  url: string
  /** Portada de la ficha (opcional). Si el servidor no permite leerla desde el navegador, se usa un fondo de marca. */
  imageUrl?: string
  format?: PosterFormat
}

/** Carga una imagen; null si falla o tarda más de 6 s (nunca bloquea el afiche). `cors`: pedirla con CORS para poder dibujarla sin "manchar" el canvas. */
function loadImage(src: string, cors: boolean): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    if (cors) img.crossOrigin = "anonymous"
    const t = setTimeout(() => resolve(null), 6000)
    img.onload = () => { clearTimeout(t); resolve(img) }
    img.onerror = () => { clearTimeout(t); resolve(null) }
    img.src = src
  })
}

/** Dibuja `img` recortada para llenar el rectángulo (como `object-fit: cover`). */
function drawCover(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s, sh = h / s
  g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

function tick(g: CanvasRenderingContext2D, cx: number, cy: number) {
  g.fillStyle = "#D42F3C"
  g.beginPath(); g.arc(cx, cy, 17, 0, Math.PI * 2); g.fill()
  g.strokeStyle = "#fff"; g.lineWidth = 4; g.lineCap = "round"; g.lineJoin = "round"
  g.beginPath(); g.moveTo(cx - 7, cy + 1); g.lineTo(cx - 2, cy + 6); g.lineTo(cx + 8, cy - 5); g.stroke()
}

/**
 * Afiche listo para publicar (1080×1350) o para historias (1080×1920): foto arriba con el título, y abajo el gancho
 * ("qué ganas al escanear"), el QR en tarjeta y el logo de la marca asomando por la pared derecha.
 */
export async function buildPoster(i: PosterInput): Promise<HTMLCanvasElement> {
  const story = i.format === "story"
  const H = story ? 1920 : 1350
  const heroH = story ? 1100 : 780
  const [cover, logo] = await Promise.all([i.imageUrl ? loadImage(i.imageUrl, true) : Promise.resolve(null), loadImage("/logo.png", false)])

  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const g = c.getContext("2d")!
  g.fillStyle = "#FFFFFF"
  g.fillRect(0, 0, W, H)

  // ── foto (o fondo de marca) + degradado para que el título se lea
  if (cover) drawCover(g, cover, 0, 0, W, heroH)
  else {
    const bg = g.createLinearGradient(0, 0, W, heroH)
    bg.addColorStop(0, "#7A1626"); bg.addColorStop(1, "#D42F3C")
    g.fillStyle = bg; g.fillRect(0, 0, W, heroH)
    if (logo) { g.globalAlpha = 0.16; g.drawImage(logo, W - 520, heroH / 2 - 380, 760, 760); g.globalAlpha = 1 }
  }
  const shade = g.createLinearGradient(0, heroH * 0.35, 0, heroH)
  shade.addColorStop(0, "rgba(15,23,42,0)"); shade.addColorStop(1, "rgba(15,23,42,0.9)")
  g.fillStyle = shade; g.fillRect(0, 0, W, heroH)

  // ── marca arriba a la izquierda
  g.fillStyle = "rgba(255,255,255,0.96)"
  g.beginPath(); g.roundRect(48, 48, 400, 84, 42); g.fill()
  if (logo) g.drawImage(logo, 58, 56, 68, 68)
  g.fillStyle = "#0F172A"; g.font = `700 32px ${FONT}`; g.textBaseline = "middle"
  g.fillText("Que Hay Pa Hacer?", 138, 91)

  // ── título y datos, de abajo hacia arriba sobre la foto
  g.textBaseline = "alphabetic"
  const sub = i.subtitle ? wrapLines(i.subtitle, 42, 2) : []
  let y = heroH - 84
  g.fillStyle = "rgba(255,255,255,0.92)"; g.font = `500 38px ${FONT}`
  const subTop = y - (sub.length - 1) * 50
  sub.forEach((l, n) => g.fillText(l, 64, subTop + n * 50))
  const titleLines = wrapLines(i.title, 21, 3)
  g.fillStyle = "#FFFFFF"; g.font = `800 78px ${FONT}`
  const titleBottom = (sub.length ? subTop - 64 : y - 10)
  titleLines.forEach((l, n) => g.fillText(l, 64, titleBottom - (titleLines.length - 1 - n) * 90))

  // ── panel inferior blanco que "sube" sobre la foto
  const top = heroH - 44
  g.fillStyle = "#FFFFFF"
  g.beginPath(); g.roundRect(0, top, W, H - top + 44, [44, 44, 0, 0]); g.fill()

  // logo a media altura, solo su mitad izquierda, saliendo de la pared derecha
  if (logo) {
    g.save()
    g.beginPath(); g.rect(0, top, W, H - top); g.clip()
    g.globalAlpha = 0.12
    const size = story ? 860 : 740
    g.drawImage(logo, W - size / 2, top + (H - top - size) / 2 + 30, size, size)
    g.restore()
  }

  const pad = story ? 150 : 96
  const hooks = posterHooks(i.kind)
  g.fillStyle = "#0F172A"; g.font = `800 52px ${FONT}`
  const hl = wrapLines(hooks.headline, 17, 3)
  hl.forEach((l, n) => g.fillText(l, 64, top + pad + n * 62))
  const by = top + pad + hl.length * 62 + 22
  g.font = `500 36px ${FONT}`
  hooks.bullets.forEach((b, n) => {
    tick(g, 81, by + n * 66 - 12)
    g.fillStyle = "#334155"; g.fillText(b, 116, by + n * 66)
  })

  // QR en tarjeta con sombra
  const card = story ? 436 : 400
  const cx = W - 64 - card, cy = top + (story ? 90 : 60)
  g.save()
  g.shadowColor = "rgba(15,23,42,0.22)"; g.shadowBlur = 36; g.shadowOffsetY = 14
  g.fillStyle = "#FFFFFF"; g.beginPath(); g.roundRect(cx, cy, card, card, 32); g.fill()
  g.restore()
  g.strokeStyle = "#E2E8F0"; g.lineWidth = 2; g.beginPath(); g.roundRect(cx, cy, card, card, 32); g.stroke()
  g.imageSmoothingEnabled = false
  g.drawImage(i.qr, cx + 26, cy + 26, card - 52, card - 52)
  g.textAlign = "center"; g.fillStyle = "#475569"; g.font = `600 30px ${FONT}`
  g.fillText("Apunta la cámara aquí", cx + card / 2, cy + card + 50)

  // pie
  g.textAlign = "center"
  g.fillStyle = "#D42F3C"; g.font = `700 36px ${FONT}`
  g.fillText("yquehaypahacer.com", W / 2, H - 56)
  return c
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }, "image/png")
}
