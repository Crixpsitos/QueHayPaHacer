import { test } from "node:test"
import assert from "node:assert/strict"
import { parseMapsCoords, isGoogleMapsHost } from "./mapsLink"

test("saca las coordenadas de los formatos de Google Maps", () => {
  assert.deepEqual(parseMapsCoords("https://www.google.com/maps/place/Multicentro/@4.4363154,-75.201573,17z/data=x"), { lat: 4.4363154, lng: -75.201573 })
  assert.deepEqual(parseMapsCoords("https://www.google.com/maps/place/X/@4.5,-75.1,17z/data=!3d4.4403!4d-75.2044"), { lat: 4.4403, lng: -75.2044 }) // gana el punto del lugar
  assert.deepEqual(parseMapsCoords("https://maps.google.com/?q=4.44,-75.20"), { lat: 4.44, lng: -75.2 })
  assert.deepEqual(parseMapsCoords("https://www.google.com/maps?q=4.44%2C-75.20"), { lat: 4.44, lng: -75.2 })
  assert.deepEqual(parseMapsCoords(" 4.4389, -75.2322 "), { lat: 4.4389, lng: -75.2322 })
})
test("rechaza lo que no es una ubicación de Colombia", () => {
  assert.equal(parseMapsCoords("https://example.com/@40.7,-74.0,10z"), null)
  assert.equal(parseMapsCoords("hola"), null)
  assert.equal(parseMapsCoords("1.5, 2.5"), null)
})
test("solo hosts de Google", () => {
  for (const h of ["maps.app.goo.gl", "www.google.com", "google.com.co", "maps.google.com"]) assert.ok(isGoogleMapsHost(h), h)
  for (const h of ["evil.com", "google.com.evil.com", "goo.gl.evil.com", "localhost", "169.254.169.254"]) assert.ok(!isGoogleMapsHost(h), h)
})
