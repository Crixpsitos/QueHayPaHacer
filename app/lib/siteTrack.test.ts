import { test } from "node:test"
import assert from "node:assert/strict"
import { firstViewOfDay } from "./siteTrack"

const memory = () => {
  const d = new Map<string, string>()
  return { getItem: (k: string) => d.get(k) ?? null, setItem: (k: string, v: string) => void d.set(k, v) }
}

test("firstViewOfDay: una vista por sitio y día, aunque se recargue", () => {
  const s = memory()
  assert.equal(firstViewOfDay("a", "2026-11-05", s), true)
  assert.equal(firstViewOfDay("a", "2026-11-05", s), false)
  assert.equal(firstViewOfDay("b", "2026-11-05", s), true, "otro sitio cuenta aparte")
})

test("firstViewOfDay: al día siguiente vuelve a contar", () => {
  const s = memory()
  firstViewOfDay("a", "2026-11-05", s)
  assert.equal(firstViewOfDay("a", "2026-11-06", s), true)
})

test("firstViewOfDay: almacenamiento bloqueado = cuenta (el tope del servidor acota)", () => {
  const broken = { getItem: () => { throw new Error("x") }, setItem: () => { throw new Error("x") } }
  assert.equal(firstViewOfDay("a", "2026-11-05", broken), true)
})
