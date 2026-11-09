import { wrapLines } from "./shareKit"

const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

/**
 * Afiche vertical 1080×1350 con el QR, el título y el lugar/fecha, listo para imprimir o subir a historias.
 * Solo dibuja texto y el QR (sin la portada): una imagen de otro origen "mancharía" el canvas y no se podría descargar.
 */
export function buildPosterCanvas(i: { qr: HTMLCanvasElement; title: string; subtitle?: string; url: string }): HTMLCanvasElement {
  const W = 1080, H = 1350
  const c = document.createElement("canvas")
  c.width = W
  c.height = H
  const g = c.getContext("2d")!
  g.fillStyle = "#FFFFFF"
  g.fillRect(0, 0, W, H)
  g.fillStyle = "#D42F3C"
  g.fillRect(0, 0, W, 150)
  g.fillStyle = "#FFFFFF"
  g.font = `700 52px ${FONT}`
  g.textBaseline = "middle"
  g.fillText("Que Hay Pa Hacer?", 64, 75)

  g.fillStyle = "#0F172A"
  g.textBaseline = "alphabetic"
  g.font = `700 72px ${FONT}`
  const lines = wrapLines(i.title, 22, 3)
  lines.forEach((l, n) => g.fillText(l, 64, 270 + n * 86))
  let y = 270 + lines.length * 86
  if (i.subtitle) {
    g.fillStyle = "#475569"
    g.font = `400 38px ${FONT}`
    for (const l of wrapLines(i.subtitle, 44, 2)) { g.fillText(l, 64, y + 20); y += 50 }
  }

  const qrSize = 560
  const qx = (W - qrSize) / 2
  // el QR baja si el título es corto, pero nunca tanto que el texto de abajo se salga del afiche
  const qy = Math.min(Math.max(y + 50, 560), H - qrSize - 200)
  g.fillStyle = "#F8FAFC"
  g.fillRect(qx - 36, qy - 36, qrSize + 72, qrSize + 72)
  g.imageSmoothingEnabled = false
  g.drawImage(i.qr, qx, qy, qrSize, qrSize)

  g.fillStyle = "#0F172A"
  g.textAlign = "center"
  g.font = `600 44px ${FONT}`
  g.fillText("Escanéalo para ver los detalles", W / 2, qy + qrSize + 90)
  g.fillStyle = "#64748B"
  g.font = `400 30px ${FONT}`
  g.fillText(i.url.replace(/^https?:\/\//, ""), W / 2, qy + qrSize + 140)
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
