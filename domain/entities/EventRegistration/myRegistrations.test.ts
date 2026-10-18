import assert from "node:assert/strict";
import test from "node:test";

import {
  cancelBlock,
  canShowCheckInQr,
  registrationCounts,
  splitRegistrations,
  statusLabel,
  type UserRegistrationItem,
} from "./myRegistrations";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const h = (n: number) => new Date(NOW + n * 3_600_000).toISOString();
const item = (id: string, startH: number, endH: number, extra: Partial<UserRegistrationItem> = {}): UserRegistrationItem => ({
  eventId: id, title: id, eventRef: id, startDate: h(startH), endDate: h(endH),
  status: "registered", checkedIn: false, requiresAttendance: false, registeredAt: h(-100), ...extra,
});

test("split: próximas por cercanía, pasadas por recencia, canceladas a pasadas", () => {
  const { upcoming, past } = splitRegistrations(
    [
      item("far", 48, 50), item("near", 2, 4), item("live", -1, 1),
      item("old", -48, -46), item("older", -96, -94), item("canceled-future", 5, 6, { status: "canceled" }),
    ],
    NOW,
  );
  assert.deepEqual(upcoming.map((r) => r.eventId), ["live", "near", "far"]);
  assert.deepEqual(past.map((r) => r.eventId), ["canceled-future", "old", "older"]);
});

test("cancelBlock: reglas de elegibilidad", () => {
  assert.equal(cancelBlock({ status: "registered", endDate: h(1) }, NOW), null);
  assert.equal(cancelBlock({ status: "waitlist", endDate: h(1) }, NOW), null);
  assert.equal(cancelBlock({ status: "canceled", endDate: h(1) }, NOW), "canceled");
  assert.equal(cancelBlock({ status: "registered", endDate: h(-1) }, NOW), "finished");
  assert.equal(cancelBlock({ status: "registered", checkedIn: true, endDate: h(1) }, NOW), "attended");
});

test("statusLabel", () => {
  assert.equal(statusLabel({ status: "registered" }), "Inscrito");
  assert.equal(statusLabel({ status: "accepted" }), "Asistencia confirmada");
  assert.equal(statusLabel({ status: "registered", checkedIn: true }), "Asistencia confirmada");
  assert.equal(statusLabel({ status: "canceled", checkedIn: true }), "Cancelada");
  assert.equal(statusLabel({ status: "waitlist" }), "En lista de espera");
});

test("counts: próximas vigentes y asistidas", () => {
  const c = registrationCounts(
    [item("a", 2, 4), item("b", -48, -46, { status: "accepted" }), item("c", -48, -46), item("d", 2, 3, { status: "canceled" })],
    NOW,
  );
  assert.deepEqual(c, { upcoming: 1, attended: 1 });
});

test("canShowCheckInQr: solo vigente, no cancelada y con control de asistencia", () => {
  const on = { requiresAttendance: true };
  assert.equal(canShowCheckInQr(item("a", 1, 3, on), NOW), true);
  assert.equal(canShowCheckInQr(item("a", 1, 3), NOW), false);
  assert.equal(canShowCheckInQr(item("a", 1, 3, { ...on, status: "canceled" }), NOW), false);
  assert.equal(canShowCheckInQr(item("a", -5, -1, on), NOW), false);
});
