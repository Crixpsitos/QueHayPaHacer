import { test } from "node:test"
import assert from "node:assert/strict"
import { GeoPoint, Timestamp } from "firebase-admin/firestore"
import { removeUndefinedProperties } from "./removeUndefinedProperties"

test("removeUndefinedProperties quita undefined sin romper instancias de Firestore", () => {
  const geo = new GeoPoint(4.44, -75.24)
  const ts = Timestamp.fromMillis(0)
  const out = removeUndefinedProperties({ a: undefined, loc: { coordinates: geo, extra: undefined }, ts, list: [{ x: undefined, y: 1 }] })
  assert.deepEqual(Object.keys(out), ["loc", "ts", "list"])
  assert.ok(out.loc.coordinates instanceof GeoPoint)
  assert.equal(out.loc.coordinates.latitude, 4.44)
  assert.ok(out.ts instanceof Timestamp)
  assert.deepEqual(out.list, [{ y: 1 }])
})
