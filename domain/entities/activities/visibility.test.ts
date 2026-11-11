import { test } from "node:test"
import assert from "node:assert/strict"
import { isPubliclyVisible } from "./visibility"
import { canCreateForSite, canCreateGlobal, canManageActivity, canViewActivity } from "./permissions"
import { makeActivity } from "./activity.fixture"

const okSite = { published: true, active: true }

test("global publicada, aprobada y activa es pública", () => {
  assert.equal(isPubliclyVisible(makeActivity()), true)
})

test("pendiente, rechazada, borrador o pausada no son públicas", () => {
  assert.equal(isPubliclyVisible(makeActivity({ moderationStatus: "pending" })), false)
  assert.equal(isPubliclyVisible(makeActivity({ moderationStatus: "rejected" })), false)
  assert.equal(isPubliclyVisible(makeActivity({ publicationStatus: "draft" })), false)
  assert.equal(isPubliclyVisible(makeActivity({ isActive: false })), false)
})

test("de sitio: pública solo si el sitio sigue publicado y activo", () => {
  const a = makeActivity({ kind: "site", siteId: "s1" })
  assert.equal(isPubliclyVisible(a, okSite), true)
  assert.equal(isPubliclyVisible(a, { published: false, active: true }), false)
  assert.equal(isPubliclyVisible(a, { published: true, active: false }), false)
  assert.equal(isPubliclyVisible(a, null), false)
  assert.equal(isPubliclyVisible(a), false)
})

test("D12: solo el autor del sitio (o QHPA) crea actividades de ese sitio", () => {
  const base = { uid: "u1", siteAuthorUid: "u1", siteExists: true, siteLinkable: true, isAdmin: false }
  assert.equal(canCreateForSite(base), true)
  assert.equal(canCreateForSite({ ...base, siteLinkable: false }), false) // sitio propuesto por la comunidad o sin aprobar
  assert.equal(canCreateForSite({ ...base, siteLinkable: false, isAdmin: true }), true)
  assert.equal(canCreateForSite({ ...base, siteAuthorUid: "otro" }), false)
  assert.equal(canCreateForSite({ ...base, siteAuthorUid: "otro", isAdmin: true }), true)
  assert.equal(canCreateForSite({ ...base, uid: null }), false)
  assert.equal(canCreateForSite({ ...base, siteExists: false }), false)
  assert.equal(canCreateForSite({ ...base, uid: "x", siteAuthorUid: null }), false)
})

test("crear global exige sesión", () => {
  assert.equal(canCreateGlobal({ uid: "u1" }), true)
  assert.equal(canCreateGlobal({ uid: null }), false)
})

test("administrar: dueño o admin; ver pendiente: dueño o admin, nunca un tercero", () => {
  const a = makeActivity({ moderationStatus: "pending" })
  assert.equal(canManageActivity(a, { uid: "u1", isAdmin: false }), true)
  assert.equal(canManageActivity(a, { uid: "u2", isAdmin: false }), false)
  assert.equal(canManageActivity(a, { uid: "u2", isAdmin: true }), true)
  assert.equal(canManageActivity(a, { uid: null, isAdmin: true }), false)
  assert.equal(canViewActivity(a, { uid: "u1", isAdmin: false }), true)
  assert.equal(canViewActivity(a, { uid: "u2", isAdmin: false }), false)
  assert.equal(canViewActivity(a, { uid: null, isAdmin: false }), false)
  assert.equal(canViewActivity(makeActivity(), { uid: null, isAdmin: false }), true)
})
