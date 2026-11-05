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
