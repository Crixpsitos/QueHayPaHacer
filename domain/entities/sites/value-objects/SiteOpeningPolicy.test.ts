import { test } from "node:test"
import assert from "node:assert/strict"
import { normalizeOpeningPolicy, RAIN_NOTE_MAX } from "./SiteOpeningPolicy"

test("sin dato o basura queda vacío (sin confirmar)", () => {
  assert.deepEqual(normalizeOpeningPolicy(undefined), {})
  assert.deepEqual(normalizeOpeningPolicy("x"), {})
  assert.deepEqual(normalizeOpeningPolicy({ holidays: { policy: "siempre" }, rain: { policy: "nieva" } }), {})
})

test("festivos: 'custom' exige horas válidas y las demás políticas las descartan", () => {
  assert.deepEqual(normalizeOpeningPolicy({ holidays: { policy: "custom", open: "09:00", close: "14:00" } }),
    { holidays: { policy: "custom", open: "09:00", close: "14:00" } })
  assert.deepEqual(normalizeOpeningPolicy({ holidays: { policy: "custom", open: "9", close: "" } }), {})
  assert.deepEqual(normalizeOpeningPolicy({ holidays: { policy: "closed", open: "09:00", close: "14:00" } }),
    { holidays: { policy: "closed" } })
})

test("lluvia: recorta y limpia la nota", () => {
  assert.deepEqual(normalizeOpeningPolicy({ rain: { policy: "partial", note: "  Cierran las canchas  " } }),
    { rain: { policy: "partial", note: "Cierran las canchas" } })
  assert.deepEqual(normalizeOpeningPolicy({ rain: { policy: "open", note: "   " } }), { rain: { policy: "open" } })
  const long = normalizeOpeningPolicy({ rain: { policy: "closed", note: "x".repeat(500) } })
  assert.equal(long.rain?.note?.length, RAIN_NOTE_MAX)
})
