import { test } from "node:test"
import assert from "node:assert/strict"
import { ReadCounter } from "./readCounter"

test("suma documentos por colección y operación; consulta vacía cuenta 1; vacía la ventana al emitir", () => {
  const out: Record<string, unknown>[] = []
  const c = new ReadCounter(60_000, (l) => out.push(l as Record<string, unknown>))
  const t0 = Date.now()
  c.record("events", "query", 20, t0)
  c.record("events", "query", 0, t0)
  c.record("sites", "doc", 1, t0)
  c.flush(t0 + 1000)
  assert.equal(out.length, 1)
  assert.equal(out[0].total, 22)
  assert.deepEqual(out[0].items, { "events.query": { calls: 2, docs: 21 }, "sites.doc": { calls: 1, docs: 1 } })
  c.flush(t0 + 2000)
  assert.equal(out.length, 1) // sin lecturas no emite
})

test("emite solo al cumplir la ventana", () => {
  const out: object[] = []
  const c = new ReadCounter(1000, (l) => out.push(l))
  const t0 = Date.now()
  c.record("a", "doc", 1, t0 + 100)
  assert.equal(out.length, 0)
  c.record("a", "doc", 1, t0 + 5000)
  assert.equal(out.length, 1)
})
