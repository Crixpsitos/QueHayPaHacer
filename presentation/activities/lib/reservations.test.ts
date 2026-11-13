import { test } from "node:test"
import assert from "node:assert/strict"
import type { JoinRow } from "@/domain/repository/activities/IActivityJoinRepository"
import { departureSummaries, funnelFor, rowsFor, whatsappHref, MIN_RESERVATIONS_FOR_PERCENT } from "./reservations"

const row = (uid: string, key: string, status: JoinRow["status"], phone: string | null = null): JoinRow => ({ uid, name: uid, key, status, phone, createdAt: new Date("2026-11-10T12:00:00Z"), extras: [], manual: false })
const rows = [row("a", "2026-11-15", "pending", "3001234567"), row("b", "2026-11-15", "confirmed"), row("c", "2026-11-15", "noShow"), row("d", "2026-11-22", "confirmed")]

test("resumen por salida: ocupan cupo pendientes y confirmadas, 'No pagó' no", () => {
  assert.deepEqual(departureSummaries(rows, 20), [
    { key: "2026-11-15", taken: 2, capacity: 20 },
    { key: "2026-11-22", taken: 1, capacity: 20 },
  ])
})
test("embudo de una salida", () => {
  const f = funnelFor(rows, "2026-11-15", { views: 148, visits: 3 })
  assert.deepEqual([f.views, f.reserved, f.pending, f.confirmed, f.visits, f.showPercent], [148, 2, 1, 1, 3, false])
})
test("el porcentaje solo aparece desde 10 reservas", () => {
  const many = Array.from({ length: MIN_RESERVATIONS_FOR_PERCENT }, (_, i) => row(`u${i}`, "k", "pending"))
  const f = funnelFor(many, "k", { views: 100, visits: 0 })
  assert.equal(f.showPercent, true)
  assert.equal(f.reservePercent, 10)
})
test("filtrar la lista por salida y estado", () => {
  assert.equal(rowsFor(rows, "2026-11-15", "all").length, 3)
  assert.deepEqual(rowsFor(rows, "2026-11-15", "pending").map((r) => r.uid), ["a"])
  assert.deepEqual(rowsFor(rows, "2026-11-15", "noShow").map((r) => r.uid), ["c"])
})
test("enlace de WhatsApp: solo con teléfono de 10 dígitos", () => {
  assert.equal(whatsappHref("3001234567", "Senderismo", "domingo 15"), "https://wa.me/573001234567?text=" + encodeURIComponent("Hola, te escribo por tu reserva en Senderismo (domingo 15)."))
  assert.equal(whatsappHref(null, "x", "y"), null)
  assert.equal(whatsappHref("123", "x", "y"), null)
})
