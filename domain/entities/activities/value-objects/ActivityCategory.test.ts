import { test } from "node:test"
import assert from "node:assert/strict"
import { ACTIVITY_CATEGORIES, COMPANIONS, isActivityCategory, isCompanion, requiresManualReview } from "./ActivityCategory"
import { budgetBand } from "./Budget"

test("hay 16 categorías con slug único en minúsculas y con guiones", () => {
  assert.equal(ACTIVITY_CATEGORIES.length, 16)
  const slugs = ACTIVITY_CATEGORIES.map((c) => c.slug)
  assert.equal(new Set(slugs).size, 16)
  for (const s of slugs) assert.match(s, /^[a-z]+(-[a-z]+)*$/)
})

test("isActivityCategory acepta solo slugs conocidos", () => {
  assert.equal(isActivityCategory("aire-libre"), true)
  assert.equal(isActivityCategory("otros"), true)
  assert.equal(isActivityCategory("nada"), false)
  assert.equal(isActivityCategory(3), false)
})

test("solo 'otros' exige revisión manual", () => {
  assert.equal(requiresManualReview("otros"), true)
  assert.equal(requiresManualReview("aire-libre"), false)
})

test("companions: seis valores válidos", () => {
  assert.deepEqual([...COMPANIONS], ["solo", "pareja", "familia", "amigos", "ninos", "mascotas"])
  assert.equal(isCompanion("familia"), true)
  assert.equal(isCompanion("jefe"), false)
})

test("budgetBand en los bordes de cada banda", () => {
  assert.equal(budgetBand(0), "gratis")
  assert.equal(budgetBand(1), "hasta-20000")
  assert.equal(budgetBand(20000), "hasta-20000")
  assert.equal(budgetBand(20001), "hasta-50000")
  assert.equal(budgetBand(50000), "hasta-50000")
  assert.equal(budgetBand(50001), "hasta-100000")
  assert.equal(budgetBand(100000), "hasta-100000")
  assert.equal(budgetBand(100001), "mas-de-100000")
})
