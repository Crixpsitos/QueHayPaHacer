import { test } from "node:test"
import assert from "node:assert/strict"
import { hasSeenEvent, markEventSeen } from "./viewSeen"

const memory = () => {
  const d = new Map<string, string>()
  return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v) }
}

test("sin marca no se ha visto; tras marcar sí", () => {
  const s = memory()
  assert.equal(hasSeenEvent("u1", "e1", s), false)
  markEventSeen("u1", "e1", s)
  assert.equal(hasSeenEvent("u1", "e1", s), true)
})

test("la marca es por persona y por evento", () => {
  const s = memory()
  markEventSeen("u1", "e1", s)
  assert.equal(hasSeenEvent("u2", "e1", s), false)
  assert.equal(hasSeenEvent("u1", "e2", s), false)
})

test("almacenamiento bloqueado: nunca lanza y se trata como no visto (el servidor decide)", () => {
  const broken = { getItem: () => { throw new Error("x") }, setItem: () => { throw new Error("x") } }
  assert.equal(hasSeenEvent("u1", "e1", broken), false)
  assert.doesNotThrow(() => markEventSeen("u1", "e1", broken))
})
