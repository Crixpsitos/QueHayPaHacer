import { test } from "node:test"
import assert from "node:assert/strict"
import { adviseTravel, FAR_KM, googleMapsDirectionsUrl, haversineKm, isUsableCoordinates } from "./directions"

const parque = { latitude: 4.4389, longitude: -75.2322 } // centro de Ibagué (IBAGUE_CENTER)

test("Haversine: 0 km al mismo punto y distancias conocidas", () => {
  assert.equal(haversineKm(parque, parque), 0)
  // 1 grado de latitud ≈ 111.19 km
  assert.ok(Math.abs(haversineKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }) - 111.19) < 0.1)
  // Ibagué – Bogotá ≈ 132 km en línea recta
  const d = haversineKm(parque, { latitude: 4.711, longitude: -74.0721 })
  assert.ok(d > 125 && d < 140, String(d))
})

test("coordenadas: descarta (0,0), fuera de rango y no numéricas", () => {
  assert.equal(isUsableCoordinates(parque), true)
  assert.equal(isUsableCoordinates({ latitude: 0, longitude: 0 }), false)
  assert.equal(isUsableCoordinates({ latitude: 91, longitude: 0 }), false)
  assert.equal(isUsableCoordinates({ latitude: NaN, longitude: 1 }), false)
  assert.equal(isUsableCoordinates(null), false)
})

test("cerca: caminar primero; medio: motor primero con bici; lejos: solo motor", () => {
  assert.deepEqual(adviseTravel(0.5).options.map((o) => o.mode), ["walk", "motor"])
  assert.deepEqual(adviseTravel(2).options.map((o) => o.mode), ["motor", "bike", "walk"]) // 2.6 km por calle
  assert.deepEqual(adviseTravel(3.5).options.map((o) => o.mode), ["motor", "bike"]) // 4.55 km
  assert.deepEqual(adviseTravel(10).options.map((o) => o.mode), ["motor"])
})

test("tiempos aproximados, redondeados a 5 y nunca menos de 5 min", () => {
  const near = adviseTravel(0.1) // 0.13 km por calle
  assert.ok(near.options.every((o) => o.minutes === 5))
  const a = adviseTravel(2) // 2.6 km: a pie 31 min → 30; motor 7 min → 5
  assert.equal(a.options.find((o) => o.mode === "walk")?.minutes, 30)
  assert.equal(a.options.find((o) => o.mode === "motor")?.minutes, 5)
  assert.ok(a.routeKm > a.straightKm)
})

test("muy lejos: no estima tiempos", () => {
  const far = adviseTravel(FAR_KM + 1)
  assert.equal(far.far, true)
  assert.deepEqual(far.options, [])
  assert.equal(adviseTravel(FAR_KM).far, false)
})

test("enlace de Google Maps no fuerza el modo de transporte", () => {
  const url = googleMapsDirectionsUrl(parque)
  assert.equal(url, "https://www.google.com/maps/dir/?api=1&destination=4.4389,-75.2322")
  assert.ok(!url.includes("travelmode"))
})
