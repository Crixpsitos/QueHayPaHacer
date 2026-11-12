/** Reduce una foto a máx. `maxSide` px por lado y la pasa a JPEG: las fotos de celular pesan varios MB y la carta se ve en móvil. */
export async function resizeToJpeg(file: File, maxSide = 1280, quality = 0.85): Promise<File> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality))
  if (!blob) throw new Error("No se pudo procesar la foto.")
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
}
