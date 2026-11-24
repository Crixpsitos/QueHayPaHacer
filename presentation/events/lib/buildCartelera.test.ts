import { test } from "node:test"
import assert from "node:assert/strict"
import { buildCartelera, groupCartelera, inDays, type CarteleraIn } from "./buildCartelera"

// viernes 13-nov-2026, 3 pm en Bogotá
const NOW = new Date("2026-11-13T20:00:00Z")
const at = (iso: string, h: number) => Date.parse(`${iso}T00:00:00Z`) + (h + 5) * 3_600_000
const ev = (id: string, day: string, h = 19, extra: Partial<CarteleraIn> = {}): CarteleraIn => ({ id, slug: id, title: id, startsAt: at(day, h), endsAt: at(day, h + 2), venue: "Teatro", price: "Gratis", free: true, coverUrl: null, category: "Música", multi: "", place: "Teatro, Cra 3", info: "Sin inscripción", going: 3, views: 10, tiers: "", ...extra })

test("ordena por fecha y hora, descarta los terminados y cuenta por día", () => {
  const v = buildCartelera([ev("tarde", "2026-11-13", 21), ev("pasado", "2026-11-13", 9), ev("noche", "2026-11-13", 19), ev("sab", "2026-11-14", 8)], NOW)
  assert.deepEqual(v.events.map((e) => e.id), ["noche", "tarde", "sab"])
  assert.equal(v.total, 3)
  assert.deepEqual(v.calendar.slice(0, 2).map((d) => d.count), [2, 1])
  assert.equal(v.spotlight?.badge, "Esta noche, 7:00 pm")
  assert.match(v.nextLabel, /hoy a las 7:00 pm/)
  assert.equal(v.events[0].place, "Teatro, Cra 3")
})

test("un evento de varios días ya empezado sale hoy y cuenta en cada día", () => {
  const v = buildCartelera([ev("feria", "2026-11-12", 10, { endsAt: at("2026-11-15", 20) })], NOW)
  assert.equal(v.events[0].date, "2026-11-13")
  assert.deepEqual(v.calendar.slice(0, 4).map((d) => d.count), [1, 1, 1, 0])
  assert.ok(inDays(v.events[0], v.weekend.from, v.weekend.to))
  assert.equal(v.spotlight?.badge, "En curso")
})

test("agrupa por día la primera semana, luego resto del mes y después por mes", () => {
  const v = buildCartelera([ev("a", "2026-11-13"), ev("b", "2026-11-14"), ev("c", "2026-11-19"), ev("d", "2026-11-27"), ev("e", "2026-12-01"), ev("f", "2027-01-10")], NOW)
  const g = groupCartelera(v.events, v.today)
  assert.deepEqual(g.map((x) => x.title), ["Hoy, viernes 13", "Mañana, sábado 14", "Jueves 19", "Más adelante en noviembre", "Diciembre", "Enero de 2027"])
  assert.deepEqual(g.map((x) => x.of), ["de hoy", "del sábado", "del jueves", "que quedan de noviembre", "de diciembre", "de enero"])
  assert.deepEqual(g.map((x) => [x.byDay, x.big]), [[true, false], [true, false], [true, false], [false, false], [false, true], [false, true]])
})

test("sin eventos no hay destacado ni texto del próximo", () => {
  const v = buildCartelera([], NOW)
  assert.equal(v.spotlight, null)
  assert.equal(v.nextLabel, "")
})

test("un evento de varias fechas sale una vez por función, en su día; «finde» las junta en una", async () => {
  const { collapseByEvent } = await import("./buildCartelera")
  const fn = (n: number, day: string) => ev("fest", day, 21, { key: `fest:${n}`, href: `/eventos/fest/sessions/${n}`, parentHref: "/eventos/fest", multi: `Función ${n} de 2` })
  const v = buildCartelera([fn(1, "2026-11-14"), fn(2, "2026-11-21"), ev("otro", "2026-11-14", 19)], NOW)
  assert.deepEqual(v.events.map((e) => e.key), ["otro", "fest:1", "fest:2"])
  assert.equal(v.calendar[1].count, 2) // sábado 14: «otro» y la función 1
  assert.equal(v.calendar[8].count, 1) // sábado 21: la función 2
  const one = collapseByEvent(v.events)
  assert.deepEqual(one.map((e) => [e.key, e.href, e.multi]), [["otro", "/eventos/otro", ""], ["fest", "/eventos/fest", "2 funciones"]])
})
