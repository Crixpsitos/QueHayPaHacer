import { test } from "node:test"
import assert from "node:assert/strict"
import { transferPatch } from "./ownershipTransfer"
import { makeActivity } from "./activity.fixture"

const nuevo = { uid: "nuevo", displayName: "Nuevo Dueño", photoURL: "https://x.test/p.jpg" }

test("pasa la actividad al nuevo autor del sitio y actualiza el anfitrión", () => {
  const p = transferPatch(makeActivity({ kind: "site", siteId: "s1", ownerUid: "viejo" }), nuevo)
  assert.deepEqual(p, { ownerUid: "nuevo", host: { kind: "user", id: "nuevo", displayName: "Nuevo Dueño", photoURL: "https://x.test/p.jpg" }, previousOwnerUid: "viejo" })
})

test("si ya es del nuevo autor no hay nada que cambiar", () => {
  assert.equal(transferPatch(makeActivity({ kind: "site", siteId: "s1", ownerUid: "nuevo" }), nuevo), null)
})

test("una actividad global nunca se transfiere por un reclamo de sitio", () => {
  assert.equal(transferPatch(makeActivity({ kind: "global", siteId: null, ownerUid: "viejo" }), nuevo), null)
})
