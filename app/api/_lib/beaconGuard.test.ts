import { test } from "node:test"
import assert from "node:assert/strict"
import { createGlobalLimiter, isSameOriginBeacon, readBoundedJson } from "./beaconGuard"

test("tope global: deja pasar hasta el límite por minuto y luego descarta", () => {
  let now = 1_000_000
  const allowed = createGlobalLimiter(3, () => now)
  assert.deepEqual([allowed(), allowed(), allowed(), allowed(), allowed()], [true, true, true, false, false])
  now += 61_000
  assert.equal(allowed(), true, "la ventana se reinicia al pasar el minuto")
})

test("tope global: n eventos de una llamada cuentan por n", () => {
  const allowed = createGlobalLimiter(5, () => 1)
  assert.equal(allowed(4), true)
  assert.equal(allowed(2), false)
})

const h = (init: Record<string, string>) => new Headers(init)

test("isSameOriginBeacon acepta same-origin y rechaza cross-site", () => {
  assert.equal(isSameOriginBeacon(h({ "sec-fetch-site": "same-origin" })), true)
  assert.equal(isSameOriginBeacon(h({ "sec-fetch-site": "cross-site" })), false)
  assert.equal(isSameOriginBeacon(h({ "sec-fetch-site": "same-site" })), false)
  assert.equal(isSameOriginBeacon(h({ "sec-fetch-site": "none" })), false)
})

test("isSameOriginBeacon sin Sec-Fetch-Site cae a Origin vs Host; sin ninguno, rechaza", () => {
  assert.equal(isSameOriginBeacon(h({ origin: "https://qhpa.test", host: "qhpa.test" })), true)
  assert.equal(isSameOriginBeacon(h({ origin: "https://otro.test", host: "qhpa.test" })), false)
  assert.equal(isSameOriginBeacon(h({})), false)
})

const post = (body: string, type = "application/json") => new Request("https://qhpa.test/x", { method: "POST", body, headers: { "content-type": type } })

test("readBoundedJson devuelve el JSON válido", async () => {
  assert.deepEqual(await readBoundedJson(post('{"type":"view"}'), 1024), { type: "view" })
})

test("readBoundedJson rechaza cuerpos grandes, no-JSON y tipos de contenido ajenos", async () => {
  assert.equal(await readBoundedJson(post(JSON.stringify({ x: "a".repeat(2000) })), 1024), null)
  assert.equal(await readBoundedJson(post("no es json"), 1024), null)
  assert.equal(await readBoundedJson(post('{"type":"view"}', "text/plain"), 1024), null)
})

test("readBoundedJson corta la lectura de un cuerpo en streaming sin Content-Length", async () => {
  let pulled = 0
  const stream = new ReadableStream({
    pull(controller) {
      pulled++
      if (pulled > 50) return controller.close()
      controller.enqueue(new TextEncoder().encode("a".repeat(512)))
    },
  })
  const req = new Request("https://qhpa.test/x", {
    method: "POST",
    body: stream,
    headers: { "content-type": "application/json" },
    // @ts-expect-error duplex es obligatorio en Node para cuerpos en stream
    duplex: "half",
  })
  assert.equal(await readBoundedJson(req, 1024), null)
  assert.ok(pulled < 10, `leyó ${pulled} trozos: debió abortar al pasar 1 KB`)
})

test("readBoundedJson cuenta bytes, no caracteres", async () => {
  const body = JSON.stringify({ x: "ñ".repeat(600) }) // ~1.2 KB en bytes, ~620 caracteres
  assert.equal(await readBoundedJson(post(body), 1024), null)
})

test("tope global: avisa UNA vez por ventana al activarse", () => {
  let now = 1_000_000
  let trips = 0
  const allowed = createGlobalLimiter(2, () => now, () => trips++)
  for (let i = 0; i < 5; i++) allowed()
  assert.equal(trips, 1)
  now += 61_000
  for (let i = 0; i < 3; i++) allowed()
  assert.equal(trips, 2, "otra ventana, otro aviso")
})
