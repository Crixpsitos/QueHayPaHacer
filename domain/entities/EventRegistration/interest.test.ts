import { test } from "node:test"
import assert from "node:assert/strict"
import { INTEREST_TTL_MS, interestOutcome, occupancy, seatKind, seatsLeft, toPromote, waitlistPosition, type SeatRow } from "./interest"

const NOW = Date.parse("2026-11-12T20:00:00Z")
const ago = (h: number) => new Date(NOW - h * 3_600_000)
const row = (id: string, o: Partial<SeatRow> & { hoursAgo?: number } = {}): SeatRow & { id: string } => ({ id, status: "pending", registeredAt: ago(o.hoursAgo ?? 1), ...o })

test("tipo de cupo: confirmado, interesado, vencido, en espera y cancelado", () => {
  assert.equal(seatKind(row("a", { status: "accepted", hoursAgo: 99 }), NOW), "confirmed")
  assert.equal(seatKind(row("b", { hoursAgo: 3 }), NOW), "interested")
  assert.equal(seatKind(row("c", { hoursAgo: 25 }), NOW), "expired")
  assert.equal(seatKind(row("d", { waitlist: true, hoursAgo: 99 }), NOW), "waitlist")
  assert.equal(seatKind(row("e", { status: "canceled" }), NOW), "canceled")
})
test("quien entró, pagó o es invitado de quien organiza nunca vence", () => {
  assert.equal(seatKind(row("a", { hoursAgo: 99, checkedInAt: ago(2) }), NOW), "confirmed")
  assert.equal(seatKind(row("b", { hoursAgo: 99, paidAmount: 30000 }), NOW), "confirmed")
  assert.equal(seatKind(row("c", { hoursAgo: 99, guest: true }), NOW), "confirmed")
})
test("el límite es exactamente 24 h: a las 24 h todavía cuenta, después no", () => {
  assert.equal(seatKind(row("a", { hoursAgo: 24 }), NOW), "interested")
  assert.equal(seatKind({ ...row("b"), registeredAt: new Date(NOW - INTEREST_TTL_MS - 1) }, NOW), "expired")
})
test("ocupación: los vencidos y la lista de espera no ocupan cupo", () => {
  const rows = [row("a", { status: "accepted" }), row("b"), row("c", { hoursAgo: 30 }), row("d", { waitlist: true }), row("e", { status: "canceled" })]
  assert.deepEqual(occupancy(rows, NOW), { confirmed: 1, interested: 1, expired: 1, waitlist: 1, taken: 2 })
})
test("cupos libres: sin capacidad = sin límite; nunca negativo", () => {
  assert.equal(seatsLeft(undefined, [row("a")], NOW), null)
  assert.equal(seatsLeft(0, [row("a")], NOW), null)
  assert.equal(seatsLeft(3, [row("a"), row("b")], NOW), 1)
  assert.equal(seatsLeft(1, [row("a"), row("b")], NOW), 0)
})
test("un interesado vencido libera su hueco para otra persona", () => {
  const lleno = [row("a", { status: "accepted" }), row("b", { hoursAgo: 23 })]
  assert.equal(interestOutcome(2, lleno, NOW), "waitlist")
  const conVencido = [row("a", { status: "accepted" }), row("b", { hoursAgo: 26 })]
  assert.equal(interestOutcome(2, conVencido, NOW), "interested")
})
test("hay lista de espera: quien llega se forma detrás aunque haya un hueco (se promueve en orden)", () => {
  const rows = [row("a", { status: "accepted" }), row("w1", { waitlist: true, hoursAgo: 5 })]
  assert.equal(interestOutcome(3, rows, NOW), "waitlist")
  assert.equal(interestOutcome(undefined, rows, NOW), "interested")
})
test("promoción: los más antiguos de la lista de espera ocupan los huecos libres", () => {
  const rows = [row("a", { status: "accepted" }), row("w2", { waitlist: true, hoursAgo: 2 }), row("w1", { waitlist: true, hoursAgo: 9 }), row("w3", { waitlist: true, hoursAgo: 1 })]
  assert.deepEqual(toPromote(3, rows, NOW), ["w1", "w2"])
  assert.deepEqual(toPromote(1, rows, NOW), [])
  assert.deepEqual(toPromote(undefined, rows, NOW), ["w1", "w2", "w3"])
})
test("posición en la lista de espera (1 = el primero)", () => {
  const rows = [row("w2", { waitlist: true, hoursAgo: 2 }), row("w1", { waitlist: true, hoursAgo: 9 }), row("a")]
  assert.equal(waitlistPosition(rows, "w1"), 1)
  assert.equal(waitlistPosition(rows, "w2"), 2)
  assert.equal(waitlistPosition(rows, "a"), null)
})
