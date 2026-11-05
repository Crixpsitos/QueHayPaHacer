import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// Next 16 solo permite images.qualities = [75] por defecto: sin declarar 90, `quality={90}` se coerciona a 75 y las
// imágenes de eventos sufren una segunda compresión fuerte (medido con SSIM: ver SPEC-image-quality.md).
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8")

test("next.config declara qualities con 75 y 90", () => {
  const cfg = read("../../next.config.ts")
  assert.match(cfg, /qualities:\s*\[\s*75\s*,\s*90\s*\]/)
})

test("la portada y las diapositivas del detalle del evento piden quality 90", () => {
  assert.match(read("./components/detail/EventHero.tsx"), /quality=\{90\}/)
  assert.match(read("./components/detail/EventMedia.tsx"), /quality=\{90\}/)
})
