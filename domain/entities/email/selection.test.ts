import { test } from "node:test"
import assert from "node:assert/strict"
import { selectForYou, FOR_YOU_MAX, type PoolItem } from "./selection"

const p = (id: string, category: string): PoolItem => ({ id, title: id, path: `/actividades/${id}`, category, when: "Hoy" })
const pool = [p("a", "aire-libre"), p("b", "cine-y-espectaculos"), p("c", "aire-libre"), p("d", "comida-y-bebida"), p("e", "deporte-y-bienestar")]

test("con señal: primero lo de las categorías que más guardas o visitas", () => {
  const r = selectForYou(pool, { categories: ["aire-libre", "aire-libre", "cine-y-espectaculos"], excludeIds: [] })
  assert.deepEqual(r.slice(0, 3).map((x) => x.id), ["a", "c", "b"])
})
test("no repite lo que ya guardaste o hiciste", () => {
  const r = selectForYou(pool, { categories: ["aire-libre"], excludeIds: ["a"] })
  assert.ok(!r.some((x) => x.id === "a"))
  assert.equal(r[0].id, "c")
})
test("sin señal: las de hoy tal cual llegan; sin nada vigente: vacío", () => {
  assert.deepEqual(selectForYou(pool, { categories: [], excludeIds: [] }).map((x) => x.id), ["a", "b", "c", "d", "e"])
  assert.deepEqual(selectForYou([], { categories: ["aire-libre"], excludeIds: [] }), [])
})
test("máximo FOR_YOU_MAX", () => assert.equal(selectForYou(Array.from({ length: 20 }, (_, i) => p(`x${i}`, "otros")), { categories: [], excludeIds: [] }).length, FOR_YOU_MAX))

import { buildPool } from "./selection"
test("buildPool: solo lo que sale en los próximos 3 días y no terminó, con su día y hora", () => {
  const now = new Date("2026-11-12T20:00:00Z") // jueves 3 p. m. Bogotá
  const weekly = (d: number, s: string, e?: string) => ({ rules: [{ kind: "weekly" as const, weekdays: [d] as never, start: s, ...(e ? { end: e } : {}) }], skipDates: [], requiresReservation: false })
  const r = buildPool([
    { id: "hoy", title: "Hoy tarde", slug: "hoy", category: "otros", schedule: weekly(4, "17:30") },
    { id: "pasada", title: "Ya salió", slug: "p", category: "otros", schedule: weekly(4, "07:00", "08:00") },
    { id: "man", title: "Mañana", slug: "m", category: "otros", schedule: weekly(5, "09:00") },
    { id: "lejos", title: "Lejos", slug: "l", category: "otros", schedule: weekly(2, "09:00") },
  ], now)
  assert.deepEqual(r.map((x) => [x.id, x.when]), [["hoy", "Hoy · 5:30 p. m."], ["man", "Mañana · 9:00 a. m."]])
})
