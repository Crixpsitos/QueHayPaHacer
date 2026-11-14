import { test } from "node:test"
import assert from "node:assert/strict"
import { buildHomeView, clock, type ActivityIn, type EventIn, type SiteIn } from "./buildHomeView"

// jueves 12-nov-2026, 3 pm en Bogotá
const NOW = new Date("2026-11-12T20:00:00Z")
const at = (iso: string, h: number) => Date.parse(`${iso}T00:00:00Z`) + (h + 5) * 3_600_000
const ev = (id: string, day: string, h = 19, extra: Partial<EventIn> = {}): EventIn => ({ id, slug: id, title: `Evento ${id}`, startsAt: at(day, h), endsAt: at(day, h + 2), venue: "Teatro Tolima", price: "Gratis", coverUrl: null, siteId: null, ...extra })
const act = (id: string, occ: ActivityIn["occ"]): ActivityIn => ({ id, slug: id, title: `Actividad ${id}`, place: "Parque", price: "Gratis", coverUrl: null, occ })
const site = (id: string, extra: Partial<SiteIn> = {}): SiteIn => ({ id, slug: id, name: `Sitio ${id}`, kind: "Café", coverUrl: null, isOpen: true, at: "21:00", ...extra })
const moment = (v: ReturnType<typeof buildHomeView>, k: string) => v.moments.find((m) => m.key === k)!

test("clock pasa 24 h a 12 h", () => {
  assert.deepEqual([clock("00:30"), clock("12:00"), clock("19:05")], [{ time: "12:30", ampm: "am" }, { time: "12:00", ampm: "pm" }, { time: "7:05", ampm: "pm" }])
})

test("con 4+ eventos hoy: evento principal + filas solo de eventos, sin nota", () => {
  const events = [ev("a", "2026-11-12", 19), ev("b", "2026-11-12", 18), ev("c", "2026-11-12", 20), ev("d", "2026-11-12", 21), ev("e", "2026-11-12", 22)]
  const hoy = moment(buildHomeView({ events, activities: [act("y", { hoy: { date: "2026-11-12", hhmm: "17:30" } })], sites: [site("s")], now: NOW }), "hoy")
  assert.equal(hoy.lead?.title, "Evento b") // el más temprano
  assert.equal(hoy.rows.length, 4)
  assert.ok(hoy.rows.every((r) => r.kind === "Evento"))
  assert.equal(hoy.count, 6)
  assert.match(hoy.summary, /5 eventos, 1 actividad y 1 sitio abierto ahora/)
})

test("con 1 evento mañana: se completa con actividades y sitios y avisa", () => {
  const m = moment(buildHomeView({ events: [ev("v", "2026-11-13")], activities: [act("run", { manana: { date: "2026-11-13", hhmm: "06:00" } })], sites: [site("s", { isOpen: false, at: "15:00" })], now: NOW }), "manana")
  assert.equal(m.lead?.kind, "Evento")
  assert.deepEqual(m.rows.map((r) => r.kind), ["Actividad", "Sitio"])
  assert.equal(m.rows[1].pre, "Abre")
})

test("con 0 eventos: una actividad toma el lugar principal y el próximo evento sigue visible", () => {
  const m = moment(buildHomeView({ events: [ev("later", "2026-11-17")], activities: [act("yoga", { hoy: { date: "2026-11-12", hhmm: "17:30" } })], sites: [], now: NOW }), "hoy")
  assert.equal(m.lead?.kind, "Actividad")
  assert.equal(m.rows[0].kind, "Evento")
  assert.equal(m.rows[0].pre, "Mar")
})

test("sin nada: no inventa líder ni filas", () => {
  const m = moment(buildHomeView({ events: [], activities: [], sites: [], now: NOW }), "finde")
  assert.equal(m.lead, null)
  assert.equal(m.rows.length, 0)
  assert.match(m.summary, /Todavía no hay planes/)
})

test("lo que viene y meses; sitios con evento de la semana van primero", () => {
  const events = [ev("hoy", "2026-11-12"), ev("v", "2026-11-13", 20, { siteId: "bar" }), ev("d", "2026-12-05")]
  const v = buildHomeView({ events, activities: [], sites: [site("cafe"), site("bar")], now: NOW })
  assert.deepEqual(v.upcoming.days.map((d) => d.day), ["13", "5"])
  assert.deepEqual(v.upcoming.months, [])
  assert.equal(v.upcoming.total, 3)
  assert.equal(v.sites[0].id, "bar")
  assert.match(v.sites[0].live ?? "", /^Vie 13 8:00 pm: Evento v$/)
})

test("escapaditas: cuenta los planes que siguen, muestra el próximo y oculta pueblos sin planes", () => {
  const plan = (title: string, day: string) => ({ title, href: `/eventos/${title}`, startsAt: at(day, 8), endsAt: at(day, 12) })
  const v = buildHomeView({
    events: [], activities: [], sites: [], now: NOW,
    escapadas: [
      { id: "j", name: "Juntas", minutesAway: 40, coverUrl: null, plans: [plan("caminata", "2026-11-15"), plan("mercado", "2026-11-14"), plan("pasado", "2026-11-01")] },
      { id: "h", name: "Honda", minutesAway: 150, coverUrl: null, plans: [plan("viejo", "2026-10-01")] },
    ],
  })
  assert.equal(v.escapadas.length, 1)
  assert.deepEqual(v.escapadas[0], { id: "j", href: "/eventos/mercado", name: "Juntas", far: "A 40 min", plans: "2 planes", next: "Sáb 14: mercado", cover: null })
})
