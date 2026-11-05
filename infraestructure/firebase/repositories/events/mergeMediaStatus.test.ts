import { test } from "node:test"
import assert from "node:assert/strict"
import { mergeMediaStatus } from "./mergeMediaStatus"

const processing = (id: string) => ({ id, type: "image", data: { url: `u-${id}`, path: `p-${id}`, status: "processing" as const, temporaryUrl: `t-${id}` } })
const ready = (id: string) => ({ id, type: "image", data: { url: `opt-${id}`, path: `optimized_${id}`, status: "ready" as const, width: 1200, height: 800 } })
const failed = (id: string) => ({ id, type: "image", data: { url: `u-${id}`, path: `p-${id}`, status: "error" as const } })

test("un guardado con item en processing no pisa el ready que escribió el CF", () => {
  const out = mergeMediaStatus({ media: [processing("a")] }, { media: [ready("a")] })
  assert.deepEqual(out.media, [ready("a")])
})

test("tampoco pisa un error del CF", () => {
  const out = mergeMediaStatus({ media: [processing("a")] }, { media: [failed("a")] })
  assert.deepEqual(out.media, [failed("a")])
})

test("si lo guardado sigue en processing, queda lo que manda el cliente", () => {
  const out = mergeMediaStatus({ media: [processing("a")] }, { media: [processing("a")] })
  assert.deepEqual(out.media, [processing("a")])
})

test("items nuevos se conservan y los que el usuario borró siguen borrados", () => {
  const out = mergeMediaStatus({ media: [processing("b")] }, { media: [ready("a")] })
  assert.deepEqual(out.media, [processing("b")])
})

test("un item que el cliente ya tiene ready (p. ej. cambió el alt) manda el cliente", () => {
  const edited = { ...ready("a"), data: { ...ready("a").data, alt: "nuevo" } }
  const out = mergeMediaStatus({ media: [edited] }, { media: [ready("a")] })
  assert.deepEqual(out.media, [edited])
})

test("respeta el orden del cliente al sustituir", () => {
  const out = mergeMediaStatus({ media: [processing("b"), processing("a")] }, { media: [ready("a")] })
  assert.deepEqual(out.media, [processing("b"), ready("a")])
})

const UP = "public/events/E1/images/deoptimized-main-image-f.webp-uuid1"
const mainProcessing = (path: string) => ({ mainImage: { url: "x", path, status: "processing" as const, temporaryUrl: "x" } })

test("portada: processing + ready del CF para ESA misma subida (originalPath igual) → queda el ready", () => {
  const stored = { mainImage: { url: "opt", path: "public/events/E1/images/optimized_main-image-f.webp", originalPath: UP, status: "ready" as const } }
  assert.deepEqual(mergeMediaStatus(mainProcessing(UP), stored).mainImage, stored.mainImage)
})

test("portada: re-subir un archivo con el MISMO nombre (otro uuid) no adopta el ready anterior", () => {
  const UP2 = "public/events/E1/images/deoptimized-main-image-f.webp-uuid2"
  const stored = { mainImage: { url: "opt", path: "public/events/E1/images/optimized_main-image-f.webp", originalPath: UP, status: "ready" as const } }
  assert.deepEqual(mergeMediaStatus(mainProcessing(UP2), stored).mainImage, mainProcessing(UP2).mainImage)
})

test("portada: ready viejo sin originalPath (anterior a este cambio) no se adopta", () => {
  const stored = { mainImage: { url: "opt", path: "public/events/E1/images/optimized_main-image-f.webp", status: "ready" as const } }
  assert.deepEqual(mergeMediaStatus(mainProcessing(UP), stored).mainImage, mainProcessing(UP).mainImage)
})

test("un error del cliente (subida falló en el navegador) no pisa un ready del CF", () => {
  const out = mergeMediaStatus({ media: [failed("a")] }, { media: [ready("a")] })
  assert.deepEqual(out.media, [ready("a")])
})

test("sin media/mainImage en el evento (guardado parcial) no inventa nada", () => {
  const event = { title: "x" }
  const out = mergeMediaStatus(event, { media: [ready("a")], mainImage: { url: "o", status: "ready" as const } })
  assert.deepEqual(out, { title: "x" })
})

test("sin documento previo devuelve el evento tal cual", () => {
  const event = { media: [processing("a")] }
  assert.deepEqual(mergeMediaStatus(event, undefined), event)
})

test("no muta el evento recibido", () => {
  const event = { media: [processing("a")] }
  mergeMediaStatus(event, { media: [ready("a")] })
  assert.deepEqual(event.media, [processing("a")])
})
