import { test } from "node:test"
import assert from "node:assert/strict"
import { countSiteEvents, isEventCountExpired, SITE_EVENT_TAIL_DAYS, siteEventState } from "./siteEventCount"

const NOW = new Date("2026-10-24T12:00:00Z")
const DAY = 86_400_000
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * DAY)
const ev = (status: string, endDays: number | null, startDays?: number) => ({
  status,
  endDate: endDays === null ? null : daysFromNow(endDays),
  startDate: startDays === undefined ? undefined : daysFromNow(startDays),
})

test("cuenta próximos, en curso y los que terminaron hace pocos días", () => {
  assert.equal(countSiteEvents([ev("published", 10), ev("published", 0), ev("published", -3)], NOW), 3)
})

test("la cola es de 7 días y el borde NO cuenta (fin + 7 días ya no es futuro)", () => {
  assert.equal(SITE_EVENT_TAIL_DAYS, 7)
  assert.equal(countSiteEvents([ev("published", -6.99)], NOW), 1, "casi 7 días: aún cuenta")
  assert.equal(countSiteEvents([ev("published", -7)], NOW), 0, "justo 7 días: ya vencido")
  assert.equal(countSiteEvents([ev("published", -30)], NOW), 0)
})

test("solo cuentan los publicados", () => {
  const statuses = ["draft", "pending", "rejected", "cancelled", "ended", undefined as unknown as string]
  assert.equal(countSiteEvents(statuses.map((s) => ev(s, 5)), NOW), 0)
  assert.equal(countSiteEvents([...statuses.map((s) => ev(s, 5)), ev("published", 5)], NOW), 1)
})

test("sin endDate usa startDate; sin ninguna fecha válida se cuenta", () => {
  assert.equal(countSiteEvents([ev("published", null, -20)], NOW), 0)
  assert.equal(countSiteEvents([ev("published", null, -3)], NOW), 1)
  assert.equal(countSiteEvents([ev("published", null)], NOW), 1)
  assert.equal(countSiteEvents([{ status: "published", endDate: "fecha rota" }], NOW), 1)
})

test("acepta fechas ISO (string) y lista vacía", () => {
  assert.equal(countSiteEvents([{ status: "published", endDate: "2026-11-01T00:00:00Z" }], NOW), 1)
  assert.equal(countSiteEvents([], NOW), 0)
})

test("validUntil = el primer fin + 7 días entre los eventos contados", () => {
  const s = siteEventState([ev("published", 10), ev("published", -2), ev("published", 3)], NOW)
  assert.equal(s.count, 3)
  assert.equal(s.validUntil?.getTime(), daysFromNow(-2 + 7).getTime(), "vence cuando salga el que terminó hace 2 días")
})

test("los eventos fuera de la ventana o no publicados no aportan vencimiento", () => {
  const s = siteEventState([ev("published", 20), ev("published", -30), ev("draft", -1)], NOW)
  assert.equal(s.count, 1)
  assert.equal(s.validUntil?.getTime(), daysFromNow(27).getTime())
})

test("sin eventos contados, o solo sin fecha, no vence solo (null)", () => {
  assert.equal(siteEventState([], NOW).validUntil, null)
  assert.equal(siteEventState([ev("published", -30)], NOW).validUntil, null)
  assert.deepEqual(siteEventState([ev("published", null)], NOW), { count: 1, validUntil: null })
})

test("isEventCountExpired: vence en el instante guardado; null/ausente/inválido nunca", () => {
  assert.equal(isEventCountExpired(daysFromNow(-1), NOW), true)
  assert.equal(isEventCountExpired(NOW, NOW), true, "justo en el instante ya vence")
  assert.equal(isEventCountExpired(daysFromNow(1), NOW), false)
  assert.equal(isEventCountExpired(daysFromNow(-1).toISOString(), NOW), true)
  for (const v of [null, undefined, "no es fecha"]) assert.equal(isEventCountExpired(v, NOW), false)
})

test("coherencia: tras validUntil el recuento ya da menos", () => {
  const events = [ev("published", 2), ev("published", -5)]
  const s = siteEventState(events, NOW)
  assert.equal(s.count, 2)
  assert.equal(countSiteEvents(events, s.validUntil!), 1, "en el instante de vencimiento el evento de hace 5 días ya salió")
})
