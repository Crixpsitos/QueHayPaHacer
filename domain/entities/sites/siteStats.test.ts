import { describe, it } from "node:test"
import assert from "node:assert/strict"
import * as v from "valibot"
import { bogotaDay, isSiteTrackType } from "./siteStats"
import { SiteIdSchema, SiteTrackBodySchema } from "@/application/dto/sites/SiteTrackDto"
import { firstViewOfSession } from "@/app/lib/siteTrack"

describe("bogotaDay", () => {
  it("usa el día de Bogotá, no el de UTC", () => {
    assert.equal(bogotaDay(new Date("2026-10-18T03:30:00Z")), "2026-10-17") // 22:30 del 17 en Bogotá
    assert.equal(bogotaDay(new Date("2026-10-18T05:00:00Z")), "2026-10-18") // 00:00 del 18
  })
})

describe("cuerpo y id del endpoint de medición", () => {
  it("acepta los tipos conocidos", () => {
    for (const type of ["view", "directions", "website", "social", "booking", "call", "share", "transit"]) {
      assert.ok(v.safeParse(SiteTrackBodySchema, { type }).success, type)
      assert.ok(isSiteTrackType(type))
    }
  })
  it("rechaza tipos inventados, cuerpos vacíos y ids raros", () => {
    assert.ok(!v.safeParse(SiteTrackBodySchema, { type: "hack" }).success)
    assert.ok(!v.safeParse(SiteTrackBodySchema, {}).success)
    assert.ok(!v.safeParse(SiteTrackBodySchema, null).success)
    assert.ok(!isSiteTrackType(undefined))
    assert.ok(v.safeParse(SiteIdSchema, "LtQBBkrcb7O0cKa9JQ2u").success)
    assert.ok(!v.safeParse(SiteIdSchema, "../etc").success)
    assert.ok(!v.safeParse(SiteIdSchema, "a".repeat(129)).success)
  })
})

describe("firstViewOfSession", () => {
  const fake = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, val: string) => void m.set(k, val) }
  }
  it("cuenta la primera vez por sitio y no la repetida", () => {
    const s = fake()
    assert.equal(firstViewOfSession("a", s), true)
    assert.equal(firstViewOfSession("a", s), false)
    assert.equal(firstViewOfSession("b", s), true)
  })
  it("sessionStorage bloqueado: cuenta siempre y no lanza", () => {
    const boom = { getItem: () => { throw new Error("x") }, setItem: () => { throw new Error("x") } }
    assert.equal(firstViewOfSession("a", boom), true)
  })
})
