import { test } from "node:test"
import assert from "node:assert/strict"
import { activeSanctions, canFlag, FLAG_NOTE_MAX, FLAG_NOTE_MIN, isRestricted, nextSanction, resolveFlag, shouldHidePreventively, type Sanction } from "./reviewModeration"

const NOW = new Date("2026-11-12T15:00:00Z")
const day = 86_400_000
const ok = { uid: "owner", isHost: true, openByAccount: 0, openOnActivity: 0, alreadyFlaggedThis: false, reviewStatus: "published" as const, sanctions: [] as Sanction[] }
const sanction = (o: Partial<Sanction> = {}): Sanction => ({ uid: "owner", role: "host", kind: "warning", reason: "r", activityId: "a", createdAt: new Date(NOW.getTime() - 10 * day), expiresAt: new Date(NOW.getTime() + 300 * day), createdBy: "qhpa", ...o })

test("quien organiza puede cuestionar con motivo cerrado y nota de 20 a 300", () => {
  assert.equal(canFlag(ok, { reason: "false_info", note: "x".repeat(FLAG_NOTE_MIN) }, NOW), null)
  assert.notEqual(canFlag(ok, { reason: "inventado" as never, note: "x".repeat(30) }, NOW), null)
  assert.notEqual(canFlag(ok, { reason: "spam", note: "x".repeat(FLAG_NOTE_MIN - 1) }, NOW), null)
  assert.notEqual(canFlag(ok, { reason: "spam", note: "x".repeat(FLAG_NOTE_MAX + 1) }, NOW), null)
})

test("un tercero (no organiza) no cuestiona: usa «Reportar»", () => assert.match(canFlag({ ...ok, isHost: false }, { reason: "spam", note: "x".repeat(30) }, NOW) ?? "", /Reportar/))

test("topes: 5 abiertos por cuenta, 3 por actividad, una vez por reseña, solo si está publicada", () => {
  const r = { reason: "spam" as const, note: "x".repeat(30) }
  assert.notEqual(canFlag({ ...ok, openByAccount: 5 }, r, NOW), null)
  assert.equal(canFlag({ ...ok, openByAccount: 4 }, r, NOW), null)
  assert.notEqual(canFlag({ ...ok, openOnActivity: 3 }, r, NOW), null)
  assert.notEqual(canFlag({ ...ok, alreadyFlaggedThis: true }, r, NOW), null)
  assert.notEqual(canFlag({ ...ok, reviewStatus: "flagged" }, r, NOW), null)
  assert.notEqual(canFlag({ ...ok, reviewStatus: "removed" }, r, NOW), null)
})

test("un anfitrión con restricción vigente pierde el botón; vencida, lo recupera", () => {
  const r = { reason: "spam" as const, note: "x".repeat(30) }
  const restr = sanction({ kind: "restriction", expiresAt: new Date(NOW.getTime() + 30 * day) })
  assert.notEqual(canFlag({ ...ok, sanctions: [restr] }, r, NOW), null)
  assert.equal(canFlag({ ...ok, sanctions: [{ ...restr, expiresAt: new Date(NOW.getTime() - 1) }] }, r, NOW), null)
})

test("escalera: reseñador 1.ª advertencia, 2.ª restricción 30 días, 3.ª suspensión manual", () => {
  assert.deepEqual(nextSanction("reviewer", 0, NOW), { kind: "warning", days: 365, manual: false })
  assert.deepEqual(nextSanction("reviewer", 1, NOW), { kind: "restriction", days: 30, manual: false })
  assert.deepEqual(nextSanction("reviewer", 2, NOW), { kind: "suspension", days: 365, manual: true })
})
test("escalera del anfitrión: advertencia, pierde el botón 90 días, actividad suspendida manual", () => {
  assert.deepEqual(nextSanction("host", 0, NOW), { kind: "warning", days: 365, manual: false })
  assert.deepEqual(nextSanction("host", 1, NOW), { kind: "restriction", days: 90, manual: false })
  assert.deepEqual(nextSanction("host", 5, NOW), { kind: "suspension", days: 365, manual: true })
})

test("resolver «real» (upheld): se conserva y verifica; sin sanción salvo abuso claro del anfitrión", () => {
  const e = resolveFlag("upheld", { abusive: false, priorHost: 0, priorReviewer: 0 }, NOW)
  assert.deepEqual([e.reviewStatus, e.verified, e.removeFromRating, e.sanction], ["published", true, false, null])
  const abuse = resolveFlag("upheld", { abusive: true, priorHost: 1, priorReviewer: 0 }, NOW)
  assert.deepEqual([abuse.sanction?.role, abuse.sanction?.kind], ["host", "restriction"])
})
test("resolver «falsa» (removed): se quita, sale del promedio y sanciona a quien reseñó", () => {
  const e = resolveFlag("removed", { abusive: false, priorHost: 0, priorReviewer: 1 }, NOW)
  assert.deepEqual([e.reviewStatus, e.verified, e.removeFromRating, e.sanction?.role, e.sanction?.kind], ["removed", false, true, "reviewer", "restriction"])
  assert.deepEqual(e.notify.sort(), ["host", "reviewer"])
})

test("sanciones vigentes se cuentan; vencidas no; la restricción se detecta por rol", () => {
  const list = [sanction(), sanction({ expiresAt: new Date(NOW.getTime() - 1) }), sanction({ role: "reviewer", kind: "restriction" })]
  assert.equal(activeSanctions(list, "owner", NOW), 2)
  assert.equal(isRestricted(list, "owner", "reviewer", NOW), true)
  assert.equal(isRestricted(list, "owner", "host", NOW), false)
})

test("3 reportes distintos en 24 horas ocultan preventivamente", () => {
  const at = (h: number) => new Date(NOW.getTime() - h * 3_600_000)
  assert.equal(shouldHidePreventively([{ by: "a", at: at(1) }, { by: "b", at: at(5) }, { by: "c", at: at(23) }], NOW), true)
  assert.equal(shouldHidePreventively([{ by: "a", at: at(1) }, { by: "a", at: at(2) }, { by: "b", at: at(3) }], NOW), false)
  assert.equal(shouldHidePreventively([{ by: "a", at: at(1) }, { by: "b", at: at(5) }, { by: "c", at: at(30) }], NOW), false)
})
