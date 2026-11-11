import { test } from "node:test"
import assert from "node:assert/strict"
import { moreToDo, ROWS_PER_LEVEL, type MoreItem } from "./moreToDo"

const P = { latitude: 4.4389, longitude: -75.2322 }
const near = (m: number) => ({ latitude: P.latitude + m / 111_000, longitude: P.longitude }) // m metros al norte
const it = (id: string, o: Partial<MoreItem> = {}): MoreItem => ({ id, siteId: null, hostId: "h", category: "otros", geo: null, ...o })

test("con sitio: Aquí mismo (mismo sitio) → Cerca (≤1 km, por distancia) → Hoy en Ibagué", () => {
  const cur = it("c", { siteId: "s1", geo: P })
  const pool = [
    it("far", { geo: near(5000) }),
    it("n700", { geo: near(700) }),
    it("here", { siteId: "s1", geo: P }),
    it("n350", { geo: near(350) }),
  ]
  const r = moreToDo(cur, pool)
  assert.deepEqual(r.map((l) => l.key), ["here", "near", "city"])
  assert.deepEqual(r[0].items.map((x) => x.id), ["here"])
  assert.deepEqual(r[1].items.map((x) => x.id), ["n350", "n700"])
  assert.deepEqual(r[2].items.map((x) => x.id), ["far"])
  assert.ok(Math.abs(r[1].items[0].meters! - 350) <= 5) // ~350 m (el grado vale 111,2 km)
})

test("sin punto fijo: Del mismo grupo → Parecidas → Hoy en Ibagué; no hay «Cerca»", () => {
  const cur = it("c", { hostId: "club", category: "aire-libre" })
  const pool = [it("g1", { hostId: "club" }), it("p1", { category: "aire-libre" }), it("o1")]
  const r = moreToDo(cur, pool)
  assert.deepEqual(r.map((l) => l.key), ["group", "similar", "city"])
  assert.deepEqual(r.map((l) => l.items.map((x) => x.id)), [["g1"], ["p1"], ["o1"]])
})

test("cada actividad sale una sola vez, nunca la actual, y cada nivel muestra máximo ROWS_PER_LEVEL con el total real", () => {
  const cur = it("c", { siteId: "s1", geo: P })
  const pool = [it("c", { siteId: "s1", geo: P }), ...Array.from({ length: 5 }, (_, i) => it(`h${i}`, { siteId: "s1", geo: P }))]
  const r = moreToDo(cur, pool)
  assert.equal(r[0].items.length, ROWS_PER_LEVEL)
  assert.equal(r[0].total, 5)
  const ids = r.flatMap((l) => l.items.map((x) => x.id))
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(!ids.includes("c"))
})

test("lo que sobra de un nivel baja al siguiente (no se pierde)", () => {
  const cur = it("c", { siteId: "s1", geo: P })
  const pool = Array.from({ length: 4 }, (_, i) => it(`h${i}`, { siteId: "s1", geo: P }))
  const r = moreToDo(cur, pool)
  assert.deepEqual(r.map((l) => l.key), ["here", "near"])
  assert.deepEqual(r[1].items.map((x) => x.id), ["h3"])
})

test("niveles vacíos no aparecen; sin nada, lista vacía", () => {
  assert.deepEqual(moreToDo(it("c"), []), [])
  const r = moreToDo(it("c", { siteId: "s1", geo: P }), [it("x", { siteId: "s1", geo: P })])
  assert.deepEqual(r.map((l) => l.key), ["here"])
})

test("pool sin coordenadas: no entra en «Cerca» pero sí en la ciudad", () => {
  const r = moreToDo(it("c", { siteId: "s1", geo: P }), [it("nogeo")])
  assert.deepEqual(r.map((l) => l.key), ["city"])
})
