import { test } from "node:test"
import assert from "node:assert/strict"
import { mediaOwnershipError } from "./ActivityMedia"
import { makeImage } from "../activity.fixture"

const good = (id = "a1") => makeImage("m1", true, { path: `public/activities/${id}/images/m1.jpg`, url: "https://storage.googleapis.com/b/public/activities/a1/images/m1.jpg" })

test("medios bajo la carpeta de la actividad y servidos desde Storage son válidos", () => {
  assert.equal(mediaOwnershipError("a1", [good()]), null)
  assert.equal(mediaOwnershipError("a1", []), null)
})

test("rechaza medios de otra actividad, rutas con .. o subcarpetas, y enlaces externos", () => {
  assert.notEqual(mediaOwnershipError("a1", [good("otra")]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), path: "public/activities/a1/images/../../x.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), path: "public/activities/a1/images/sub/m1.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), url: "https://evil.com/x.jpg" }]), null)
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), url: "https://storage.googleapis.com.evil.com/x.jpg" }]), null)
})

test("la carpeta debe coincidir con el tipo (imagen en images, video en videos)", () => {
  assert.notEqual(mediaOwnershipError("a1", [{ ...good(), type: "video" }]), null)
  assert.equal(mediaOwnershipError("a1", [{ ...good(), type: "video", path: "public/activities/a1/videos/v.mp4" }]), null)
})

import { mergeMedia, parseMediaInput } from "./ActivityMedia"

test("parseMediaInput deja solo campos conocidos, ignora el estado y descarta basura", () => {
  const out = parseMediaInput([{ ...good(), status: "ready", extra: "x", url: "https://storage.googleapis.com/b/x.jpg" }, null, "x", { id: 3 }])
  assert.equal(out.length, 1)
  assert.equal("extra" in out[0], false)
  assert.equal(out[0].status, undefined)
  assert.deepEqual(parseMediaInput("no"), [])
  assert.deepEqual(parseMediaInput(undefined), [])
})

test("mergeMedia: lo que parchó el optimizador no se pisa; el cliente solo decide qué quedó, el orden, la portada y el alt", () => {
  const stored = [
    makeImage("a", true, { url: "https://storage.googleapis.com/b/opt_a.webp", status: "ready", width: 1920 }),
    makeImage("b", false, { status: "processing" }),
    makeImage("c", false, { status: "ready" }),
  ]
  const incoming = [
    makeImage("b", true, { url: "https://storage.googleapis.com/b/viejo.jpg", status: "ready", alt: "nuevo alt" }), // stale + intenta forzar ready
    makeImage("a", false, { url: "https://storage.googleapis.com/b/viejo.jpg", width: 1 }),
    makeImage("n", false, { status: "ready" }), // nuevo: entra como processing
  ]
  const m = mergeMedia(stored, incoming)
  assert.deepEqual(m.map((x) => x.id), ["b", "a", "n"]) // c eliminada, orden del cliente
  const [b, a, n] = m
  assert.deepEqual([b.isCover, b.alt, b.status], [true, "nuevo alt", "processing"]) // estado del servidor
  assert.deepEqual([a.url, a.width, a.isCover], ["https://storage.googleapis.com/b/opt_a.webp", 1920, false]) // url y tamaño del servidor
  assert.equal(n.status, "processing")
})
