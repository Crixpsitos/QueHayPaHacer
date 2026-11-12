import { test } from "node:test"
import assert from "node:assert/strict"
import { InMemoryRateLimit } from "./InMemoryRateLimit"

const T = new Date("2026-11-12T15:00:00Z")
test("un golpe dentro de la ventana no pasa; fuera de la ventana sí; release lo perdona", async () => {
  const r = new InMemoryRateLimit()
  assert.equal(await r.tryHit("k", 30_000, T), true)
  assert.equal(await r.tryHit("k", 30_000, new Date(T.getTime() + 10_000)), false)
  assert.equal(await r.tryHit("k", 30_000, new Date(T.getTime() + 31_000)), true)
  await r.release("k")
  assert.equal(await r.tryHit("k", 30_000, new Date(T.getTime() + 32_000)), true)
})
test("contador diario con tope", async () => {
  const r = new InMemoryRateLimit()
  for (let i = 0; i < 3; i++) assert.equal(await r.incrementDaily("u", "2026-11-12", 3), true)
  assert.equal(await r.incrementDaily("u", "2026-11-12", 3), false)
  assert.equal(await r.incrementDaily("u", "2026-11-13", 3), true)
})
