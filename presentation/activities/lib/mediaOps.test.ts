import { test } from "node:test"
import assert from "node:assert/strict"
import { makeImage } from "@/domain/entities/activities/activity.fixture"
import { addMedia, fileLimitError, removeMedia, setAlt, setCover } from "./mediaOps"

const video = (id: string) => ({ ...makeImage(id, false), type: "video" as const })

test("addMedia: la primera imagen pasa a ser la portada si no había", () => {
  const m = addMedia([], [makeImage("a", false), makeImage("b", false)])
  assert.deepEqual(m.map((x) => [x.id, x.isCover]), [["a", true], ["b", false]])
})

test("addMedia: no cambia la portada existente ni marca videos como portada", () => {
  const m = addMedia([makeImage("a", true)], [makeImage("b", false)])
  assert.deepEqual(m.map((x) => x.isCover), [true, false])
  const v = addMedia([], [video("v"), makeImage("i", false)])
  assert.deepEqual(v.map((x) => [x.id, x.isCover]), [["v", false], ["i", true]])
})

test("setCover deja una sola portada y solo entre imágenes", () => {
  const base = [makeImage("a", true), makeImage("b", false), video("v")]
  assert.deepEqual(setCover(base, "b").map((x) => x.isCover), [false, true, false])
  assert.deepEqual(setCover(base, "v").map((x) => x.isCover), [true, false, false]) // un video no es portada
})

test("removeMedia: si se quita la portada, la primera imagen que queda la reemplaza", () => {
  const base = [makeImage("a", true), makeImage("b", false), makeImage("c", false)]
  assert.deepEqual(removeMedia(base, "a").map((x) => [x.id, x.isCover]), [["b", true], ["c", false]])
  assert.deepEqual(removeMedia(base, "c").map((x) => x.isCover), [true, false])
  assert.deepEqual(removeMedia([makeImage("a", true)], "a"), [])
})

test("setAlt recorta a 125 caracteres", () => {
  const m = setAlt([makeImage("a", true)], "a", "x".repeat(200))
  assert.equal(m[0].alt.length, 125)
})

test("límites de archivo: tipo, tamaño y cantidad", () => {
  const nine = Array.from({ length: 9 }, (_, i) => makeImage(`i${i}`, i === 0))
  assert.equal(fileLimitError({ type: "image/jpeg", size: 2_000_000 }, []), null)
  assert.match(fileLimitError({ type: "image/svg+xml", size: 1000 }, [])!, /tipo/i)
  assert.match(fileLimitError({ type: "application/pdf", size: 1000 }, [])!, /tipo/i)
  assert.match(fileLimitError({ type: "image/jpeg", size: 11 * 1024 * 1024 }, [])!, /10 MB/)
  assert.match(fileLimitError({ type: "image/jpeg", size: 1000 }, nine)!, /9 fotos/)
  assert.equal(fileLimitError({ type: "video/mp4", size: 100 * 1024 * 1024 }, []), null)
  assert.match(fileLimitError({ type: "video/mp4", size: 201 * 1024 * 1024 }, [])!, /200 MB/)
  assert.match(fileLimitError({ type: "video/mp4", size: 1000 }, [video("v")])!, /un video/i)
})
