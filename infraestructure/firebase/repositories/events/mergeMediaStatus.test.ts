import { test } from "node:test"
import assert from "node:assert/strict"
import { mergeMediaStatus, optimizedPathFor } from "./mergeMediaStatus"

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

test("optimizedPathFor refleja el nombre que genera compressImage", () => {
  assert.equal(
    optimizedPathFor("public/events/E1/images/deoptimized-main-image-alumbrado_dos.webp-3f091f91-0c37-498e"),
    "public/events/E1/images/optimized_main-image-alumbrado_dos.webp",
  )
  assert.equal(
    optimizedPathFor("public/events/E1/images/deoptimized-media-foto.jpeg-e4c4eafa-947f"),
    "public/events/E1/images/optimized_media-foto.webp",
  )
})

test("portada: processing + ready del CF para ESA subida → queda el ready", () => {
  const incoming = { mainImage: { url: "x", path: "public/events/E1/images/deoptimized-main-image-f.webp-uuid1", status: "processing" as const, temporaryUrl: "x" } }
  const stored = { mainImage: { url: "opt", path: "public/events/E1/images/optimized_main-image-f.webp", status: "ready" as const } }
  assert.deepEqual(mergeMediaStatus(incoming, stored).mainImage, stored.mainImage)
})

test("portada: subida nueva con otro archivo NO adopta el ready de la portada anterior", () => {
  const incoming = { mainImage: { url: "x", path: "public/events/E1/images/deoptimized-main-image-nueva.webp-uuid2", status: "processing" as const, temporaryUrl: "x" } }
  const stored = { mainImage: { url: "opt", path: "public/events/E1/images/optimized_main-image-vieja.webp", status: "ready" as const } }
  assert.deepEqual(mergeMediaStatus(incoming, stored).mainImage, incoming.mainImage)
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
