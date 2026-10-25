import { test } from "node:test"
import assert from "node:assert/strict"
import { recomputeExpiredSites, selectExpired, type ExpiredRow, type RecomputeDeps } from "./recomputeExpired"

const NOW = Date.parse("2026-10-24T12:00:00Z")
const H = 3_600_000

test("selectExpired: solo vencidos, el más atrasado primero, sin los ya intentados ni valores raros", () => {
  const rows: ExpiredRow[] = [
    { id: "nuevo", validUntil: NOW - H },
    { id: "viejo", validUntil: NOW - 5 * H },
    { id: "futuro", validUntil: NOW + H },
    { id: "justo", validUntil: NOW },
    { id: "intentado", validUntil: NOW - 9 * H },
    { id: "raro", validUntil: Number.NaN },
  ]
  assert.deepEqual(selectExpired(rows, NOW, new Set(["intentado"])).map((r) => r.id), ["viejo", "nuevo", "justo"])
  assert.deepEqual(selectExpired([], NOW, new Set()), [])
})

// Mundo falso: cada sitio tiene un vencimiento; recalcular lo mueve al futuro (o a null = sale del conjunto).
function world(initial: Record<string, number>, opts: { boom?: string[]; visible?: string[]; step?: () => void } = {}) {
  const until = new Map(Object.entries(initial))
  let now = NOW
  const calls: string[] = []
  const deps: RecomputeDeps = {
    now: () => now,
    listExpired: async (n, limit) =>
      [...until].filter(([, v]) => v <= n.getTime()).map(([id, validUntil]) => ({ id, validUntil })).sort((a, b) => a.validUntil - b.validUntil).slice(0, limit),
    countExpired: async (n) => [...until].filter(([, v]) => v <= n.getTime()).length,
    recompute: async (id) => {
      calls.push(id)
      opts.step?.()
      if (opts.boom?.includes(id)) throw new Error("falla")
      until.set(id, NOW + 3 * 86_400_000)
      return { authorId: `autor-${id}`, visible: opts.visible ? opts.visible.includes(id) : true }
    },
  }
  return { deps, calls, advance: (ms: number) => { now += ms }, until }
}

test("procesa los vencidos de más atrasado a menos, y la respuesta tiene la forma acordada", async () => {
  const w = world({ a: NOW - 2 * H, b: NOW - 9 * H, c: NOW + 5 * H })
  const r = await recomputeExpiredSites(w.deps)
  assert.deepEqual(w.calls, ["b", "a"], "el más atrasado primero; el vigente (c) no se toca")
  assert.deepEqual(Object.keys(r).sort(), ["changed", "failed", "invalidate", "oldestOverdueMs", "processed", "remaining"])
  assert.deepEqual({ processed: r.processed, changed: r.changed, failed: r.failed, remaining: r.remaining, oldestOverdueMs: r.oldestOverdueMs }, { processed: 2, changed: 2, failed: 0, remaining: 0, oldestOverdueMs: 0 })
  assert.equal(w.until.get("c"), NOW + 5 * H, "un sitio con vencimiento futuro no se toca")
})

test("idempotente: la segunda ejecución seguida no procesa nada", async () => {
  const w = world({ a: NOW - H, b: NOW - 2 * H })
  assert.equal((await recomputeExpiredSites(w.deps)).processed, 2)
  const second = await recomputeExpiredSites(w.deps)
  assert.equal(second.processed, 0)
  assert.equal(second.changed, 0)
  assert.equal(second.remaining, 0)
  assert.deepEqual(w.calls, ["b", "a"], "no se recalculó nada más")
})

test("un fallo no frena a los demás, se cuenta, no se reintenta en bucle y queda como pendiente", async () => {
  const errors: string[] = []
  const w = world({ a: NOW - 3 * H, b: NOW - 2 * H, c: NOW - H }, { boom: ["a"] })
  const r = await recomputeExpiredSites(w.deps, { onError: (id) => errors.push(id) })
  assert.deepEqual(w.calls, ["a", "b", "c"], "a falló una sola vez")
  assert.deepEqual(errors, ["a"])
  assert.equal(r.failed, 1)
  assert.equal(r.changed, 2)
  assert.equal(r.remaining, 1, "el que falló sigue vencido")
  assert.equal(r.oldestOverdueMs, 3 * H, "y se reporta cuánto lleva atrasado")
})

test("repite vueltas de a lotes hasta que no quedan vencidos", async () => {
  const initial = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`s${i}`, NOW - (10 - i) * H]))
  const w = world(initial)
  const r = await recomputeExpiredSites(w.deps, { batch: 3 })
  assert.equal(r.processed, 7)
  assert.equal(r.remaining, 0)
  assert.deepEqual(w.calls, ["s0", "s1", "s2", "s3", "s4", "s5", "s6"])
})

test("respeta el presupuesto de tiempo y reporta lo que queda", async () => {
  let w!: ReturnType<typeof world>
  w = world({ a: NOW - 3 * H, b: NOW - 2 * H, c: NOW - H }, { step: () => w.advance(20_000) })
  const r = await recomputeExpiredSites(w.deps, { budgetMs: 30_000 })
  assert.equal(r.processed, 2, "cada sitio cuesta 20 s: con 30 s de presupuesto caben 2")
  assert.equal(r.remaining, 1)
  assert.ok(r.oldestOverdueMs > 0)
})

test("solo invalida cachés de lo que cambió de forma visible", async () => {
  const w = world({ a: NOW - 3 * H, b: NOW - 2 * H }, { visible: ["b"] })
  const r = await recomputeExpiredSites(w.deps)
  assert.equal(r.changed, 2)
  assert.deepEqual(r.invalidate, [{ siteId: "b", authorId: "autor-b" }])
})

test("sin vencidos: respuesta vacía y no llama a recompute", async () => {
  const w = world({ a: NOW + H })
  const r = await recomputeExpiredSites(w.deps)
  assert.deepEqual({ processed: r.processed, changed: r.changed, failed: r.failed, remaining: r.remaining }, { processed: 0, changed: 0, failed: 0, remaining: 0 })
  assert.deepEqual(w.calls, [])
})
