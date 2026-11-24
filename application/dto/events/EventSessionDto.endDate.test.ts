import { test } from "node:test"
import assert from "node:assert/strict"
import * as v from "valibot"
import { SessionSchema } from "./EventSessionDto"

const base = { title: "Noche 1", description: { type: "doc", attrs: {}, content: [{ type: "paragraph", content: [{ type: "text", text: "Una noche de comedia en vivo" }] }] }, location: { country: { isoCode: "CO", name: "Colombia", slug: "" }, department: { isoCode: "TOL", name: "Tolima", slug: "" }, city: { name: "Ibagué", slug: "ibague" }, venue: "Brewing", address: "Calle 60", coordinates: { lat: 4.4, lng: -75.2 } }, startDate: "2026-11-29T02:00:00.000Z", registrationType: "none", price: { isFree: true, amount: 0, currency: "COP" }, status: "published", coverSource: "parent" }

test("una sesión sin fin dura hasta el final de su día", () => {
  const r = v.safeParse(SessionSchema, base)
  assert.equal(r.success, true, JSON.stringify(r.issues))
  if (r.success) assert.equal(r.output.endDate, "2026-11-29T04:59:59.999Z")
})

test("una sesión con fin anterior al inicio sigue fallando", () => {
  const r = v.safeParse(SessionSchema, { ...base, endDate: "2026-11-28T00:00:00.000Z" })
  assert.equal(r.success, false)
})
