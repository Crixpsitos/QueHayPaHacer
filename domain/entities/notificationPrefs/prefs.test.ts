import { test } from "node:test"
import assert from "node:assert/strict"
import { applyPrefsInput, canSend, defaultPrefs, unsubscribeEmail } from "./prefs"

const NOW = new Date("2026-11-12T15:00:00Z")
const V = "2026-11-12"

test("por defecto: solo lo transaccional de SU inscripción; marketing y push apagados; sin consentimiento", () => {
  const p = defaultPrefs()
  assert.equal(canSend(p, "email", "transactional"), true)
  for (const k of ["forYou", "weekly"] as const) assert.equal(canSend(p, "email", k), false)
  assert.equal(canSend(p, "push", "transactional"), false)
  assert.equal(p.consent, null)
})
test("activar marketing o push exige la casilla de autorización y deja constancia (fecha y versión legal)", () => {
  const p = defaultPrefs()
  const bad = applyPrefsInput(p, { email: { forYou: true } }, { authorized: false, version: V, now: NOW })
  assert.equal(bad.ok, false)
  const ok = applyPrefsInput(p, { email: { forYou: true }, push: { enabled: true } }, { authorized: true, version: V, now: NOW })
  assert.equal(ok.ok, true)
  if (!ok.ok) return
  assert.deepEqual(ok.prefs.consent, { at: NOW, version: V })
  assert.equal(canSend(ok.prefs, "email", "forYou"), true)
  assert.equal(canSend(ok.prefs, "email", "weekly"), false)
  assert.equal(canSend(ok.prefs, "push", "transactional"), true)
})
test("apagar siempre se puede, sin casilla", () => {
  const on = applyPrefsInput(defaultPrefs(), { email: { forYou: true, weekly: true } }, { authorized: true, version: V, now: NOW })
  assert.equal(on.ok, true)
  if (!on.ok) return
  const off = applyPrefsInput(on.prefs, { email: { forYou: false, weekly: false, transactional: false } }, { authorized: false, version: V, now: NOW })
  assert.equal(off.ok, true)
  if (!off.ok) return
  assert.equal(canSend(off.prefs, "email", "forYou"), false)
  assert.equal(canSend(off.prefs, "email", "transactional"), false)
})
test("la baja con un clic apaga todo el correo, registra la fecha y no apaga el push", () => {
  const on = applyPrefsInput(defaultPrefs(), { email: { weekly: true }, push: { enabled: true } }, { authorized: true, version: V, now: NOW })
  if (!on.ok) throw new Error("setup")
  const u = unsubscribeEmail(on.prefs, NOW)
  assert.deepEqual([canSend(u, "email", "transactional"), canSend(u, "email", "weekly")], [false, false])
  assert.equal(u.unsubscribedAt?.getTime(), NOW.getTime())
  assert.equal(canSend(u, "push", "transactional"), true)
})
test("volver a activar tras una baja pide la casilla otra vez y limpia la baja", () => {
  const u = unsubscribeEmail(defaultPrefs(), NOW)
  assert.equal(applyPrefsInput(u, { email: { weekly: true } }, { authorized: false, version: V, now: NOW }).ok, false)
  const back = applyPrefsInput(u, { email: { weekly: true } }, { authorized: true, version: V, now: NOW })
  assert.equal(back.ok && back.prefs.unsubscribedAt, null)
})
