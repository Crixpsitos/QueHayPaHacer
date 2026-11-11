import { test } from "node:test"
import assert from "node:assert/strict"
import { isIndexableCollection, MIN_COLLECTION_INTRO_CHARS, MIN_COLLECTION_ITEMS } from "./collectionRule"

const intro = "x".repeat(MIN_COLLECTION_INTRO_CHARS)

test("texto propio suficiente y 3 o más actividades: se indexa", () => assert.equal(isIndexableCollection(intro, MIN_COLLECTION_ITEMS), true))
test("con 2 actividades: noindex", () => assert.equal(isIndexableCollection(intro, MIN_COLLECTION_ITEMS - 1), false))
test("sin texto propio (o muy corto): noindex", () => {
  assert.equal(isIndexableCollection("", 10), false)
  assert.equal(isIndexableCollection("x".repeat(MIN_COLLECTION_INTRO_CHARS - 1), 10), false)
})
test("los espacios no cuentan como texto", () => assert.equal(isIndexableCollection(" ".repeat(500), 10), false))
